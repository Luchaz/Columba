import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '../types/bot';
import { BRAND_COLORS } from '../utils/embedBuilder';
import { studentManager } from '../data/studentManager';
import { buildStudentDetailEmbed } from './mahasiswa';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Kelola dan lihat profil mahasiswa S2 SI ITS 2026 (Keahlian, topik tesis, bio)')
    .addSubcommand((sub) =>
      sub
        .setName('lihat')
        .setDescription('Lihat profil mahasiswa S2 SI ITS 2026')
        .addStringOption((opt) =>
          opt
            .setName('query')
            .setDescription('Nama atau NRP (kosongkan untuk melihat profil sendiri)')
            .setRequired(false)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Perbarui data profilmu (NRP wajib, data lain opsional)')
        .addStringOption((opt) =>
          opt
            .setName('nrp')
            .setDescription('NRP mahasiswa (Contoh: 6026201001)')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('keahlian')
            .setDescription('Fokus keahlian atau minat utama (Contoh: NLP, Machine Learning & AI Engineering)')
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName('topik_tesis')
            .setDescription('Rencana topik atau judul penelitian tesis S2')
            .setRequired(false)
        )
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().trim().toLowerCase();
    const students = studentManager.getAll();

    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(focusedValue) ||
        s.nrp.includes(focusedValue)
    );

    const choices = filtered.slice(0, 25).map((s) => ({
      name: s.name,
      value: s.nrp,
    }));

    await interaction.respond(choices);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    // ========================================================================
    // 1. SUBCOMMAND: /profil lihat
    // ========================================================================
    if (subcommand === 'lihat') {
      const query = interaction.options.getString('query');

      // Jika ada query pencarian
      if (query && query.trim() !== '') {
        const student = studentManager.getByNrp(query) || studentManager.search(query)[0];
        if (!student) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription(`Profil untuk pencarian \`${query}\` tidak ditemukan.\n-# Pastikan nama atau NRP sesuai dengan daftar angkatan.`),
            ],
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({ embeds: [buildStudentDetailEmbed(student)] });
        return;
      }

      // Jika query kosong, cek apakah user Discord ini sudah pernah menghubungkan akunnya
      const linkedStudent = studentManager
        .getAll()
        .find((s) => s.discordId === interaction.user.id);

      if (linkedStudent) {
        await interaction.reply({ embeds: [buildStudentDetailEmbed(linkedStudent)] });
        return;
      }

      // Jika belum terhubung, tampilkan panduan
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.MERPATI_DARK)
            .setTitle('Profil Belum Ditautkan')
            .setDescription(
              [
                `Akun Discord ${interaction.user} belum terhubung ke data mahasiswa S2 SI ITS 2026.`,
                '',
                'Gunakan perintah berikut untuk menautkan dan melengkapi profilmu:',
                '`/profil set nrp:<NRP> [keahlian] [topik_tesis]`',
                '',
                '-# Contoh: `/profil set nrp:6026201001 keahlian:NLP & Machine Learning topik_tesis:Data Intelligence for Smart Healthcare`',
              ].join('\n')
            )
            .setFooter({ text: 'Columba • S2 SI ITS Profile' }),
        ],
        ephemeral: true,
      });
      return;
    }

    // ========================================================================
    // 2. SUBCOMMAND: /profil set
    // ========================================================================
    if (subcommand === 'set') {
      const nrp = interaction.options.getString('nrp', true).trim();
      const expertise = interaction.options.getString('keahlian');
      const thesisTopic = interaction.options.getString('topik_tesis');

      const student = studentManager.getByNrp(nrp);
      if (!student) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(
                `NRP \`${nrp}\` tidak terdaftar dalam daftar mahasiswa S2 SI ITS 2026.\n-# Silakan periksa kembali daftar NRP melalui \`/mahasiswa\`.`
              ),
          ],
          ephemeral: true,
        });
        return;
      }

      // Update data
      const updates: Record<string, string | undefined> = {
        discordId: interaction.user.id,
      };

      if (expertise !== null && expertise !== undefined) updates.expertise = expertise.trim();
      if (thesisTopic !== null && thesisTopic !== undefined) updates.thesisTopic = thesisTopic.trim();

      const success = studentManager.updateStudent(nrp, updates);
      if (!success) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription('Gagal menyimpan pembaruan data profil. Silakan coba beberapa saat lagi.'),
          ],
          ephemeral: true,
        });
        return;
      }

      const updated = studentManager.getByNrp(nrp)!;
      const maskedNrp = updated.nrp.length > 4 ? `${updated.nrp.slice(0, 6)}****` : updated.nrp;
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLORS.MERPATI_DARK)
            .setDescription(`Profil untuk **${updated.name}** (\`${maskedNrp}\`) berhasil diperbarui dan ditautkan ke akun Discord-mu.`),
          buildStudentDetailEmbed(updated),
        ],
      });
    }
  },
};

export default command;
