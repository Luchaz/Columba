import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS, createNowPlayingPayload } from '../utils/embedBuilder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Mengatur tingkat volume suara musik (1% hingga 100%)')
    .addIntegerOption((option) =>
      option
        .setName('level')
        .setDescription('Angka volume antara 1 sampai 100')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue<QueueMetadata>(interaction.guildId!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.WARNING)
            .setDescription('ℹ️ **Tidak ada lagu yang sedang diputar saat ini.**'),
        ],
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member as GuildMember;
    const botVoice = interaction.guild?.members.me?.voice.channel;
    if (botVoice && member.voice.channelId !== botVoice.id) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.ERROR)
            .setDescription('❌ **Kamu harus berada di Voice Channel yang sama dengan bot untuk mengubah volume!**'),
        ],
        ephemeral: true,
      });
      return;
    }

    const level = interaction.options.getInteger('level', true);
    queue.node.setVolume(level);

    // Perbarui kartu Now Playing aktif agar angka volume di Embed ikut berubah real-time
    if (queue.metadata?.lastPlayerMessage && queue.currentTrack) {
      await queue.metadata.lastPlayerMessage
        .edit(createNowPlayingPayload(queue, queue.currentTrack))
        .catch(() => null);
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND_COLORS.SUCCESS)
          .setDescription(`🔊 **Volume suara berhasil diatur ke \`${level}%\` oleh ${interaction.user}.**`),
      ],
    });
  },
};

export default command;
