import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';
import { LAB_INFOS, StudentRecord } from '../data/academicData';
import { studentManager } from '../data/studentManager';

export function buildStudentDetailEmbed(student: StudentRecord): EmbedBuilder {
  const lab = LAB_INFOS[student.lab];
  const maskedNrp = student.nrp.length > 4 ? `${student.nrp.slice(0, 6)}****` : student.nrp;

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLORS.MERPATI_DARK)
    .setTitle(student.name)
    .setDescription(
      [
        `-# NRP: \`${maskedNrp}\` • Magister Sistem Informasi ITS 2026`,
        '',
        '### Pembimbing & Laboratorium',
        `• **Dosen Pembimbing:** ${student.advisor}`,
        `• **Laboratorium:** Lab ${lab ? lab.name : student.lab} (\`${student.lab}\`)`,
        `• **Fokus Riset Lab:** *${lab ? lab.focus : '-'}*`,
        '',
        '### Fokus Keahlian & Minat',
        student.expertise
          ? `> ${student.expertise}`
          : '-# Dapat diperbarui melalui `/profil set`.',
        '',
        '### Rencana Topik Tesis',
        student.thesisTopic
          ? `> ${student.thesisTopic}`
          : '-# Belum diisi. Dapat diperbarui melalui `/profil set`.',
      ].join('\n')
    )
    .setFooter({
      text: 'Columba • S2 SI ITS Academic Directory',
    });

  return embed;
}

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('mahasiswa')
    .setDescription('Direktori profil mahasiswa, NRP, dosen pembimbing & lab S2 SI ITS 2026')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Ketik nama atau NRP mahasiswa')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().trim().toLowerCase();
    const students = studentManager.getAll();

    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(focusedValue) ||
        s.nrp.includes(focusedValue) ||
        s.lab.toLowerCase().includes(focusedValue) ||
        (s.expertise && s.expertise.toLowerCase().includes(focusedValue))
    );

    const choices = filtered.slice(0, 25).map((s) => ({
      name: s.name,
      value: s.nrp,
    }));

    await interaction.respond(choices);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query');

    // 1. Jika user mencari spesifik mahasiswa
    if (query && query.trim() !== '') {
      const match = studentManager.getByNrp(query) || studentManager.search(query)[0];

      if (!match) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(`Data mahasiswa untuk pencarian \`${query}\` tidak ditemukan.\n-# Ketik nama lengkap atau NRP yang sesuai.`),
          ],
          ephemeral: true,
        });
        return;
      }

      const embed = buildStudentDetailEmbed(match);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 2. Jika tanpa query, tampilkan direktori ringkasan seluruh angkatan
    const students = studentManager.getAll();
    const labCounts: Record<string, number> = {
      RDIB: 0,
      MSI: 0,
      SE: 0,
      IKTI: 0,
      ADDI: 0,
    };

    for (const s of students) {
      if (labCounts[s.lab] !== undefined) {
        labCounts[s.lab]++;
      }
    }

    const summaryEmbed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle('Direktori Mahasiswa • S2 Sistem Informasi ITS 2026')
      .setDescription(
        [
          `Total Mahasiswa Aktif: **${students.length} orang**`,
          '',
          '### Distribusi Laboratorium Riset Tesis',
          `• **RDIB** (Rekayasa Data & BI): **${labCounts.RDIB} mahasiswa**`,
          `• **MSI** (Manajemen Sistem Informasi): **${labCounts.MSI} mahasiswa**`,
          `• **SE** (Sistem Enterprise): **${labCounts.SE} mahasiswa**`,
          `• **IKTI** (Infrastruktur & Keamanan TI): **${labCounts.IKTI} mahasiswa**`,
          `• **ADDI** (Akuisisi Data & Diseminasi Info): **${labCounts.ADDI} mahasiswa**`,
          '',
          '-# Ketik `/mahasiswa query:<nama/nrp>` untuk melihat profil individu, atau gunakan menu di bawah untuk filter per lab.',
        ].join('\n')
      )
      .setFooter({ text: 'Columba • S2 SI ITS' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_lab_directory')
      .setPlaceholder('Pilih Laboratorium untuk melihat daftar anggota...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Lab RDIB (Rekayasa Data & BI)')
          .setDescription(`${labCounts.RDIB} Mahasiswa bimbingan`)
          .setValue('RDIB'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Lab MSI (Manajemen Sistem Informasi)')
          .setDescription(`${labCounts.MSI} Mahasiswa bimbingan`)
          .setValue('MSI'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Lab SE (Sistem Enterprise)')
          .setDescription(`${labCounts.SE} Mahasiswa bimbingan`)
          .setValue('SE'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Lab IKTI (Infrastruktur & Keamanan TI)')
          .setDescription(`${labCounts.IKTI} Mahasiswa bimbingan`)
          .setValue('IKTI'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Lab ADDI (Akuisisi Data & Info)')
          .setDescription(`${labCounts.ADDI} Mahasiswa bimbingan`)
          .setValue('ADDI')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      embeds: [summaryEmbed],
      components: [row],
    });
  },
};

export default command;
