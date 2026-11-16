import { User } from 'discord.js';
import { Player, QueryType, SearchResult, Track } from 'discord-player';
import { cleanTrackTitle } from './lyricsFinder';

/**
 * Membersihkan URL YouTube dari parameter tracking (si, feature, pp, dll) & Mix/Radio dinamis (list=RD...)
 * Serta menormalisasi shortlink youtu.be/<id> menjadi https://www.youtube.com/watch?v=<id>
 */
export function sanitizeYouTubeUrl(input: string): string {
  try {
    const raw = input.trim();
    const u = new URL(raw);

    // Hapus parameter tracking & share mobile
    u.searchParams.delete('si');
    u.searchParams.delete('feature');
    u.searchParams.delete('pp');
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');

    const listVal = u.searchParams.get('list') || '';
    if (listVal.startsWith('RD') || listVal.startsWith('UL')) {
      u.searchParams.delete('list');
      u.searchParams.delete('start_radio');
      u.searchParams.delete('index');
    }

    // Normalisasi shortlink youtu.be/<id>
    if (u.hostname === 'youtu.be') {
      const videoId = u.pathname.replace(/^\//, '');
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
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
export async function fetchYouTubeOEmbed(youtubeUrl: string): Promise<{
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

  // 1. Jika query adalah URL YouTube langsung -> coba cari langsung dengan YouTube Extractor (dengan batas waktu 5s agar tidak pernah stuck)
  if (isYouTubeUrl(query)) {
    const sanitizedUrl = sanitizeYouTubeUrl(query);

    try {
      const ytResult = await Promise.race([
        player.search(sanitizedUrl, { requestedBy }),
        new Promise<SearchResult>((_, reject) =>
          setTimeout(() => reject(new Error('player.search timeout (5s)')), 5000)
        ),
      ]);
      if (ytResult.hasTracks()) {
        return ytResult;
      }
    } catch {
      // Fallback ke oEmbed jika direct query bermasalah atau timeout
    }

    const ytMeta = await fetchYouTubeOEmbed(sanitizedUrl);
    if (ytMeta) {
      const cleanedTitle = cleanTrackTitle(ytMeta.title);
      const cleanAuthor = ytMeta.author_name.replace(/\s*(- Topic|VEVO|Official)$/i, '').trim();
      const bridgeQuery = `${cleanedTitle} ${cleanAuthor}`.trim();

      try {
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
          return searchResult;
        }
      } catch {}

      // Fallback definitif jika searchResult teks kosong: buat Track langsung dari metadata oEmbed & sanitizedUrl
      const extractor = player.extractors.get('com.merpatify.modern-youtube-extractor');
      const track = new Track(player, {
        title: ytMeta.title,
        description: ytMeta.title,
        author: ytMeta.author_name,
        url: sanitizedUrl,
        thumbnail: ytMeta.thumbnail_url || '',
        duration: '0:00',
        views: 0,
        requestedBy,
        source: 'youtube',
        queryType: QueryType.YOUTUBE_VIDEO,
      });
      if (extractor) {
        track.extractor = extractor;
      }
      return new SearchResult(player, {
        query: sanitizedUrl,
        tracks: [track],
        playlist: null,
      });
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
