import { User } from 'discord.js';
import { Player, QueryType, SearchResult, Track, Util } from 'discord-player';
import YouTube, { Video } from 'youtube-sr';
import { cleanTrackTitle } from './lyricsFinder';

/**
 * Membersihkan nama artis dan judul lagu dari karakter operator pencarian (- dan +)
 * agar query pencarian YouTube tidak mengecualikan kata kunci (exclusion filter)
 */
export function cleanBridgeQuery(author: string, title: string): string {
  const cleanA = (author || '')
    .replace(/^(sped up \+ slowed|slowed \+ reverb|nightcore)[,\s]*/i, '')
    .replace(/[-+,\/\\>><<]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanT = (title || '')
    .replace(/[-+,\/\\>><<]/g, ' ')
    .replace(/[\(\[\{].*?[\)\]\}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${cleanA} ${cleanT}`.trim();
}

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

export interface SpotifyPodcastMetadata {
  type: 'episode' | 'show';
  id: string;
  title: string;
  show: string;
  durationMS: number;
  thumbnail: string;
  releaseDate?: string;
}

/**
 * Mengecek apakah string adalah URL Spotify Episode atau Show Podcast
 */
export function isSpotifyPodcastUrl(input: string): boolean {
  const q = input.trim();
  return (
    /^(https?:\/\/)?(open\.)?spotify\.com\/(?:intl-[a-z]{2}\/)?(episode|show)\/([a-zA-Z0-9]+)/i.test(q) ||
    /^spotify:(episode|show):([a-zA-Z0-9]+)$/i.test(q)
  );
}

/**
 * Mengambil metadata resmi episode / show Spotify langsung via Spotify Public Embed API
 * (Bebas blokir, 0 API Key, aman dari batasan DRM Web Player)
 */
export async function fetchSpotifyPodcastMeta(url: string): Promise<SpotifyPodcastMetadata | null> {
  try {
    const q = url.trim();
    let type = 'episode';
    let id = '';

    const webMatch = q.match(/spotify\.com\/(?:intl-[a-z]{2}\/)?(episode|show)\/([a-zA-Z0-9]+)/i);
    if (webMatch) {
      type = webMatch[1].toLowerCase();
      id = webMatch[2];
    } else {
      const uriMatch = q.match(/spotify:(episode|show):([a-zA-Z0-9]+)/i);
      if (uriMatch) {
        type = uriMatch[1].toLowerCase();
        id = uriMatch[2];
      }
    }

    if (!id) return null;

    const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const start = html.indexOf('id="__NEXT_DATA__"');
    if (start === -1) return null;

    const jsonStart = html.indexOf('>', start) + 1;
    const jsonEnd = html.indexOf('</script>', jsonStart);
    if (jsonStart <= 0 || jsonEnd <= jsonStart) return null;

    const data = JSON.parse(html.slice(jsonStart, jsonEnd));
    const entity = data?.props?.pageProps?.state?.data?.entity;
    if (!entity) return null;

    const title = (entity.name || entity.title || '').trim();
    const show = (entity.subtitle || entity.publisher || (type === 'show' ? entity.name : 'Spotify Podcast') || '').trim();
    const durationMS = Number(entity.duration) || 0;
    const thumbnail =
      entity.relatedEntityCoverArt?.[0]?.url ||
      entity.videoThumbnailImage?.[0]?.url ||
      '';

    if (!title) return null;

    return {
      type: type as 'episode' | 'show',
      id,
      title,
      show: show || 'Podcast',
      durationMS,
      thumbnail,
      releaseDate: entity.releaseDate,
    };
  } catch {
    return null;
  }
}

/**
 * Mencari video YouTube resmi yang paling akurat untuk episode podcast.
 * Menghindari trailer pendek, cuplikan 3 menit, atau video dengan durasi/judul tidak relevan.
 */
export function findBestPodcastVideo(
  videos: Video[],
  targetTitle: string,
  targetShow: string,
  targetDurationMS?: number
): Video | null {
  if (!videos || videos.length === 0) return null;

  const targetSec = targetDurationMS ? Math.round(targetDurationMS / 1000) : 0;
  const targetTitleLower = targetTitle.toLowerCase();
  const targetShowLower = targetShow.toLowerCase();

  const titleKeywords = targetTitleLower
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const showKeywords = targetShowLower
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && w !== 'podcast');

  const scored: { video: Video; score: number }[] = [];

  for (const v of videos) {
    const vTitle = (v.title || '').toLowerCase();
    const vChannel = (v.channel?.name || '').toLowerCase();
    const vSec = v.duration ? Math.round(v.duration / 1000) : 0;

    // 1. Jika podcast berdurasi panjang (misal >= 10 menit), tolak cuplikan pendek (< 5 menit)
    if (targetSec >= 600 && vSec > 0 && vSec < 300) {
      continue;
    }

    // 2. Tolak video yang secara eksplisit bertanda teaser/trailer/short
    if (
      /\b(trailer|teaser|cuplikan|highlight|preview|short|shorts|promo)\b/i.test(vTitle) &&
      !targetTitleLower.includes('trailer') &&
      !targetTitleLower.includes('teaser')
    ) {
      continue;
    }

    let score = 50;

    // 3. Skor kesesuaian durasi (episode YouTube resmi memiliki durasi sangat identik)
    if (targetSec > 0 && vSec > 0) {
      const diff = Math.abs(vSec - targetSec);
      if (diff <= 30) {
        score += 50;
      } else if (diff <= 120) {
        score += 30;
      } else if (diff <= 300) {
        score += 15;
      } else if (diff > 900) {
        score -= 40;
      }
    }

    // 4. Skor kesesuaian nama channel / host (misal Raditya Dika, Deddy Corbuzier)
    for (const kw of showKeywords) {
      if (vChannel.includes(kw) || vTitle.includes(kw)) {
        score += 15;
      }
    }

    // 5. Skor kecocokan kata kunci judul episode
    let matchedTitleKeywords = 0;
    for (const kw of titleKeywords) {
      if (vTitle.includes(kw)) {
        score += 10;
        matchedTitleKeywords++;
      }
    }

    if (titleKeywords.length > 0 && matchedTitleKeywords === 0) {
      score -= 50;
    }

    if (score >= 40) {
      scored.push({ video: v, score });
    }
  }

  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].video;
}

/**
 * Membersihkan judul episode podcast dari prefix nomor episode (Ep. 12, #12, dll)
 * untuk memperluas pencarian YouTube jika format judul berbeda antara Spotify dan YouTube
 */
export function cleanPodcastTitle(title: string): string {
  return title
    .replace(/^(ep(isode)?\.?\s*\d+|#\d+|eps?\.?\s*\d+)[\s:\-–—|]*/i, '')
    .replace(/[\(\[\{].*?[\)\]\}]/g, ' ')
    .replace(/[-+,\/\\>><<]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Menormalisasi query pencarian teks dari kata pengantar/penghubung bahasa Indonesia
 * Contoh: "stupid dari treasure" -> "stupid treasure", "lagu run bts" -> "run bts"
 */
export function normalizeSearchQuery(rawQuery: string): string {
  let q = rawQuery.trim();
  q = q.replace(/\b(lagu|dari|oleh|ciptaan|nyanyian)\b/gi, ' ');
  return q.replace(/\s+/g, ' ').trim();
}

/**
 * Smart Multi-Source Search & Bridging:
 * - Link Spotify Podcast (Episode / Show): Ekstraksi metadata via embed API & bridging video YouTube resmi berdurasi penuh.
 * - Link Spotify Musik (Track / Album / Playlist): Ekstraksi metadata Spotify & bridging audio otomatis.
 * - Link YouTube (youtu.be / youtube.com): Ambil metadata asli YouTube via oEmbed + durasi riil anti-delay & anti-blokir IP.
 * - Judul Lagu Biasa: Prioritas pencarian resmi YouTube HQ + normalisasi bahasa Indonesia.
 */
export async function smartSearch(
  player: Player,
  rawQuery: string,
  requestedBy: User
): Promise<SearchResult> {
  const query = rawQuery.trim();

  // 1. Jika query adalah URL YouTube langsung -> Langsung ambil metadata resmi via oEmbed & durasi riil
  if (isYouTubeUrl(query)) {
    const sanitizedUrl = sanitizeYouTubeUrl(query);

    // Ambil metadata resmi video YouTube langsung via oEmbed (sangat cepat, 150ms, bebas blokir & 0 API key)
    const ytMeta = await fetchYouTubeOEmbed(sanitizedUrl);
    if (ytMeta) {
      let durationFormatted = '0:00';
      let views = 0;

      // Coba ambil durasi riil dengan race 1500ms agar progress bar & durasi antrean akurat
      try {
        const v = await Promise.race([
          YouTube.getVideo(sanitizedUrl),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('YouTube.getVideo timeout (1.5s)')), 1500)
          ),
        ]);
        if (v?.durationFormatted) {
          durationFormatted = v.durationFormatted;
          views = v.views || 0;
        }
      } catch {}

      const extractor = player.extractors.get('com.merpatify.modern-youtube-extractor');
      const track = new Track(player, {
        title: ytMeta.title,
        description: ytMeta.title,
        author: ytMeta.author_name,
        url: sanitizedUrl, // Selalu gunakan URL video YouTube asli yang diminta user!
        thumbnail: ytMeta.thumbnail_url || '',
        duration: durationFormatted,
        views,
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

    // Fallback jika oEmbed gagal (misal link playlist atau format khusus): cari via extractor
    try {
      const ytResult = await player.search(sanitizedUrl, { requestedBy });
      if (ytResult.hasTracks()) {
        return ytResult;
      }
    } catch {}
  }

  // 2. Jika query adalah Spotify Podcast (Episode / Show) -> Bridging ke YouTube resmi dengan verifikasi durasi & host
  if (isSpotifyPodcastUrl(query)) {
    try {
      const meta = await fetchSpotifyPodcastMeta(query);
      if (meta) {
        const ytBridgeQuery = `${meta.show} ${meta.title}`
          .replace(/[-+,\/\\>><<]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        console.log(`🎙️ [PodcastEngine]: Menghubungkan podcast "${meta.show} - ${meta.title}" ke YouTube...`);
        const searchVideos = await YouTube.search(ytBridgeQuery, { limit: 10, type: 'video' });
        let bestVideo = findBestPodcastVideo(searchVideos, meta.title, meta.show, meta.durationMS);

        // Fallback jika format judul di Spotify dan YouTube memiliki perbedaan penulisan
        if (!bestVideo) {
          const cleanTitle = cleanPodcastTitle(meta.title);
          const cleanShow = meta.show.replace(/\b(podcast|official|show)\b/gi, '').trim();
          const fallbackQuery = `${cleanTitle} ${cleanShow}`.replace(/\s+/g, ' ').trim();

          if (fallbackQuery && fallbackQuery.toLowerCase() !== ytBridgeQuery.toLowerCase()) {
            console.log(`🎙️ [PodcastEngine]: Mencoba pencarian alternatif: "${fallbackQuery}"...`);
            const fallbackVideos = await YouTube.search(fallbackQuery, { limit: 10, type: 'video' });
            bestVideo = findBestPodcastVideo(fallbackVideos, meta.title, meta.show, meta.durationMS);
          }
        }

        if (bestVideo) {
          console.log(`✅ [PodcastEngine]: Terhubung ke episode YouTube resmi: "${bestVideo.title}" (${bestVideo.durationFormatted})`);
          const extractor = player.extractors.get('com.merpatify.modern-youtube-extractor');
          const track = new Track(player, {
            title: meta.title,
            description: `${meta.show} • ${meta.title}`,
            author: meta.show,
            url: bestVideo.url,
            thumbnail: meta.thumbnail || bestVideo.thumbnail?.url || '',
            duration: bestVideo.durationFormatted || (meta.durationMS ? Util.buildTimeCode(Util.parseMS(meta.durationMS)) : '0:00'),
            views: bestVideo.views || 0,
            requestedBy,
            source: 'spotify',
            queryType: QueryType.SPOTIFY_SONG,
            raw: {
              isPodcast: true,
              originalSpotifyUrl: query,
              bridgedYoutubeUrl: bestVideo.url,
              bridgedYoutubeTitle: bestVideo.title,
            },
          });
          if (extractor) {
            track.extractor = extractor;
          }
          return new SearchResult(player, {
            query,
            tracks: [track],
            playlist: null,
          });
        } else {
          console.warn(`⚠️ [PodcastEngine]: Tidak ditemukan video resmi yang cocok di YouTube untuk podcast "${meta.title}".`);
        }
      }
    } catch (podcastErr) {
      console.error('❌ [PodcastEngine Error]:', podcastErr);
    }

    // Jika episode podcast tidak ditemukan atau tidak tersedia versi YouTube resminya, kembalikan SearchResult kosong
    return new SearchResult(player, {
      query,
      tracks: [],
      playlist: null,
    });
  }

  // 3. Jika query adalah URL selain YouTube (misal Spotify Musik, SoundCloud, Apple Music)
  if (isUrl(query)) {
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

  // 4. Query adalah Judul Lagu Teks Biasa (Bukan URL) -> Cari dengan prioritas YouTube Official Search
  const cleanQ = normalizeSearchQuery(query);

  try {
    const ytResult = await player.search(cleanQ, {
      requestedBy,
      searchEngine: QueryType.YOUTUBE_SEARCH,
    });

    if (ytResult.hasTracks() && ytResult.tracks.length > 0) {
      // Re-rank hasil agar lagu studio resmi yang mencakup judul & artis berada paling atas
      const qWords = cleanQ.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
      ytResult.tracks.sort((a, b) => {
        const score = (t: Track) => {
          const full = `${t.title} ${t.author}`.toLowerCase();
          let s = 0;
          for (const w of qWords) {
            if (full.includes(w)) s += 10;
          }
          if (t.author.toLowerCase().includes('topic') || t.author.toLowerCase().includes('vevo')) s += 5;
          if (t.title.toLowerCase().includes('official')) s += 3;
          return s;
        };
        return score(b) - score(a);
      });

      return ytResult;
    }
  } catch (err) {
    player.debug(`Direct YouTube text search error, fallback to multi-source: ${err}`);
  }

  // Fallback pencarian multi-source (SoundCloud / Spotify) jika YouTube search tidak mengembalikan lagu
  return await player.search(cleanQ || query, {
    requestedBy,
  });
}
