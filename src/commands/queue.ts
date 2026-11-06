import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS, createQueuePayload } from '../utils/embedBuilder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Melihat daftar antrean lagu server dengan navigasi halaman interaktif'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue<QueueMetadata>(interaction.guildId!);

    if (!queue || !queue.currentTrack) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.WARNING)
            .setDescription('📜 **Antrean musik saat ini masih kosong.** Gunakan `/play` untuk menambahkan lagu!'),
        ],
        ephemeral: true,
      });
      return;
    }

    const payload = createQueuePayload(queue, 0);
    await interaction.reply(payload);
  },
};

export default command;
