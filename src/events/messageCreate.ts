import { Client, EmbedBuilder, Events, Message } from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';
import { QueueMetadata } from '../types/bot';
import {
  BRAND_COLORS,
  createNowPlayingPayload,
  createQueuePayload,
  resolvePlatformTheme,
} from '../utils/embedBuilder';
import { smartSearch } from '../utils/smartSearch';
import { disableOldPlayerMessage } from './playerEvents';
import { findTrackLyrics } from '../utils/lyricsFinder';

/**
 * Daftar Prefix Cepat Columba:
 * Mendukung: . (titik, paling mudah di HP & PC), , (koma), - (minus), ! (tanda seru), c!, m!
 * Contoh: .p, .play, .s, .skip, .stop, .dc, .q, .np, .v, .sh, .shuffle, .lyrics
 */
const PREFIXES = ['.', ',', '-', '!', 'c!', 'm!'];

export function registerMessageCreateEvent(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    try {
      if (message.author.bot || !message.guild || !message.member) return;

      const content = message.content.trim();
      const lower = content.toLowerCase();

      const matchedPrefix = PREFIXES.find((p) => lower.startsWith(p));
      if (!matchedPrefix) return;

      const withoutPrefix = content.slice(matchedPrefix.length).trim();
      if (!withoutPrefix) return;

      const [rawCmd, ...args] = withoutPrefix.split(/\s+/);
      const cmd = rawCmd.toLowerCase();
      const query = args.join(' ').trim();

      // ======================================================================
      // 1. PLAY INSTAN: m!p <link/judul> | m!play | !p | !play
      // ======================================================================
      if (cmd === 'p' || cmd === 'play') {
        if (!query) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription('💡 Gunakan `.p <link Spotify / YouTube / judul lagu>` (atau `,p`, `-p`, `!p`)'),
            ],
          });
          return;
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription('❌ Masuk ke Voice Channel terlebih dahulu.'),
            ],
          });
          return;
        }

        const botVoice = message.guild.members.me?.voice.channel;
        if (botVoice && botVoice.id !== voiceChannel.id) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription(`⚠️ Bot sedang aktif di ${botVoice}.`),
            ],
          });
          return;
        }

        console.log(`▶️ [Prefix ${matchedPrefix}${cmd}]: User ${message.author.tag} meminta "${query}" di Voice ${voiceChannel.name}`);
        const player = useMainPlayer();
        const searchResult = await smartSearch(player, query, message.author);

        if (!searchResult.hasTracks()) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription(`❌ Lagu tidak ditemukan untuk \`${query}\`.`),
            ],
          });
          return;
        }

        const existingQueue = useQueue<QueueMetadata>(message.guildId!);
        const wasPlaying = Boolean(existingQueue && existingQueue.isPlaying());
        const defaultVolume = Number(process.env.DEFAULT_VOLUME) || 80;
        const leaveCooldown = Number(process.env.LEAVE_ON_EMPTY_COOLDOWN) || 180000;

        const { track } = await player.play(voiceChannel, searchResult, {
          connectionOptions: {
            deaf: true,
          },
          nodeOptions: {
            metadata: {
              channel: message.channel,
              requestedBy: message.author,
              lastPlayerMessage: existingQueue?.metadata?.lastPlayerMessage ?? null,
              activeFilter: existingQueue?.metadata?.activeFilter ?? 'off',
            } satisfies QueueMetadata,
            volume: defaultVolume,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: leaveCooldown,
            leaveOnEnd: false,
            leaveOnStop: true,
            bufferingTimeout: 3000, // Buffer 3000ms untuk audio packet stream yang stabil & mencegah audio stuttering/pecah
            resampler: 48000, // Studio 48kHz sampling rate
            selfDeaf: true,
          },
        });

        const theme = resolvePlatformTheme(track);
        const displayUrl = (track.raw as Record<string, string>)?.originalYoutubeUrl || track.url;
        const cleanTitle = track.title.replace(/\s+/g, ' ').trim();
        const cleanAuthor = (track.author || '').replace(/\s+/g, ' ').trim();
        const displayLinkText =
          cleanAuthor && !cleanTitle.toLowerCase().includes(cleanAuthor.toLowerCase())
            ? `${cleanTitle} by ${cleanAuthor}`
            : cleanTitle;

        if (searchResult.hasPlaylist() && searchResult.playlist) {
          if ('send' in message.channel) {
            await message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.MERPATI_DARK)
                  .setDescription(
                    `${theme.emoji} Added **${searchResult.tracks.length} tracks** from **[${searchResult.playlist.title}](${searchResult.playlist.url || displayUrl})**`
                  ),
              ],
            });
          }
        } else if (wasPlaying) {
          if ('send' in message.channel) {
            await message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.MERPATI_DARK)
                  .setDescription(`${theme.emoji} Added **[${displayLinkText}](${displayUrl})** to the queue`),
              ],
            });
          }
        }
        return;
      }

      // ======================================================================
      // 2. SKIP CEPAT: m!s | m!skip | !s | !skip
      // ======================================================================
      if (cmd === 's' || cmd === 'skip' || cmd === 'next') {
        const queue = useQueue<QueueMetadata>(message.guildId!);
        if (!queue || !queue.isPlaying() || !queue.currentTrack) {
          return;
        }
        queue.node.skip();
        return;
      }

      // ======================================================================
      // 3. STOP / LEAVE CEPAT: m!stop | m!leave | m!dc | !stop | !dc
      // ======================================================================
      if (cmd === 'stop' || cmd === 'leave' || cmd === 'dc' || cmd === 'disconnect') {
        const queue = useQueue<QueueMetadata>(message.guildId!);
        if (!queue) {
          return;
        }
        await disableOldPlayerMessage(queue);
        queue.delete();
        if ('send' in message.channel) {
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription('👋 Left the voice channel.'),
            ],
          });
        }
        return;
      }

      // ======================================================================
      // 4. QUEUE CEPAT: m!q | m!queue | !q
      // ======================================================================
      if (cmd === 'q' || cmd === 'queue') {
        const queue = useQueue<QueueMetadata>(message.guildId!);
        if (!queue || !queue.currentTrack) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription('Antrean musik saat ini kosong.'),
            ],
          });
          return;
        }
        await message.reply(createQueuePayload(queue, 0));
        return;
      }

      // ======================================================================
      // 5. NOW PLAYING CEPAT: m!np | !np
      // ======================================================================
      if (cmd === 'np' || cmd === 'nowplaying') {
        const queue = useQueue<QueueMetadata>(message.guildId!);
        if (!queue || !queue.currentTrack) {
          return;
        }
        const sent = await message.reply(createNowPlayingPayload(queue, queue.currentTrack));
        if (queue.metadata) {
          queue.metadata.lastPlayerMessage = sent;
        }
        return;
      }

      // ======================================================================
      // 6. VOLUME CEPAT: m!v <1-100> | m!vol <1-100>
      // ======================================================================
      if (cmd === 'v' || cmd === 'vol' || cmd === 'volume') {
        const queue = useQueue<QueueMetadata>(message.guildId!);
        if (!queue || !queue.isPlaying()) {
          return;
        }
        const vol = Number(query);
        if (isNaN(vol) || vol < 1 || vol > 100) {
          return;
        }
        queue.node.setVolume(vol);
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(`🔊 Volume set to **${vol}%**`),
          ],
        });
        return;
      }

      // ======================================================================
      // 7. LYRICS CEPAT: m!ly | m!lyrics
      // ======================================================================
      if (cmd === 'ly' || cmd === 'lyrics') {
        const queue = useQueue<QueueMetadata>(message.guildId!);
        const searchTitle = query || queue?.currentTrack?.title;
        const searchArtist = query ? '' : queue?.currentTrack?.author;

        if (!searchTitle) return;

        const lyrics = await findTrackLyrics(searchTitle, searchArtist);
        if (!lyrics) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription(`Lirik untuk **${searchTitle}** tidak ditemukan.`),
            ],
          });
          return;
        }

        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setTitle(`${lyrics.title} — ${lyrics.artist}`)
              .setDescription(lyrics.lyrics.slice(0, 3900)),
          ],
        });
        return;
      }

      // ======================================================================
      // 8. SHUFFLE CEPAT: m!sh | m!shuffle | !sh | !shuffle
      // ======================================================================
      if (cmd === 'sh' || cmd === 'shuffle') {
        const queue = useQueue<QueueMetadata>(message.guildId!);
        if (!queue || !queue.currentTrack || queue.tracks.size < 2) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.MERPATI_DARK)
                .setDescription('🔀 Minimal harus ada **2 lagu** di dalam antrean untuk di-shuffle!'),
            ],
          });
          return;
        }

        const count = queue.tracks.size;
        queue.tracks.shuffle();

        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setDescription(`Berhasil mengacak **${count} lagu** di dalam antrean.`),
          ],
        });
        return;
      }

      // ======================================================================
      // 9. HELP CEPAT: m!help | !help | m!h
      // ======================================================================
      if (cmd === 'help' || cmd === 'h') {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.MERPATI_DARK)
              .setTitle('Columba • S2 Sistem Informasi ITS')
              .setDescription(
                [
                  '-# Bot pendamping open-source oleh Luchaz (yukheiw)',
                  '• GitHub: https://github.com/Luchaz/Columba',
                  '',
                  '**Perintah Musik Cepat (Prefix .)**',
                  '`.p <lagu>` Putar • `.s` Lewati • `.stop` Berhenti',
                  '`.q` Antrean • `.np` Status • `.sh` Acak • `.v <1-100>` Volume',
                  '-# Prefix lain yang didukung: `,`, `-`, `!`, `c!`, `m!`',
                  '',
                  '**Perintah Akademik (Slash Commands)**',
                  '`/jadwal` Jadwal perkuliahan mingguan & ruangan',
                  '`/tesis` Struktur proposal tesis & portal UGDSI',
                  '`/kalender` Agenda akademik, UTS/UAS & yudisium',
                  '`/mahasiswa` Direktori 29 mahasiswa, NRP & lab',
                  '`/dosen` Profil dosen, gelar lengkap & bidang riset',
                  '`/lab` Informasi 5 laboratorium riset SI ITS',
                  '`/profil` Lihat dan perbarui data profil diri',
                  '`/ultah` Kalender ulang tahun angkatan',
                  '',
                  '-# Ketik `/help` untuk panduan lengkap dengan deskripsi interaktif.',
                ].join('\n')
              ),
          ],
        });
        return;
      }
    } catch (error) {
      console.error('[MessageCreate Command Error]:', error);
    }
  });
}
