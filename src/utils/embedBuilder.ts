import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import { GuildQueue, QueueRepeatMode, Track } from 'discord-player';
import { AudioFilterPreset, FilterOptionMeta, QueueMetadata } from '../types/bot';

/**
 * Palet Warna Brand & Tema Gelap Minimalis Merpatify
 */
export const BRAND_COLORS = {
  MERPATI_DARK: 0x2b2d31, // Warna dark slate modern & elegan
  SPOTIFY: 0x1db954,
  YOUTUBE: 0xff0000,
  SOUNDCLOUD: 0xff5500,
  APPLE_MUSIC: 0xfa243c,
  PRIMARY: 0x2b2d31,
  SUCCESS: 0x2b2d31,
  WARNING: 0xf1c40f,
  ERROR: 0xe74c3c,
} as const;

/**
 * Custom Application Emojis resmi pada Bot untuk Spotify & YouTube
 */
export const PLATFORM_EMOJIS = {
  SPOTIFY: '<:spotify:1567576800421224448>',
  YOUTUBE: '<:youtube:1567576802220576859>',
} as const;

/**
 * Daftar Konfigurasi Filter Audio
 */
export const AUDIO_FILTER_PRESETS: Record<AudioFilterPreset, FilterOptionMeta> = {
  off: {
    label: 'Normal (Reset)',
    description: 'Matikan semua efek filter audio (Suara asli jernih)',
    emoji: '🔄',
    ffmpegFilter: null,
  },
  bassboost: {
    label: 'Bassboost',
    description: 'Dentuman bass ekstra dalam dan bertenaga',
    emoji: '🔊',
    ffmpegFilter: 'bassboost',
  },
  nightcore: {
    label: 'Nightcore',
    description: 'Tempo lebih cepat dengan nada vokal tinggi yang energik',
    emoji: '⚡',
    ffmpegFilter: 'nightcore',
  },
  vaporwave: {
    label: 'Vaporwave',
    description: 'Alunan melambat (Slowed & Reverb) bernuansa retro estetis',
    emoji: '🌊',
    ffmpegFilter: 'vaporwave',
  },
  lofi: {
    label: 'Lo-Fi',
    description: 'Nuansa hangat dan santai cocok untuk belajar/coding',
    emoji: '☕',
    ffmpegFilter: 'lofi',
  },
  '8D': {
    label: '8D Audio',
    description: 'Efek suara spasial berputar mengelilingi kepala (Gunakan Headphone)',
    emoji: '🎧',
    ffmpegFilter: '8D',
  },
};

/**
 * Mendeteksi sumber platform lagu (Spotify vs YouTube) beserta ikon emoji aplikasi.
 */
export function resolvePlatformTheme(track: Track): {
  name: string;
  color: ColorResolvable;
  iconUrl: string;
  badge: string;
  emoji: string;
} {
  const source = (track.source || '').toLowerCase();
  const url = (track.url || '').toLowerCase();
  const raw = (track.raw || {}) as Record<string, unknown>;

  if (source.includes('spotify') || url.includes('spotify.com')) {
    return {
      name: 'Spotify',
      color: BRAND_COLORS.MERPATI_DARK,
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/174/174872.png',
      badge: PLATFORM_EMOJIS.SPOTIFY,
      emoji: PLATFORM_EMOJIS.SPOTIFY,
    };
  }

  if (raw.isYoutubeBridged || url.includes('youtube.com') || url.includes('youtu.be')) {
    return {
      name: 'YouTube',
      color: BRAND_COLORS.MERPATI_DARK,
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
      badge: PLATFORM_EMOJIS.YOUTUBE,
      emoji: PLATFORM_EMOJIS.YOUTUBE,
    };
  }

  return {
    name: 'Spotify',
    color: BRAND_COLORS.MERPATI_DARK,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/174/174872.png',
    badge: PLATFORM_EMOJIS.SPOTIFY,
    emoji: PLATFORM_EMOJIS.SPOTIFY,
  };
}

/**
 * Membuat Visual Progress Bar yang rapi:
 * Contoh: 01:24 ━━━🔘──────── 03:45
 */
export function buildVisualProgressBar(queue: GuildQueue<QueueMetadata>, track: Track): string {
  const timestamp = queue.node.getTimestamp();
  if (!timestamp || track.raw?.live) {
    return `🔴 **LIVE STREAM**`;
  }

  const currentMs = timestamp.current.value;
  const totalMs = timestamp.total.value || track.durationMS || 1;
  const barLength = 14;

  const progressRatio = Math.min(Math.max(currentMs / totalMs, 0), 1);
  const indicatorIndex = Math.round(progressRatio * (barLength - 1));

  const filledLine = '━'.repeat(indicatorIndex);
  const emptyLine = '─'.repeat(Math.max(barLength - 1 - indicatorIndex, 0));

  return `\`${timestamp.current.label}\` ${filledLine}🔘${emptyLine} \`${timestamp.total.label}\``;
}

