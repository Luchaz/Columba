import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';
import { studentManager } from '../data/studentManager';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ultah')
    .setDescription('Lihat daftar ulang tahun mahasiswa & dosen S2 SI ITS yang akan datang')
    .addIntegerOption((opt) =>
      opt
        .setName('rentang_hari')
        .setDescription('Rentang hari ke depan untuk dicek (default: 30 hari, maks: 90 hari)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(90)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const daysAhead = interaction.options.getInteger('rentang_hari') || 30;
    const upcomingStudents = studentManager.getUpcomingBirthdays(daysAhead);
    const upcomingLecturers = studentManager.getUpcomingLecturerBirthdays(daysAhead);

    const todayStudents = upcomingStudents.filter((u) => u.daysLeft === 0);
    const todayLecturers = upcomingLecturers.filter((u) => u.daysLeft === 0);

    const futureStudents = upcomingStudents.filter((u) => u.daysLeft > 0);
    const futureLecturers = upcomingLecturers.filter((u) => u.daysLeft > 0);

    const embeds: EmbedBuilder[] = [];

    // Jika ada yang ulang tahun hari ini
    if (todayStudents.length > 0 || todayLecturers.length > 0) {
      const todayEntries: string[] = [];

      for (const b of todayStudents) {
        const mention = b.student.discordId ? `<@${b.student.discordId}>` : `**${b.student.name}**`;
        todayEntries.push(
          [
            `> ${mention} (${b.student.name})`,
            `> NRP: \`${b.student.nrp}\` • Lab ${b.student.lab}`,
            `> Pembimbing: ${b.student.advisor}`,
          ].join('\n')
        );
      }

      for (const l of todayLecturers) {
        todayEntries.push(
          [
            `> **${l.lecturer.fullName}**`,
            `> Dosen / Lab ${l.lecturer.lab}`,
          ].join('\n')
        );
      }

      const todayEmbed = new EmbedBuilder()
        .setColor(BRAND_COLORS.MERPATI_DARK)
        .setTitle('Ulang Tahun Hari Ini')
        .setDescription(
          [
            'Keluarga besar S2 Sistem Informasi ITS yang bertambah usia hari ini:',
            '',
            todayEntries.join('\n\n'),
            '',
            'Semoga senantiasa diberikan kelancaran dalam studi dan pengajaran, kemudahan dalam penyusunan tesis, serta kesehatan dan keberkahan.',
          ].join('\n')
        )
        .setFooter({ text: 'Columba • S2 SI ITS' });

      embeds.push(todayEmbed);
    }

    // Embed untuk ulang tahun mendatang
    const upcomingEmbed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle(`Ulang Tahun Mendatang (${daysAhead} Hari Ke Depan)`);

    const sections: string[] = [];

    if (futureStudents.length > 0) {
      const studentList = futureStudents
        .map((b) => {
          const daysText = b.daysLeft === 1 ? 'Besok' : `${b.daysLeft} hari lagi`;
          return `• **${b.dateStr}** — **${b.student.name}** [${b.student.lab}] • *${daysText}*`;
        })
        .join('\n');

      sections.push('### Mahasiswa Angkatan 2026', studentList);
    }

    if (futureLecturers.length > 0) {
      const lecturerList = futureLecturers
        .map((l) => {
          const daysText = l.daysLeft === 1 ? 'Besok' : `${l.daysLeft} hari lagi`;
          return `• **${l.dateStr}** — **${l.lecturer.fullName}** [${l.lecturer.lab}] • *${daysText}*`;
        })
        .join('\n');

      sections.push('### Dosen & Pembimbing Tesis', lecturerList);
    }

    if (sections.length > 0) {
      upcomingEmbed.setDescription(
        [
          sections.join('\n'),
          '',
          '-# Daftarkan tanggal lahirmu melalui perintah: `/profil set nrp:<NRP> ulang_tahun:DD-MM`',
        ].join('\n')
      );
    } else {
      upcomingEmbed.setDescription(
        [
          `Tidak ada data ulang tahun dalam **${daysAhead} hari ke depan**.`,
          '',
          '-# Daftarkan tanggal lahirmu melalui: `/profil set nrp:<NRP> ulang_tahun:DD-MM`',
        ].join('\n')
      );
    }

    upcomingEmbed.setFooter({ text: 'Columba • S2 SI ITS' });
    embeds.push(upcomingEmbed);

    await interaction.reply({ embeds });
  },
};

export default command;
