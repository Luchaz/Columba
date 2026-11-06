import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('kalender')
    .setDescription('Kalender akademik, jadwal perkuliahan, evaluasi UTS/UAS & milestone ITS'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle('Kalender Akademik • Pascasarjana ITS')
      .setDescription(
        [
          '-# Agenda perkuliahan dan milestone penting semester aktif',
          '',
          '### Siklus Perkuliahan Semester',
          '• **Perkuliahan Tahap 1:** Minggu ke-1 hingga Minggu ke-7',
          '• **Evaluasi Tengah Semester (UTS):** Minggu ke-8 hingga Minggu ke-9',
          '• **Perkuliahan Tahap 2:** Minggu ke-10 hingga Minggu ke-15',
          '• **Evaluasi Akhir Semester (UAS):** Minggu ke-16 hingga Minggu ke-17',
          '• **Batas Entri & Finalisasi Nilai:** Minggu ke-18',
          '',
          '### Milestone Tesis & Kelulusan',
          '• **Seminar Proposal (Sempro):** Dibuka sepanjang semester aktif via persetujuan lab & prodi',
          '• **Seminar Kemajuan Tesis:** Dijadwalkan berkala oleh masing-masing laboratorium riset',
          '• **Pendaftaran Sidang Akhir:** Sesuai batas tanggal pengumuman berkas di portal UGDSI',
          '• **Periode Wisuda ITS:** Dilaksanakan 2 kali dalam setahun (periode Maret dan September)',
          '',
          '### Tautan Informasi Resmi',
          '• Kalender Akademik ITS: [its.ac.id/akademik](https://www.its.ac.id/akademik/)',
          '• Pengumuman DSI: [its.ac.id/si](https://www.its.ac.id/si/)',
          '• Berkas Akademik: [its.id/ugdsi](https://its.id/ugdsi)',
        ].join('\n')
      )
      .setFooter({ text: 'Columba • S2 SI ITS' });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