/**
 * Menerjemahkan QueueRepeatMode menjadi teks status
 */
export function formatRepeatMode(mode: QueueRepeatMode): {
  label: string;
  shortLabel: string;
  isAutoplay: boolean;
} {
  switch (mode) {
    case QueueRepeatMode.TRACK:
      return { label: '🔂 Track Loop', shortLabel: 'Loop: Track', isAutoplay: false };
    case QueueRepeatMode.QUEUE:
      return { label: '🔁 Queue Loop', shortLabel: 'Loop: Queue', isAutoplay: false };
    case QueueRepeatMode.AUTOPLAY:
      return { label: '📻 Autoplay Active', shortLabel: 'Loop: Off', isAutoplay: true };
    case QueueRepeatMode.OFF:
    default:
      return { label: '➡️ Normal', shortLabel: 'Loop: Off', isAutoplay: false };
  }
}

/**
 * Membangun Tampilan "Started playing" Minimalis & Bersih:
 * Contoh: <:spotify:...> Started playing **I Knew You Were Trouble. by Taylor Swift**
 */
export function createNowPlayingPayload(
  queue: GuildQueue<QueueMetadata>,
  track: Track = queue.currentTrack!,
  _disableControls = false
) {
  const theme = resolvePlatformTheme(track);
  const raw = (track.raw || {}) as Record<string, string>;
  const trackUrl = raw.originalYoutubeUrl || track.url;
  const cleanTitle = track.title.replace(/\s+/g, ' ').trim();
  const cleanAuthor = (track.author || '').replace(/\s+/g, ' ').trim();

  // Format judul + artis ("Title by Artist")
  const displayLinkText =
    cleanAuthor && !cleanTitle.toLowerCase().includes(cleanAuthor.toLowerCase())
      ? `${cleanTitle} by ${cleanAuthor}`
      : cleanTitle;

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLORS.MERPATI_DARK)
    .setDescription(`${theme.emoji} Started playing **[${displayLinkText}](${trackUrl})**`);

  return {
    embeds: [embed],
    components: [],
  };
}

/**
 * Membangun Embed & Tombol Navigasi Halaman (Prev / Next Page) untuk Daftar Antrean (/queue atau m!q)
 */
export function createQueuePayload(queue: GuildQueue<QueueMetadata>, pageIndex = 0) {
  const tracks = queue.tracks.toArray();
  const itemsPerPage = 10;
  const totalPages = Math.max(Math.ceil(tracks.length / itemsPerPage), 1);
  const safePage = Math.min(Math.max(pageIndex, 0), totalPages - 1);

  const startIdx = safePage * itemsPerPage;
  const pageTracks = tracks.slice(startIdx, startIdx + itemsPerPage);
  const current = queue.currentTrack;

  const upcomingList =
    pageTracks.length > 0
      ? pageTracks
          .map((t, i) => {
            const num = startIdx + i + 1;
            const title = t.title.length > 48 ? `${t.title.slice(0, 45)}...` : t.title;
            const tTheme = resolvePlatformTheme(t);
            return `\`${String(num).padStart(2, '0')}.\` ${tTheme.emoji} **[${title} by ${t.author}](${t.url})** — \`${t.duration}\``;
          })
          .join('\n')
      : '*Antrean berikutnya kosong.*';

  const currentTheme = current ? resolvePlatformTheme(current) : null;

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLORS.MERPATI_DARK)
    .setDescription(
      [
        current
          ? `${currentTheme?.emoji} **Now playing:** **[${current.title} by ${current.author}](${current.url})** (\`${current.duration}\`)`
          : '*Tidak ada lagu yang sedang diputar.*',
        '',
        `**Queue (${tracks.length} tracks):**`,
        upcomingList,
      ].join('\n')
    )
    .setFooter({
      text: `Page ${safePage + 1}/${totalPages}`,
    });

  const paginationRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`music_queue_page_${safePage - 1}`)
      .setEmoji('⬅️')
      .setLabel('Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 0),

    new ButtonBuilder()
      .setCustomId(`music_queue_page_${safePage + 1}`)
      .setEmoji('➡️')
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= totalPages - 1)
  );

  return {
    embeds: [embed],
    components: totalPages > 1 ? [paginationRow] : [],
  };
}
