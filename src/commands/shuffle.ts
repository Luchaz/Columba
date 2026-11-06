import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Acak urutan lagu yang ada di dalam antrean'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue<QueueMetadata>(interaction.guildId!);

    if (!queue || !queue.currentTrack || queue.tracks.size < 2) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.MERPATI_DARK)
            .setDescription('🔀 Minimal harus ada **2 lagu** di dalam antrean untuk di-shuffle!'),
        ],
        ephemeral: true,
      });
      return;
    }

    const count = queue.tracks.size;
    queue.tracks.shuffle();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND_COLORS.MERPATI_DARK)
          .setDescription(`🔀 Berhasil mengacak **${count} lagu** di dalam antrean.`),
      ],
    });
  },
};

export default command;
