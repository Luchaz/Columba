import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { useQueue } from 'discord-player';
import { BotCommand, QueueMetadata } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Melewati lagu yang sedang diputar ke lagu berikutnya di antrean'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue<QueueMetadata>(interaction.guildId!);

    if (!queue || !queue.isPlaying() || !queue.currentTrack) {
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
            .setDescription('❌ **Kamu harus berada di Voice Channel yang sama dengan bot untuk melewati lagu!**'),
        ],
        ephemeral: true,
      });
      return;
    }

    const skippedTrack = queue.currentTrack;
    queue.node.skip();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND_COLORS.PRIMARY)
          .setDescription(`⏭️ **Melewati lagu:** [${skippedTrack.title}](${skippedTrack.url}) (Oleh ${interaction.user})`),
      ],
    });
  },
};

export default command;
