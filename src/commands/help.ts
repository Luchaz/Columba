import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Panduan perintah Columba — Akademik & Musik S2 SI ITS'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.MERPATI_DARK)
      .setTitle('Panduan Perintah • Columba')
      .setDescription(
        [
          '-# Bot pendamping open-source oleh Luchaz (yukheiw)',
          '• **GitHub**: [github.com/Luchaz/Columba](https://github.com/Luchaz/Columba)',
          '',
          '### Ekosistem Akademik & Tesis',
          '• `/jadwal [hari]` — Jadwal perkuliahan mingguan, ruangan & dosen pengampu',
          '• `/tesis [topik]` — Format proposal tesis, lembar pengesahan & portal UGDSI',
          '• `/kalender` — Kalender akademik pascasarjana ITS & agenda semester',
          '• `/mahasiswa [query]` — Direktori mahasiswa angkatan 2026, asal S1, pembimbing & lab',
          '• `/dosen [nama]` — Profil dosen, gelar lengkap, riwayat pendidikan & bidang riset',
          '• `/lab [kode]` — Informasi 5 laboratorium riset departemen dan anggotanya',
          '• `/profil lihat [query]` — Kartu profil mahasiswa lengkap dengan riwayat akademik',
          '• `/profil set [nrp] ...` — Perbarui data profil mandiri & tautkan akun Discord',
          '• `/ultah [rentang_hari]` — Cek hari ulang tahun dosen & mahasiswa mendatang',
          '',
          '### Pemutar Musik (24/7 Hi-Fi)',
          '• `/play <judul/link>` atau `.p <lagu>` — Putar lagu atau playlist (Spotify / YouTube)',
          '• `/nowplaying` atau `/np` atau `.np` — Tampilkan kartu lagu yang sedang diputar',
          '• `/queue` atau `.q` — Tampilkan daftar antrean lagu dengan paginasi',
          '• `/shuffle` atau `.sh` — Acak urutan lagu dalam antrean pemutaran',
          '• `/skip` atau `.s` — Lewati lagu yang sedang diputar',
          '• `/stop` atau `.stop` — Hentikan pemutaran musik dan bersihkan antrean',
          '• `/volume <1-100>` atau `.v <1-100>` — Sesuaikan volume output audio',
          '• `/lyrics` atau `.ly` — Tampilkan lirik lagu yang sedang diputar',
          '-# Prefix yang didukung: `.` (paling mudah), `,`, `-`, `!`, `c!`, `m!`',
          '',
          '-# Tip: Cukup ketik `/` di chat Discord untuk melihat auto-complete dan deskripsi parameter.',
        ].join('\n')
      )
      .setFooter({
        text: 'Columba • Open Source by Luchaz (yukheiw)',
      });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
