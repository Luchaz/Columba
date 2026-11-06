import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';
import { LAB_INFOS, LabCode } from '../data/academicData';
import { studentManager } from '../data/studentManager';

export function buildLabDetailEmbed(labCode: string): EmbedBuilder {
  const upper = labCode.toUpperCase().trim() as LabCode;
  const lab = LAB_INFOS[upper];
  const students = studentManager.getByLab(upper);

  if (!lab) {
    return new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setDescription(`Laboratorium \`${labCode}\` tidak ditemukan.`);
  }

  // Cari dosen-dosen di lab ini
  const advisors = studentManager.getAllAdvisors().filter((a) => a.lab === upper);
  const advisorList = advisors.length > 0
    ? advisors.map((a) => `• **${a.name}** (${a.students.length} mahasiswa)`).join('\n')
    : '-# Belum ada dosen pembimbing terdaftar';

  const studentList = students.length > 0
    ? students
        .map(
          (s, idx) =>
            `\`${idx + 1}.\` **${s.name}** (\`${s.nrp}\`) — *Pembimbing: ${s.advisor}*`
        )
        .join('\n')
    : '-# Belum ada mahasiswa terdaftar';

  return new EmbedBuilder()
    .setColor(BRAND_COLORS.MERPATI_DARK)
    .setTitle(`Laboratorium ${lab.code} • Departemen SI ITS`)
    .setDescription(
      [
        `**Nama Lengkap:** ${lab.name}`,
        `*${lab.englishName}*`,
        '',
        '### Fokus Riset',
        `> ${lab.focus}`,
        '',
        '### Dosen Pembimbing',
        advisorList,
        '',
        `### Mahasiswa Angkatan 2026 (${students.length} orang)`,
        studentList,
      ].join('\n')
    )
    .setFooter({
      text: 'Columba • S2 SI ITS Academic Directory',
    });
}

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('lab')
    .setDescription('Informasi 5 laboratorium riset, fokus riset, dosen & mahasiswa S2 SI ITS 2026')
    .addStringOption((option) =>
      option
        .setName('kode')
        .setDescription('Pilih kode laboratorium riset')
        .setRequired(false)
        .addChoices(
          { name: 'RDIB — Rekayasa Data & Inteligensi Bisnis', value: 'RDIB' },
          { name: 'MSI — Manajemen Sistem Informasi', value: 'MSI' },
          { name: 'SE — Sistem Enterprise', value: 'SE' },
          { name: 'IKTI — Infrastruktur & Keamanan TI', value: 'IKTI' },
          { name: 'ADDI — Akuisisi Data & Diseminasi Informasi', value: 'ADDI' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const labCode = interaction.options.getString('kode');

    if (labCode) {
      const embed = buildLabDetailEmbed(labCode);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Tampilkan rangkuman seluruh lab
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle('Laboratorium Riset • Departemen Sistem Informasi ITS')
      .setDescription(
        [
          '-# Terdapat 5 laboratorium riset tesis di Departemen Sistem Informasi ITS',
          '',
          '**1. RDIB (Rekayasa Data dan Inteligensi Bisnis)**',
          '> Big data, data science, artificial intelligence, business intelligence, machine learning, analytics.',
          '',
          '**2. MSI (Manajemen Sistem Informasi)**',
          '> IT governance, IT service management, strategic alignment, risk management, audit SI, e-government.',
          '',
          '**3. SE (Sistem Enterprise)**',
          '> Enterprise architecture, business process management (BPM), process mining, ERP, supply chain.',
          '',
          '**4. IKTI (Infrastruktur dan Keamanan Teknologi Informasi)**',
          '> Cloud computing, network security, cybersecurity, IoT, mobile/distributed systems, privacy.',
          '',
          '**5. ADDI (Akuisisi Data dan Diseminasi Informasi)**',
          '> Linked open data, semantic web, ontologies, information extraction, knowledge graph, open data.',
          '',
          '-# Gunakan `/lab kode:<KODE>` untuk melihat daftar dosen & mahasiswa bimbingan per lab.',
        ].join('\n')
      )
      .setFooter({ text: 'S2 SI ITS 2026 • its.ac.id/si' });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
