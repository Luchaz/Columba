import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS, createNowPlayingPayload } from '../utils/embedBuilder';
import { disableOldPlayerMessage } from '../events/playerEvents';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Menampilkan ulang kartu kontrol interaktif untuk lagu yang sedang diputar'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue<QueueMetadata>(interaction.guildId!);

    if (!queue || !queue.isPlaying() || !queue.currentTrack) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.WARNING)
            .setDescription('ℹ️ **Saat ini tidak ada lagu yang sedang diputar.** Gunakan `/play` untuk memulai!'),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    // Nonaktifkan tombol pada kartu kontrol lama agar tidak ada 2 kartu aktif sekaligus
    await disableOldPlayerMessage(queue);

    const payload = createNowPlayingPayload(queue, queue.currentTrack);
    const sentMessage = await interaction.editReply(payload);

    if (queue.metadata) {
      queue.metadata.lastPlayerMessage = sentMessage;
    }
  },
};

export default command;
