import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';
import { disableOldPlayerMessage } from '../events/playerEvents';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Menghentikan pemutaran musik, membersihkan antrean, dan keluar dari Voice Channel'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue<QueueMetadata>(interaction.guildId!);

    if (!queue) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.WARNING)
            .setDescription('ℹ️ **Tidak ada sesi musik yang aktif saat ini.**'),
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
            .setDescription('❌ **Kamu harus berada di Voice Channel yang sama dengan bot untuk menghentikan musik!**'),
        ],
        ephemeral: true,
      });
      return;
    }

    await disableOldPlayerMessage(queue);
    queue.delete();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND_COLORS.ERROR)
          .setDescription(`⏹️ **Pemutaran musik dihentikan dan antrean telah dibersihkan oleh ${interaction.user}.**`),
      ],
    });
  },
};

export default command;
