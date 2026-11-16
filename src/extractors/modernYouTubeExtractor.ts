import {
  BaseExtractor,
  Playlist,
  QueryType,
  Track,
  Util,
} from 'discord-player';
import { SoundCloudExtractor } from '@discord-player/extractor';
import { Ytdl, Client } from '@distube/ytdl-core';
import YouTube, { Video } from 'youtube-sr';
import { PassThrough, Readable } from 'stream';
import { cleanBridgeQuery, fetchYouTubeOEmbed, sanitizeYouTubeUrl } from '../utils/smartSearch';

let ytdlInstance: Ytdl | null = null;

async function getYtdl(): Promise<Ytdl> {
  if (ytdlInstance) return ytdlInstance;
  const cookie = process.env.YOUTUBE_COOKIE?.trim();
  ytdlInstance = new Ytdl({
    clients: [Client.WebEmbedded, Client.Tv, Client.Mweb],
    cookie: cookie || undefined,
  });
  return ytdlInstance;
}

// Daftar kata kunci yang menandakan bukan lagu studio/versi resmi
const UNWANTED_KEYWORDS = [
  'remix',
  'sped up',
  'speed up',
  'slowed',
  'reverb',
  'nightcore',
  'bass boost',
  'bass boosted',
  'bassboost',
  'mashup',
  'tribute',
  'karaoke',
  'instrumental',
  'cover',
  '1 hour',
  '10 hours',
  'loop',
  'parody',
  'reaction',
  'snippet',
  'bootleg',
  'flip',
  'hardstyle',
  'earrape',
];

/**
 * Memilih video YouTube paling akurat dan resmi untuk mencegah lagu remix / versi bajakan / 30 detik snippet
 */
export function findBestOfficialVideo(
  videos: Video[],
  targetTitle: string,
  targetAuthor: string,
  targetDurationMS?: number
): Video | null {
  if (!videos || videos.length === 0) return null;

  const origLower = `${targetTitle} ${targetAuthor}`.toLowerCase();
  const allowedKeywords = UNWANTED_KEYWORDS.filter((w) => origLower.includes(w));
  const targetSec = targetDurationMS ? Math.round(targetDurationMS / 1000) : 0;

  const scored: { video: Video; score: number }[] = [];

  for (const v of videos) {
    const vTitle = (v.title || '').toLowerCase();
    const vChannel = (v.channel?.name || '').toLowerCase();

    // 1. Cek kata-kata terlarang (kecuali jika memang sengaja diminta dalam judul asli)
    const hasDisallowedWord = UNWANTED_KEYWORDS.some(
      (w) => !allowedKeywords.includes(w) && vTitle.includes(w)
    );
    if (hasDisallowedWord) continue;

    // 2. Cek durasi agar tidak memutar loop 1 jam atau preview 30 detik
    const vSec = v.duration ? Math.round(v.duration / 1000) : 0;
    if (targetSec > 0 && vSec > 0) {
      const diff = Math.abs(vSec - targetSec);
      if (diff > 45) continue;
    }

    let score = 100;
    if (targetSec > 0 && vSec > 0) {
      score -= Math.abs(vSec - targetSec);
    }

    // Skor bonus untuk channel resmi atau audio resmi
    if (vChannel.includes('topic') || vChannel.includes('vevo')) score += 40;
    if (vTitle.includes('official audio') || vTitle.includes('official music video') || vTitle.includes('official video')) score += 30;
    if (vTitle.includes('audio') || vTitle.includes('lyrics')) score += 15;
    if (vTitle.includes('official')) score += 10;

    scored.push({ video: v, score });
  }

  if (scored.length > 0) {
    scored.sort((a, b) => b.score - a.score);
    return scored[0].video;
  }

  // Fallback: cari video non-loop jika semua terfilter
  const nonLoop = videos.find((v) => {
    const t = (v.title || '').toLowerCase();
    return !t.includes('1 hour') && !t.includes('10 hours') && !t.includes('loop');
  });

  return nonLoop || videos[0] || null;
}

/**
 * Memilih audio SoundCloud paling akurat dan resmi jika YouTube fallback diperlukan.
 * Mencegah pemutaran bootleg hardstyle, slowed+reverb, atau remix tidak resmi.
 */
