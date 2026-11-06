import { User } from 'discord.js';
import { Player, SearchResult } from 'discord-player';
import { cleanTrackTitle } from './lyricsFinder';

/**
 * Membersihkan URL YouTube dari parameter Mix/Radio dinamis (list=RD...) yang menyebabkan kegagalan fetch
 */
export function sanitizeYouTubeUrl(input: string): string {
  try {
    const u = new URL(input.trim());
    const listVal = u.searchParams.get('list') || '';
    if (listVal.startsWith('RD') || listVal.startsWith('UL')) {
      u.searchParams.delete('list');
      u.searchParams.delete('start_radio');
      u.searchParams.delete('index');
    }
    return u.toString();
  } catch {
    return input.trim();
  }
}

/**
 * Mengecek apakah string adalah URL YouTube / YouTube Music
 */
export function isYouTubeUrl(input: string): boolean {
  return /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i.test(input.trim());
}

/**
 * Mengecek apakah string adalah URL HTTP/HTTPS
 */
export function isUrl(input: string): boolean {
  return /^https?:\/\/\S+$/i.test(input.trim());
}

/**
 * Mengambil metadata resmi video YouTube menggunakan YouTube oEmbed API publik (bebas blokir IP Cloud & 0 API Key)
 */
async function fetchYouTubeOEmbed(youtubeUrl: string): Promise<{
  title: string;
  author_name: string;
  thumbnail_url: string;
} | null> {
  try {
    const cleanUrl = youtubeUrl.trim();
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MelodifyBot/1.0)',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    if (!data.title) return null;
    return {
      title: data.title,
      author_name: data.author_name || 'YouTube Channel',
      thumbnail_url: data.thumbnail_url || '',
    };
  } catch {
    return null;
  }
}

/**
 * Smart Multi-Source Search & Bridging:
 * - Link Spotify (Track / Album / Playlist): Ekstraksi metadata Spotify & bridging audio otomatis.
 * - Link YouTube (youtu.be / youtube.com): Ambil metadata asli YouTube via oEmbed + bridging audio anti-blokir IP.
 * - Judul Lagu Biasa: Pencarian langsung cepat.
 */
export async function smartSearch(
  player: Player,
  rawQuery: string,
  requestedBy: User
): Promise<SearchResult> {
  const query = rawQuery.trim();

  // 1. Jika query adalah URL YouTube langsung -> coba cari langsung dengan YouTube Extractor
  if (isYouTubeUrl(query)) {
    const sanitizedUrl = sanitizeYouTubeUrl(query);

    try {
      const ytResult = await player.search(sanitizedUrl, { requestedBy });
      if (ytResult.hasTracks()) {
        return ytResult;
      }
    } catch {
      // Fallback ke oEmbed jika direct query bermasalah
    }

    const ytMeta = await fetchYouTubeOEmbed(sanitizedUrl);
    if (ytMeta) {
      const cleanedTitle = cleanTrackTitle(ytMeta.title);
      const cleanAuthor = ytMeta.author_name.replace(/\s*(- Topic|VEVO|Official)$/i, '').trim();
      const bridgeQuery = `${cleanedTitle} ${cleanAuthor}`.trim();

      const searchResult = await player.search(bridgeQuery, {
        requestedBy,
      });

      if (searchResult.hasTracks()) {
        const primaryTrack = searchResult.tracks[0];
        primaryTrack.title = ytMeta.title;
        primaryTrack.author = ytMeta.author_name;
        if (ytMeta.thumbnail_url) {
          primaryTrack.thumbnail = ytMeta.thumbnail_url;
        }
        primaryTrack.raw = {
          ...(primaryTrack.raw || {}),
          isYoutubeBridged: true,
          originalYoutubeUrl: query,
        };
      }
      return searchResult;
    }
  }

  // 2. Link Spotify, SoundCloud, Apple Music, atau Judul Lagu Teks Biasa
  const result = await player.search(query, {
    requestedBy,
  });

  // Perbaiki URL per-lagu untuk Spotify Playlist agar masing-masing punya link track Spotify asli
  if (result.hasTracks()) {
    for (const track of result.tracks) {
      const rawSource = (track.raw as Record<string, any>)?.source;
      const uri: string | undefined = rawSource?.uri;
      if (uri && uri.startsWith('spotify:track:')) {
        const trackId = uri.split(':')[2];
        if (trackId) {
          track.url = `https://open.spotify.com/track/${trackId}`;
        }
      }
    }
  }

  return result;
}
