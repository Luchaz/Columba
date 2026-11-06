import {
  BaseExtractor,
  Playlist,
  QueryType,
  Track,
  Util,
} from 'discord-player';
import { Ytdl } from '@distube/ytdl-core';
import YouTube, { Video } from 'youtube-sr';
import { Readable } from 'stream';
import { sanitizeYouTubeUrl } from '../utils/smartSearch';

const ytdl = new Ytdl();

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
      if (diff > 50) continue;
    }

    let score = 100;
    if (targetSec > 0 && vSec > 0) {
      score -= Math.abs(vSec - targetSec);
    }

    // Skor bonus untuk channel resmi atau audio resmi
    if (vChannel.includes('topic') || vChannel.includes('vevo')) score += 30;
    if (vTitle.includes('official audio') || vTitle.includes('official music video')) score += 25;
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

    // 2. Single YouTube Video URL (bersihkan parameter playlist mix agar tidak mengganggu metadata)
    if (/^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i.test(cleanUrl)) {
      try {
        const sanitizedVideoUrl = sanitizeYouTubeUrl(cleanUrl);

        const info = await ytdl.getInfo(sanitizedVideoUrl);
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
        this.context.player.debug(`Failed to fetch direct YouTube video: ${err}`);
      }
    }

    // 3. YouTube Search Query
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

  async stream(track: Track): Promise<Readable> {
    const streamUrl = sanitizeYouTubeUrl(track.url);

    return (await ytdl.download(streamUrl, {
      quality: 'highestaudio',
      filter: { hasAudio: true, hasVideo: false },
      highWaterMark: 1024 * 1024 * 4, // Buffer 4 MB untuk pengiriman stream instan tanpa delay
    })) as unknown as Readable;
  }

  async bridge(track: Track, sourceExtractor?: any): Promise<Readable | null> {
    try {
      const query = sourceExtractor?.createBridgeQuery
        ? sourceExtractor.createBridgeQuery(track)
        : `${track.author} - ${track.title} official audio`;

      const searchVideos = await YouTube.search(query, { limit: 8, type: 'video' });
      const bestVideo = findBestOfficialVideo(
        searchVideos,
        track.title,
        track.author,
        track.durationMS
      );

      if (!bestVideo) return null;

      track.raw = {
        ...(track.raw || {}),
        bridgedYoutubeUrl: bestVideo.url,
        bridgedYoutubeTitle: bestVideo.title,
      };

      return (await ytdl.download(bestVideo.url, {
        quality: 'highestaudio',
        filter: { hasAudio: true, hasVideo: false },
        highWaterMark: 1024 * 1024 * 4,
      })) as unknown as Readable;
    } catch (error) {
      this.context.player.debug(`ModernYouTubeExtractor bridge error: ${error}`);
      return null;
    }
  }
}