export function findBestSoundCloudTrack(
  tracks: Track[],
  targetTitle: string,
  targetAuthor: string,
  targetDurationMS?: number
): Track | null {
  if (!tracks || tracks.length === 0) return null;

  const origLower = `${targetTitle} ${targetAuthor}`.toLowerCase();
  const allowedKeywords = UNWANTED_KEYWORDS.filter((w) => origLower.includes(w));
  const targetSec = targetDurationMS ? Math.round(targetDurationMS / 1000) : 0;
  const cleanTargetTitle = targetTitle.toLowerCase().replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();
  const cleanTargetAuthor = targetAuthor.toLowerCase().replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();

  // Ambil kata-kata penting dari targetTitle (panjang > 2 huruf, abaikan stop words)
  const titleWords = cleanTargetTitle
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, ''))
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'from', 'sped', 'slowed', 'reverb', 'full', 'set', 'live', 'video', 'audio'].includes(w));

  const authorWords = cleanTargetAuthor
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, ''))
    .filter((w) => w.length > 2);

  const scored: { track: Track; score: number }[] = [];

  for (const t of tracks) {
    const tTitle = (t.title || '').toLowerCase();
    const tAuthor = (t.author || '').toLowerCase();
    const tFull = `${tTitle} ${tAuthor}`;

    // 1. Cek durasi minimal (abaikan snippet/preview 30 detik SoundCloud)
    const tSec = t.durationMS ? Math.round(t.durationMS / 1000) : 0;
    if (tSec > 0 && tSec <= 45 && targetSec > 60) {
      continue; // Buang preview 30 detik
    }

    // 2. Cek kata terlarang (remix, slowed, reverb, bootleg, dll)
    const hasDisallowedWord = UNWANTED_KEYWORDS.some(
      (w) => !allowedKeywords.includes(w) && tTitle.includes(w)
    );
    if (hasDisallowedWord) continue;

    // 3. Verifikasi Artis: Jika targetAuthor diketahui, minimal 1 kata nama artis WAJIB ada di author atau title SoundCloud
    if (authorWords.length > 0) {
      const matchesAuthor = authorWords.some((w) => tFull.includes(w));
      if (!matchesAuthor) continue;
    }

    // 4. Verifikasi Judul: Minimal 50% kata penting judul lagu harus cocok agar tidak memutar lagu lain
    if (titleWords.length > 0) {
      const matchCount = titleWords.filter((w) => tTitle.includes(w)).length;
      const ratio = matchCount / titleWords.length;
      if (ratio < 0.5) continue;
    }

    // 5. Cek kesesuaian durasi agar tidak memutar preview atau loop
    if (targetSec > 0 && tSec > 0) {
      const diff = Math.abs(tSec - targetSec);
      if (diff > 45) continue;
    }

    let score = 100;
    if (targetSec > 0 && tSec > 0) {
      score -= Math.abs(tSec - targetSec);
    }

    // Bonus jika nama artis atau judul cocok kuat
    if (cleanTargetAuthor && (tAuthor.includes(cleanTargetAuthor) || tTitle.includes(cleanTargetAuthor))) {
      score += 40;
    }
    if (cleanTargetTitle && tTitle.includes(cleanTargetTitle)) {
      score += 30;
    }
    if (tTitle.includes('official') || tTitle.includes('original')) {
      score += 20;
    }

    scored.push({ track: t, score });
  }

  if (scored.length > 0) {
    scored.sort((a, b) => b.score - a.score);
    return scored[0].track;
  }

  // Jika tidak ada lagu SoundCloud yang benar-benar cocok, tolak daripada memutar lagu salah/snippet!
  return null;
}

export class ModernYouTubeExtractor extends BaseExtractor {
  static identifier = 'com.merpatify.modern-youtube-extractor';

  async validate(query: string, type?: QueryType): Promise<boolean> {
    if (typeof query !== 'string') return false;
    return (
      /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i.test(query.trim()) ||
      type === QueryType.YOUTUBE_VIDEO ||
      type === QueryType.YOUTUBE_PLAYLIST ||
      type === QueryType.YOUTUBE_SEARCH
    );
  }

