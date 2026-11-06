import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';
import { LAB_INFOS, LECTURER_PROFILES, LecturerProfile } from '../data/academicData';
import { studentManager } from '../data/studentManager';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('dosen')
    .setDescription('Informasi profil, gelar, riwayat pendidikan & riset dosen S2 SI ITS')
    .addStringOption((option) =>
      option
        .setName('nama')
        .setDescription('Ketik nama dosen (contoh: Faizal, Apol, Tony, Nur Aini, Mahendrawathi)')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().trim().toLowerCase();
    const allLecturers = Object.values(studentManager.getLecturers());

    const filtered = allLecturers.filter((p) => {
      return (
        p.shortName.toLowerCase().includes(focusedValue) ||
        p.fullName.toLowerCase().includes(focusedValue) ||
        p.lab.toLowerCase().includes(focusedValue) ||
        p.expertise.some((e) => e.toLowerCase().includes(focusedValue))
      );
    });

    const choices = filtered.slice(0, 25).map((p) => {
      const titleName = p.fullName;
      return {
        name: titleName.length > 100 ? titleName.slice(0, 97) + '...' : titleName,
        value: p.shortName,
      };
    });

    await interaction.respond(choices);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('nama');
    const advisors = studentManager.getAllAdvisors();

    if (query && query.trim() !== '') {
      const cleanQuery = query.toLowerCase().trim();

      // Cari di profil dosen terlebih dahulu
      let foundProfile: LecturerProfile | undefined;
      for (const [key, p] of Object.entries(studentManager.getLecturers())) {
        if (
          key.toLowerCase().includes(cleanQuery) ||
          p.shortName.toLowerCase().includes(cleanQuery) ||
          p.fullName.toLowerCase().includes(cleanQuery)
        ) {
          foundProfile = p;
          break;
        }
      }

      // Cari data bimbingan mahasiswa jika ada
      const advisorMatch = advisors.find((a) => {
        return (
          a.name.toLowerCase().includes(cleanQuery) ||
          (foundProfile && a.name.toLowerCase().includes(foundProfile.shortName.toLowerCase()))
        );
      });

      if (!foundProfile && !advisorMatch) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(
                `Dosen dengan kata kunci \`${query}\` tidak ditemukan.\n-# Gunakan auto-complete atau ketik nama seperti: Faizal, Tony Dwi Susanto, Apol, Nur Aini, Erma, Mahendrawathi.`
              ),
          ],
          ephemeral: true,
        });
        return;
      }

      const labCode = foundProfile ? foundProfile.lab : (advisorMatch?.lab || 'MSI');
      const lab = LAB_INFOS[labCode];
      const p = foundProfile || advisorMatch?.profile;
      const students = advisorMatch?.students || [];

      const studentList = students.length > 0
        ? students
            .map((s, idx) => {
              const topicStr = s.thesisTopic ? `\n  -# Topik: ${s.thesisTopic}` : '';
              const maskedNrp = s.nrp.length > 4 ? `${s.nrp.slice(0, 6)}****` : s.nrp;
              return `\`${idx + 1}.\` **${s.name}** (\`${maskedNrp}\`)${topicStr}`;
            })
            .join('\n')
        : '-# Dosen Pengampu Mata Kuliah Pascasarjana';

      const expertiseStr = p && p.expertise.length > 0
        ? p.expertise.map((e) => `\`${e}\``).join(' • ')
        : '-';

      const educationStr = p && p.education && p.education.length > 0
        ? p.education.map((e) => `• ${e.replace(/🎓\s*/g, '')}`).join('\n')
        : '-';

      const embed = new EmbedBuilder()
        .setColor(BRAND_COLORS.MERPATI_DARK)
        .setTitle(p ? p.fullName : (advisorMatch?.name || query))
        .setDescription(
          [
            `-# Departemen Sistem Informasi ITS • Lab ${lab ? lab.name : labCode} (${labCode})`,
            `-# Jabatan: ${p ? p.role : 'Dosen Pascasarjana Sistem Informasi ITS'}`,
            '',
            '### Riwayat Pendidikan',
            educationStr,
            '',
            '### Bidang Keahlian',
            expertiseStr,
            '',
            '### Fokus Riset',
            `> *${p?.researchFocus || (lab ? lab.focus : '-')}*`,
            '',
            '### Karakteristik Bimbingan',
            p ? p.description : 'Fokus bimbingan riset sesuai dengan cakupan laboratorium.',
            '',
            `### Mahasiswa Bimbingan (${students.length} orang)`,
            studentList,
            '',
            '### Kontak & Informasi',
            p?.email ? `• Email: \`${p.email}\`` : '• Email: Departemen Sistem Informasi ITS',
            p?.profileUrl ? `• Profil Resmi: [Website DSI ITS](${p.profileUrl})` : '• Profil: [its.ac.id/si](https://www.its.ac.id/si/)',
          ].filter(Boolean).join('\n')
        )
        .setFooter({ text: 'S2 SI ITS • Columba Academic Directory' });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Tampilkan rangkuman seluruh dosen pembimbing & pengampu
    const allLecturers = Object.values(studentManager.getLecturers());
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle('Direktori Dosen Pascasarjana S2 SI ITS')
      .setDescription(
        [
          '-# Departemen Sistem Informasi • Institut Teknologi Sepuluh Nopember',
          '',
          ...allLecturers.map((p) => {
            const adv = advisors.find((a) => a.name.toLowerCase().includes(p.shortName.toLowerCase()));
            const countStr = adv ? `${adv.students.length} mhs bimbingan` : 'Dosen Pengampu';
            return `• **${p.fullName}**\n  -# Lab ${p.lab} • ${countStr}`;
          }),
          '',
          '-# Ketik `/dosen nama:<nama>` untuk melihat profil lengkap, pendidikan, dan fokus riset.',
        ].join('\n')
      )
      .setFooter({ text: 'S2 SI ITS 2026 • its.ac.id/si' });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
