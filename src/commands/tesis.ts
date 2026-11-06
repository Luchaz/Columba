import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('tesis')
    .setDescription('Panduan tesis, struktur proposal, lembar pengesahan & portal UGDSI S2 SI ITS')
    .addStringOption((opt) =>
      opt
        .setName('topik')
        .setDescription('Pilih topik informasi tesis')
        .setRequired(false)
        .addChoices(
          { name: 'Struktur Proposal Tesis (Bab 1 - Bab 3)', value: 'proposal' },
          { name: 'Lembar Pengesahan & Dewan Penguji', value: 'pengesahan' },
          { name: 'Alur & Milestone Tesis', value: 'alur' },
          { name: 'Portal UGDSI & Berkas Resmi', value: 'portal' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const topic = interaction.options.getString('topik') || 'portal';

    if (topic === 'proposal') {
      const embed = new EmbedBuilder()
        .setColor(BRAND_COLORS.MERPATI_DARK)
        .setTitle('Struktur Proposal Tesis • S2 Sistem Informasi ITS')
        .setDescription(
          [
            '-# Panduan resmi Program Magister Departemen Sistem Informasi FTEIC ITS',
            '',
            '### Halaman Awal',
            '• Sampul Depan (Judul, Nama Mahasiswa, NRP, Dosen Pembimbing, NIP)',
            '• Lembar Pengesahan Proposal Tesis',
            '• Abstrak & Kata Kunci (Bahasa Indonesia & English)',
            '• Daftar Isi, Daftar Gambar, Daftar Tabel',
            '',
            '### Bab 1 — Pendahuluan',
            '• `1.1` Latar Belakang (Fenomena empiris, gap riset, dan motivasi)',
            '• `1.2` Rumusan Masalah (Pertanyaan penelitian spesifik)',
            '• `1.3` Tujuan Penelitian',
            '• `1.4` Manfaat Penelitian',
            '• `1.5` Kontribusi Penelitian (Teoretis dan praktis)',
            '• `1.6` Batasan Penelitian (Lingkup dan asumsi)',
            '',
            '### Bab 2 — Kajian Pustaka dan Dasar Teori',
            '• `2.1` Kajian Pustaka (*State of the art* dari artikel jurnal bereputasi)',
            '• `2.2` Dasar Teori (Kerangka kerja, model konseptual, atau algoritma)',
            '',
            '### Bab 3 — Metodologi Penelitian',
            '• `3.1` Diagram Metodologi Penelitian (*Flowchart* tahapan penelitian)',
            '• `3.2` Uraian Metodologi Penelitian (Prosedur rinci per fase)',
            '• `3.3` Rencana Jadwal Pelaksanaan Penelitian (*Gantt Chart*)',
            '',
            '### Daftar Pustaka',
            '• Format sitasi standar IEEE atau APA (wajib menggunakan Mendeley / Zotero)',
            '',
            '-# Template naskah lengkap (.docx) dapat diunduh di portal UGDSI (its.id/ugdsi)',
          ].join('\n')
        )
        .setFooter({ text: 'S2 SI ITS • Panduan Proposal Tesis' });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (topic === 'pengesahan') {
      const embed = new EmbedBuilder()
        .setColor(BRAND_COLORS.MERPATI_DARK)
        .setTitle('Lembar Pengesahan Proposal Tesis')
        .setDescription(
          [
            '-# Departemen Sistem Informasi • FTEIC ITS',
            '',
            '### Format Header Lembar Pengesahan',
            '```text',
            'LEMBAR PENGESAHAN PROPOSAL TESIS',
            'Judul   : [Judul Usulan Penelitian]',
            'Oleh    : [Nama Mahasiswa]',
            'NRP     : [NRP Mahasiswa]',
            'Telah diseminarkan pada:',
            'Hari    : [Hari Pelaksanaan]',
            'Tanggal : [Tanggal Seminar]',
            'Tempat  : Ruang Sidang Jurusan Sistem Informasi / Daring',
            '```',
            '',
            '### Komposisi Pengesahan',
            '• **Dosen Pembimbing:** Nama Dosen Pembimbing & NIP',
            '• **Dosen Penguji 1:** Nama Dosen Penguji & NIP',
            '• **Dosen Penguji 2:** Nama Dosen Penguji & NIP',
            '',
            '-# Pastikan naskah proposal telah disetujui dosen pembimbing sebelum diajukan ke prodi.',
          ].join('\n')
        )
        .setFooter({ text: 'S2 SI ITS • Lembar Pengesahan' });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (topic === 'alur') {
      const embed = new EmbedBuilder()
        .setColor(BRAND_COLORS.MERPATI_DARK)
        .setTitle('Alur & Milestone Tesis • S2 Sistem Informasi ITS')
        .setDescription(
          [
            '-# Tahapan penyelesaian tesis Magister Sistem Informasi ITS',
            '',
            '**1. Penetapan Dosen Pembimbing & Topik**',
            '> Penentuan laboratorium riset tesis (RDIB, MSI, SE, IKTI, ADDI) dan dosen pembimbing.',
            '',
            '**2. Penyusunan & Seminar Proposal (Sempro)**',
            '> Menyusun Bab 1–3 dan melaksanakan seminar proposal di hadapan tim penguji.',
            '',
            '**3. Penelitian & Seminar Kemajuan**',
            '> Pelaksanaan penelitian, analisis data, dan pelaporan progres berkala.',
            '',
            '**4. Publikasi Ilmiah Bereputasi**',
            '> Submit dan publikasi artikel ilmiah pada jurnal/konferensi terindeks (Scopus / SINTA).',
            '',
            '**5. Seminar Hasil (Semhas) & Ujian Akhir Tesis**',
            '> Ujian akhir tesis di Ruang Sidang Departemen Sistem Informasi.',
            '',
            '**6. Yudisium & Wisuda**',
            '> Pengumpulan naskah final (*hardcover* & repositori perpustakaan) dan kelulusan.',
          ].join('\n')
        )
        .setFooter({ text: 'S2 SI ITS • Roadmap Akademik' });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Default: Portal & Link Resmi
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle('Portal & Tautan Resmi • S2 Sistem Informasi ITS')
      .setDescription(
        [
          '-# Layanan informasi akademik dan administrasi Departemen Sistem Informasi ITS',
          '',
          '### UGDSI (Unit Gawat Dokumen Sistem Informasi)',
          '> **Link:** [its.id/ugdsi](https://its.id/ugdsi) atau [intip.in/UGDSI](http://intip.in/UGDSI)',
          'Pusat berkas resmi, template naskah tesis, panduan yudisium, dan SOP akademik.',
          '',
          '### Website Departemen Sistem Informasi',
          '> **Link:** [its.ac.id/si](https://www.its.ac.id/si/)',
          'Informasi profil departemen, daftar dosen, riset laboratorium, dan berita akademik.',
          '',
          '### Portal myITS',
          '> **Link:** [my.its.ac.id](https://my.its.ac.id)',
          'Sistem informasi akademik (FRS, transkrip, presensi, dan layanan terpadu mahasiswa).',
          '',
          '-# Ketik `/tesis topik:proposal` untuk melihat format penulisan proposal tesis.',
        ].join('\n')
      )
      .setFooter({ text: 'Columba • S2 SI ITS' });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
