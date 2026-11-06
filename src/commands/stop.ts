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
    const botVoice = interaction.guild?.members.me?.voice.channel;

    if (!queue && !botVoice) {
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

    if (queue) {
      await disableOldPlayerMessage(queue);
      queue.delete();
    }
    if (botVoice) {
      try {
        interaction.guild?.members.me?.voice.disconnect();
      } catch {}
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND_COLORS.ERROR)
          .setDescription(`⏹️ **Pemutaran musik dihentikan dan bot telah keluar dari Voice Channel oleh ${interaction.user}.**`),
      ],
    });
  },
};

export default command;
