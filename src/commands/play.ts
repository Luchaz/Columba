import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS, resolvePlatformTheme } from '../utils/embedBuilder';
import { isUrl, smartSearch } from '../utils/smartSearch';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu atau playlist dari Spotify, YouTube, atau judul lagu')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Tempel link Spotify/YouTube atau ketik judul lagu')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const focusedValue = interaction.options.getFocused().trim();

      if (focusedValue.length < 2) {
        await interaction.respond([]);
        return;
      }

      if (isUrl(focusedValue)) {
        const safeValue = focusedValue.length <= 100 ? focusedValue : focusedValue.slice(0, 100);
        await interaction.respond([
          {
            name: `▶️ Putar: ${focusedValue.slice(0, 85)}`,
            value: safeValue,
          },
        ]);
        return;
      }

      const player = useMainPlayer();
      const searchResult = await player.search(focusedValue, {
        requestedBy: interaction.user,
      });

      if (!searchResult.hasTracks()) {
        await interaction.respond([
          {
            name: `🔍 Cari: "${focusedValue.slice(0, 80)}"`,
            value: focusedValue.slice(0, 100),
          },
        ]);
        return;
      }

      const choices = searchResult.tracks.slice(0, 7).map((track) => {
        const rawLabel = `${track.title} by ${track.author}`;
        const safeName = rawLabel.length > 100 ? `${rawLabel.slice(0, 97)}...` : rawLabel;
        const safeValue =
          track.url.length <= 100 ? track.url : `${track.title} ${track.author}`.slice(0, 100);

        return {
          name: safeName,
          value: safeValue,
        };
      });

      await interaction.respond(choices);
    } catch {
      // Abaikan jika user sudah langsung menekan Enter
    }
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.MERPATI_DARK)
            .setDescription('❌ Masuk ke Voice Channel terlebih dahulu.'),
        ],
        ephemeral: true,
      });
      return;
    }

    const botVoiceChannel = interaction.guild?.members.me?.voice.channel;
    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.MERPATI_DARK)
            .setDescription(`⚠️ Bot sedang digunakan di ${botVoiceChannel}.`),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const query = interaction.options.getString('query', true);
    console.log(`▶️ [Command /play]: User ${interaction.user.tag} meminta "${query}" di Voice ${voiceChannel.name}`);
    const player = useMainPlayer();

    try {
      const searchResult = await smartSearch(player, query, interaction.user);

      if (!searchResult.hasTracks()) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(`❌ Lagu tidak ditemukan untuk \`${query}\`.`),
          ],
        });
        return;
      }

      const existingQueue = useQueue<QueueMetadata>(interaction.guildId!);
      const wasPlaying = Boolean(existingQueue && existingQueue.isPlaying());
      const defaultVolume = Number(process.env.DEFAULT_VOLUME) || 80;
      const leaveCooldown = Number(process.env.LEAVE_ON_EMPTY_COOLDOWN) || 180000;

      const { track } = await player.play(voiceChannel, searchResult, {
        connectionOptions: {
          deaf: true,
        },
        nodeOptions: {
          metadata: {
            channel: interaction.channel!,
            requestedBy: interaction.user,
            lastPlayerMessage: existingQueue?.metadata?.lastPlayerMessage ?? null,
            activeFilter: existingQueue?.metadata?.activeFilter ?? 'off',
          } satisfies QueueMetadata,
          volume: defaultVolume,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: leaveCooldown,
          leaveOnEnd: false,
          leaveOnStop: true,
          bufferingTimeout: 1000, // Buffer 1000ms untuk audio packet stream yang stabil & mencegah audio stuttering/pecah
          resampler: 48000, // Kualitas sampling audio 48kHz jernih
          selfDeaf: true,
        },
      });

      const theme = resolvePlatformTheme(track);
      const displayUrl = (track.raw as Record<string, string>)?.originalYoutubeUrl || track.url;
      const cleanTitle = track.title.replace(/\s+/g, ' ').trim();
      const cleanAuthor = (track.author || '').replace(/\s+/g, ' ').trim();
      const displayLinkText =
        cleanAuthor && !cleanTitle.toLowerCase().includes(cleanAuthor.toLowerCase())
          ? `${cleanTitle} by ${cleanAuthor}`
          : cleanTitle;

      if (searchResult.hasPlaylist() && searchResult.playlist) {
        const playlist = searchResult.playlist;
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(
                `${theme.emoji} Added **${searchResult.tracks.length} tracks** from **[${playlist.title}](${playlist.url || displayUrl})**`
              ),
          ],
        });
      } else if (wasPlaying) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(`${theme.emoji} Added **[${displayLinkText}](${displayUrl})** to the queue`),
          ],
        });
      } else {
        // Jika baru mulai memutar dari antrean kosong, hapus deferReply agar hanya muncul 1 notifikasi "Started playing"
        await interaction.deleteReply().catch(() => null);
      }
    } catch (error) {
      console.error('[Play Command Error]:', error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.MERPATI_DARK)
            .setDescription('❌ Gagal memutar lagu tersebut.'),
        ],
      });
    }
  }
};

export default command;