  async handle(query: string, context: any) {
    const cleanUrl = query.trim();

    // 1. YouTube Playlist URL (abaikan Radio/Mix playlist bertipe list=RD... karena di-generate on-the-fly oleh YouTube)
    if (/[?&]list=([a-zA-Z0-9_-]+)/i.test(cleanUrl) && !/[?&]list=RD/i.test(cleanUrl)) {
      try {
        const playlistInfo = await YouTube.getPlaylist(cleanUrl, { limit: 100 });
        if (playlistInfo && playlistInfo.videos?.length) {
          const playlist = new Playlist(this.context.player, {
            title: playlistInfo.title || 'YouTube Playlist',
            description: playlistInfo.title || '',
            thumbnail: playlistInfo.thumbnail?.url || '',
            type: 'playlist',
            source: 'youtube',
            author: {
              name: playlistInfo.channel?.name || 'YouTube',
              url: playlistInfo.channel?.url || '',
            },
            tracks: [],
            id: playlistInfo.id || cleanUrl,
            url: playlistInfo.url || cleanUrl,
            rawPlaylist: playlistInfo,
          });

          playlist.tracks = playlistInfo.videos.map((v) => {
            const track = new Track(this.context.player, {
              title: v.title || 'YouTube Track',
              description: v.title || '',
              author: v.channel?.name || 'YouTube',
              url: v.url,
              thumbnail: v.thumbnail?.url || '',
              duration: v.durationFormatted || Util.buildTimeCode(Util.parseMS(v.duration || 0)),
              views: v.views || 0,
              requestedBy: context.requestedBy,
              playlist,
              source: 'youtube',
              queryType: QueryType.YOUTUBE_VIDEO,
            });
            track.extractor = this;
            return track;
          });

          return this.createResponse(playlist, playlist.tracks);
        }
      } catch (err) {
        this.context.player.debug(`Failed to fetch YouTube playlist: ${err}`);
      }
    }

    // 2. Single YouTube Video URL (bersihkan parameter tracking & playlist mix agar tidak mengganggu metadata)
    if (/^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i.test(cleanUrl)) {
      const sanitizedVideoUrl = sanitizeYouTubeUrl(cleanUrl);

      // A. Prioritas 1: YouTube oEmbed publik (sangat cepat, ~150ms, anti-blokir IP Cloud & 100% akurat)
      try {
        const ytMeta = await fetchYouTubeOEmbed(sanitizedVideoUrl);
        if (ytMeta && ytMeta.title) {
          const track = new Track(this.context.player, {
            title: ytMeta.title,
            description: ytMeta.title,
            author: ytMeta.author_name,
            url: sanitizedVideoUrl,
            thumbnail: ytMeta.thumbnail_url || '',
            duration: '0:00',
            views: 0,
            requestedBy: context.requestedBy,
            source: 'youtube',
            queryType: QueryType.YOUTUBE_VIDEO,
          });
          track.extractor = this;
          return this.createResponse(null, [track]);
        }
      } catch (oembedErr) {
        this.context.player.debug(`fetchYouTubeOEmbed failed: ${oembedErr}`);
      }

      // B. Fallback 2: Coba via YouTube.getVideo (youtube-sr)
      try {
        const v = await Promise.race([
          YouTube.getVideo(sanitizedVideoUrl),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('YouTube.getVideo timeout (2.5s)')), 2500)
          ),
        ]);
        if (v && v.title) {
          const track = new Track(this.context.player, {
            title: v.title,
            description: v.title,
            author: v.channel?.name || 'YouTube',
            url: v.url || sanitizedVideoUrl,
            thumbnail: v.thumbnail?.url || '',
            duration: v.durationFormatted || Util.buildTimeCode(Util.parseMS(v.duration || 0)),
            views: v.views || 0,
            requestedBy: context.requestedBy,
            source: 'youtube',
            queryType: QueryType.YOUTUBE_VIDEO,
          });
          track.extractor = this;
          return this.createResponse(null, [track]);
        }
      } catch (ytSrErr) {
        this.context.player.debug(`YouTube.getVideo failed: ${ytSrErr}`);
      }

      // C. Fallback 3: ytdl.getInfo dengan timeout 4000ms
      try {
        const ytdl = await getYtdl();
        const info = await Promise.race([
          ytdl.getInfo(sanitizedVideoUrl),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('ytdl.getInfo timed out (4s)')), 4000)
          ),
        ]);
        const details = info.videoDetails;
        const durationSec = Number(details.lengthSeconds) || 0;

        const track = new Track(this.context.player, {
          title: details.title,
          description: details.description || details.title,
          author: details.author?.name || 'YouTube',
          url: sanitizedVideoUrl,
          thumbnail: details.thumbnails?.[details.thumbnails.length - 1]?.url || details.thumbnails?.[0]?.url || '',
          duration: Util.buildTimeCode(Util.parseMS(durationSec * 1000)),
          views: Number(details.viewCount) || 0,
          requestedBy: context.requestedBy,
          source: 'youtube',
          queryType: QueryType.YOUTUBE_VIDEO,
        });

        track.extractor = this;
        return this.createResponse(null, [track]);
      } catch (err) {
        this.context.player.debug(`Failed to fetch direct YouTube video via ytdl: ${err}`);
      }

      // Jangan pernah fallback ke YouTube.search jika query adalah URL YouTube langsung yang gagal diparse
      return this.createResponse(null, []);
    }

    // 3. YouTube Search Query (hanya untuk query teks judul lagu biasa, bukan URL)
    if (/^https?:\/\//i.test(cleanUrl)) {
      return this.createResponse(null, []);
    }

    try {
      const videos = await YouTube.search(cleanUrl, { limit: 10, type: 'video' });
      const tracks = videos.map((v) => {
        const track = new Track(this.context.player, {
          title: v.title || 'YouTube Track',
          description: v.title || '',
          author: v.channel?.name || 'YouTube',
          url: v.url,
          thumbnail: v.thumbnail?.url || '',
          duration: v.durationFormatted || Util.buildTimeCode(Util.parseMS(v.duration || 0)),
          views: v.views || 0,
          requestedBy: context.requestedBy,
          source: 'youtube',
          queryType: QueryType.YOUTUBE_VIDEO,
        });
        track.extractor = this;
        return track;
      });

      return this.createResponse(null, tracks);
    } catch {
      return this.createResponse(null, []);
    }
  }

  /**
   * Mengunduh audio YouTube dengan proteksi verifikasi chunk pertama.
   * Timeout default 18s untuk stabilitas jaringan datacenter cloud pada video berdurasi panjang (konser/playlist).
   */
  private async downloadYouTubeVerified(streamUrl: string, timeoutMs = 18000): Promise<Readable> {
    const ytdl = await getYtdl();
    return new Promise(async (resolve, reject) => {
      let settled = false;
      try {
        const rawStream = await ytdl.download(streamUrl, {
          quality: 'highestaudio',
          filter: (f: any) => Boolean(f.hasAudio && !f.hasVideo),
          highWaterMark: 1024 * 1024 * 2,
        });

        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            rawStream.destroy();
            reject(new Error('YouTube stream timed out (Cloud IP blocked/throttled)'));
          }
        }, timeoutMs);

        const pt = new PassThrough();

        rawStream.once('error', (err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            rawStream.destroy();
            reject(err);
          }
        });

        rawStream.once('data', (firstChunk) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            pt.write(firstChunk);
            rawStream.pipe(pt);
            resolve(pt);
          }
        });
      } catch (err) {
        if (!settled) {
          settled = true;
          reject(err);
        }
      }
    });
  }

  /**
   * Helper untuk mengambil audio stream resmi dari SoundCloud dengan filter ketat anti-remix / anti-bootleg.
   */
  private async getSoundCloudAudio(
    title: string,
    author: string,
    durationMS: number | undefined,
    requestedBy: any
  ): Promise<Readable | string | null> {
    try {
      const scExt = new SoundCloudExtractor(this.context, {});
      await scExt.activate();
      const cleanTitle = title.replace(/[\(\[\{].*?[\)\]\}]/g, '').trim() || title;
      const cleanAuthor = author.replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();
      const searchQuery = cleanAuthor && !cleanTitle.toLowerCase().includes(cleanAuthor.toLowerCase())
        ? `${cleanAuthor} - ${cleanTitle}`
        : cleanTitle;

      console.log(`✨ [AudioEngine]: Mencari SoundCloud resmi: "${searchQuery}"`);
      const searchRes = await scExt.handle(searchQuery, { requestedBy });
      if (searchRes.tracks.length > 0) {
        const bestTrack = findBestSoundCloudTrack(searchRes.tracks, cleanTitle, cleanAuthor, durationMS);
        if (bestTrack) {
          console.log(`✅ [AudioEngine]: Terhubung ke SoundCloud resmi: "${bestTrack.title}" by "${bestTrack.author}" (${bestTrack.duration})`);
          return await scExt.stream(bestTrack);
        } else {
          console.warn(`⚠️ [AudioEngine]: Hasil SoundCloud untuk "${searchQuery}" ditolak karena tidak ada versi resmi yang cocok.`);
        }
      }
    } catch (scErr) {
      this.context.player.debug(`SoundCloud stream fetch error: ${scErr}`);
    }
    return null;
  }

  async stream(track: Track): Promise<Readable | string> {
    const streamUrl = sanitizeYouTubeUrl(track.url);

    // 1. Coba stream via YouTube dengan verifikasi penerimaan chunk data (timeout 18s untuk kestabilan cloud)
    try {
      console.log(`📡 [AudioEngine]: Memulai stream YouTube untuk "${track.title}"...`);
      const ytStream = await this.downloadYouTubeVerified(streamUrl, 18000);
      return ytStream;
    } catch (ytErr) {
      console.warn(`⚠️ [AudioEngine]: YouTube stream gagal (${(ytErr as Error)?.message || ytErr}).`);
    }

    // PENTING: Jika track berasal dari link YouTube langsung, JANGAN PERNAH fallback ke SoundCloud!
    // Memutar lagu acak dari SoundCloud membuat audio tidak sinkron dengan video yang diminta user.
    if (track.source === 'youtube' || /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i.test(track.url)) {
      throw new Error(`Tidak dapat memutar audio untuk video YouTube "${track.title}". YouTube mungkin membatasi streaming untuk video ini.`);
    }

    // 2. Fallback HANYA untuk non-direct YouTube (misal audio bridging Spotify): SoundCloud Direct CDN Stream dengan FILTER KETAT
    const author = (track.author || '').trim();
    const cleanTitle = track.title.trim();

    const scStream = await this.getSoundCloudAudio(cleanTitle, author, track.durationMS, track.requestedBy);
    if (scStream) {
      return scStream;
    }

    throw new Error(`Tidak dapat memutar audio resmi untuk "${track.title}".`);
  }

  async bridge(track: Track, sourceExtractor?: any): Promise<Readable | string | null> {
    const author = (track.author || '').trim();
    const title = track.title.trim();

    // 1. PRIORITAS UTAMA: Bridging ke YouTube Official Studio Track
    // Bersihkan operator minus/koma agar YouTube search menemukan video resmi studio dengan 100% akurasi
    try {
      const query = sourceExtractor?.createBridgeQuery
        ? sourceExtractor.createBridgeQuery(track)
        : cleanBridgeQuery(author, title);

      console.log(`🔍 [AudioEngine]: Mencari audio resmi di YouTube untuk "${author} - ${title}" (Query: "${query}")...`);
      const searchVideos = await YouTube.search(query, { limit: 8, type: 'video' });
      const bestVideo = findBestOfficialVideo(
        searchVideos,
        track.title,
        track.author,
        track.durationMS
      );

      if (bestVideo) {
        track.raw = {
          ...(track.raw || {}),
          bridgedYoutubeUrl: bestVideo.url,
          bridgedYoutubeTitle: bestVideo.title,
        };

        console.log(`✅ [AudioEngine]: Terhubung ke YouTube Studio Resmi: "${bestVideo.title}" (${bestVideo.durationFormatted})`);
        return await this.downloadYouTubeVerified(bestVideo.url, 18000);
      }
    } catch (error) {
      console.warn(`⚠️ [AudioEngine]: YouTube bridge stream gagal (${(error as Error)?.message || error}). Beralih ke fallback tersaring di SoundCloud...`);
    }

    // 2. FALLBACK CADANGAN: SoundCloud dengan STRICT ACCURACY FILTER
    // Hanya jika YouTube tidak dapat diakses dan HANYA lagu yang lolos filter keaslian studio
    console.warn(`⚠️ [AudioEngine]: YouTube bridge tidak tersedia. Mencoba fallback tersaring di SoundCloud...`);
    const cleanTitle = title.replace(/[\(\[\{].*?[\)\]\}]/g, '').trim() || title;
    const scStream = await this.getSoundCloudAudio(cleanTitle, author, track.durationMS, track.requestedBy);
    if (scStream) {
      return scStream;
    }

    return null;
  }
}
