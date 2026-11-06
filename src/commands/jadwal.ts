import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';
import { COURSE_SCHEDULES, CourseSchedule } from '../data/academicData';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('jadwal')
    .setDescription('Jadwal perkuliahan mingguan Magister Sistem Informasi ITS 2026')
    .addStringOption((opt) =>
      opt
        .setName('hari')
        .setDescription('Pilih hari tertentu atau tampilkan seluruh jadwal')
        .setRequired(false)
        .addChoices(
          { name: 'Semua Hari (Mingguan)', value: 'semua' },
          { name: 'Hari Ini', value: 'hari_ini' },
          { name: 'Selasa', value: 'Selasa' },
          { name: 'Rabu', value: 'Rabu' },
          { name: 'Kamis', value: 'Kamis' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const filter = interaction.options.getString('hari') || 'semua';

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    // UTC+7 (WIB)
    const wibDayIndex = (now.getUTCDay() + (now.getUTCHours() + 7 >= 24 ? 1 : 0)) % 7;
    const currentDayName = dayNames[wibDayIndex];

    let targetCourses: CourseSchedule[] = COURSE_SCHEDULES;
    let headerTitle = 'Jadwal Perkuliahan S2 Sistem Informasi ITS';
    let subHeader = '-# Magister Sistem Informasi ITS • Kelas A';

    if (filter === 'hari_ini') {
      targetCourses = COURSE_SCHEDULES.filter((c) => c.day === currentDayName);
      headerTitle = `Jadwal Kuliah Hari Ini (${currentDayName})`;
    } else if (filter !== 'semua') {
      targetCourses = COURSE_SCHEDULES.filter((c) => c.day.toLowerCase() === filter.toLowerCase());
      headerTitle = `Jadwal Kuliah Hari ${filter}`;
    }

    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle(headerTitle);

    if (targetCourses.length === 0) {
      embed.setDescription(
        [
          subHeader,
          '',
          `Tidak ada agenda perkuliahan untuk hari **${currentDayName}**.`,
          '',
          '-# Gunakan `/jadwal hari:semua` untuk melihat seluruh jadwal mingguan.',
        ].join('\n')
      );
    } else {
      const courseEntries = targetCourses
        .map((c) => {
          return [
            `### ${c.name} (${c.classGroup})`,
            `> **Waktu:** ${c.day}, ${c.time}`,
            `> **Ruangan:** \`${c.room}\``,
            `> **Kode Matkul:** \`${c.code}\``,
            `> **Dosen Pengampu:** ${c.lecturers.join(', ')}`,
          ].join('\n');
        })
        .join('\n\n');

      embed.setDescription(
        [
          subHeader,
          '',
          courseEntries,
          '',
          '-# Sumber data: Sistem Akademik Departemen Sistem Informasi ITS (its.ac.id/si)',
        ].join('\n')
      );
    }

    embed.setFooter({ text: 'Columba • S2 SI ITS' });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
