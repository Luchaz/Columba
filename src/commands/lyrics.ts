import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS, resolvePlatformTheme } from '../utils/embedBuilder';
import { findTrackLyrics } from '../utils/lyricsFinder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Mencari lirik lagu yang sedang diputar atau berdasarkan judul lagu tertentu')
    .addStringOption((option) =>
      option
        .setName('judul')
        .setDescription('Opsional: Ketik judul lagu jika ingin mencari lirik lagu lain')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const customQuery = interaction.options.getString('judul');
    const queue = useQueue<QueueMetadata>(interaction.guildId!);
    const currentTrack = queue?.currentTrack;

    if (!customQuery && !currentTrack) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.WARNING)
            .setDescription(
              'ℹ️ **Tidak ada lagu yang sedang diputar.** Silakan putar lagu atau masukkan parameter `judul` pada `/lyrics`.'
            ),
        ],
      });
      return;
    }

    const searchTitle = customQuery || currentTrack!.title;
    const searchArtist = customQuery ? '' : currentTrack!.author;

    const result = await findTrackLyrics(searchTitle, searchArtist);

    if (!result) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.ERROR)
            .setDescription(`📝 **Maaf, lirik untuk lagu \`${searchTitle}\` belum tersedia di database.**`),
        ],
      });
      return;
    }

    const theme = currentTrack
      ? resolvePlatformTheme(currentTrack)
      : { color: BRAND_COLORS.PRIMARY };

    const safeLyrics =
      result.lyrics.length > 3900
        ? `${result.lyrics.slice(0, 3900)}\n\n*... (Lirik dipotong karena batas karakter Discord)*`
        : result.lyrics;

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(theme.color)
          .setTitle(`📝 ${result.title} — ${result.artist}`)
          .setDescription(safeLyrics)
          .setThumbnail(currentTrack?.thumbnail || null)
          .setFooter({
            text: `Sumber Lirik: ${result.source} • Ditampilkan secara privat (Ephemeral)`,
          })
          .setTimestamp(),
      ],
    });
  },
};

export default command;
