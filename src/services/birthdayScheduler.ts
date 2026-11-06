import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { studentManager } from '../data/studentManager';
import { BRAND_COLORS } from '../utils/embedBuilder';

let schedulerInterval: NodeJS.Timeout | null = null;
let lastAnnouncedDate = '';

export function initBirthdayScheduler(client: Client) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Cek setiap 30 menit
  schedulerInterval = setInterval(async () => {
    await checkAndAnnounceBirthdays(client);
  }, 30 * 60 * 1000);

  // Jalankan cek pertama 15 detik setelah bot start
  setTimeout(async () => {
    await checkAndAnnounceBirthdays(client);
  }, 15000);

  console.log('[BirthdayScheduler]: Initialized successfully.');
}

async function checkAndAnnounceBirthdays(client: Client) {
  try {
    // Waktu WIB (UTC+7)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const wibHours = (utcHours + 7) % 24;

    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    // Hanya announce antara jam 07:00 - 10:00 WIB dan jika belum di-announce hari ini
    if (wibHours < 7 || wibHours > 22) return;
    if (lastAnnouncedDate === todayStr) return;

    const todayBirthdays = studentManager.getUpcomingBirthdays(0).filter((b) => b.daysLeft === 0);
    if (todayBirthdays.length === 0) return;

    for (const guild of client.guilds.cache.values()) {
      // Cari channel terbaik: #announcement, #tempat-nginfo, atau #chat
      const channels = await guild.channels.fetch();
      let targetChannel: TextChannel | null = null;

      for (const channel of channels.values()) {
        if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) continue;
        const name = channel.name.toLowerCase();
        if (name.includes('announcement') || name.includes('tempat-nginfo') || name.includes('pengumuman')) {
          targetChannel = channel;
          break;
        }
      }

      if (!targetChannel) {
        for (const channel of channels.values()) {
          if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) continue;
          const name = channel.name.toLowerCase();
          if (name.includes('chat') || name.includes('general')) {
            targetChannel = channel;
            break;
          }
        }
      }

      if (!targetChannel && guild.systemChannel) {
        targetChannel = guild.systemChannel;
      }

      if (!targetChannel) continue;

      const birthdayItems = todayBirthdays
        .map((b) => {
          const mention = b.student.discordId ? `<@${b.student.discordId}>` : `**${b.student.name}**`;
          return [
            `> ${mention} (${b.student.name})`,
            `> NRP: \`${b.student.nrp}\` • Lab ${b.student.lab}`,
            `> Dosen Pembimbing: ${b.student.advisor}`,
          ].join('\n');
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(BRAND_COLORS.MERPATI_DARK)
        .setTitle('Ulang Tahun Hari Ini • S2 Sistem Informasi ITS 2026')
        .setDescription(
          [
            'Rekan seangkatan kita sedang bertambah usia hari ini:',
            '',
            birthdayItems,
            '',
            'Semoga senantiasa diberikan kelancaran dalam studi, kemudahan dalam penelitian tesis, serta kesuksesan berkah ke depan.',
          ].join('\n')
        )
        .setFooter({ text: 'Columba • S2 SI ITS' });

      await targetChannel.send({ embeds: [embed] }).catch((err) => {
        console.error(`[BirthdayScheduler]: Failed to send to ${targetChannel?.name}:`, err);
      });
    }

    lastAnnouncedDate = todayStr;
    console.log(`[BirthdayScheduler]: Announced ${todayBirthdays.length} birthday(s) for ${todayStr}.`);
  } catch (error) {
    console.error('[BirthdayScheduler Error]:', error);
  }
}
