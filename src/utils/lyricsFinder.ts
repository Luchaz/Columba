export interface LyricsResult {
  title: string;
  artist: string;
  lyrics: string;
  source: string;
}

/**
 * Membersihkan judul lagu dari kata-kata tambahan YouTube seperti
 * "(Official Music Video)", "[Lyrics]", "ft.", "feat.", dll. agar pencarian lirik akurat.
 */
export function cleanTrackTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\(.*?(official|video|audio|lyric|lyrics|visualizer|hd|4k|hq|mv).*?\)/gi, '')
    .replace(/\[.*?(official|video|audio|lyric|lyrics|visualizer|hd|4k|hq|mv).*?\]/gi, '')
    .replace(/\b(ft\.?|feat\.?)\b.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mencari lirik lagu berdasarkan judul dan nama artis menggunakan LRCLIB API.
 */
export async function findTrackLyrics(
  rawTitle: string,
  rawArtist?: string
): Promise<LyricsResult | null> {
  try {
    const cleanedTitle = cleanTrackTitle(rawTitle);
    const cleanedArtist = rawArtist
      ? rawArtist.replace(/\s*(- Topic|VEVO|Official)$/i, '').trim()
      : '';

    const query = `${cleanedArtist} ${cleanedTitle}`.trim();
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MelodifyDiscordMusicBot/1.0.0 (https://github.com)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{
      trackName?: string;
      artistName?: string;
      plainLyrics?: string;
      syncedLyrics?: string;
    }>;

    if (!Array.isArray(results) || results.length === 0) {
      // Fallback: Coba cari hanya dengan judul lagu yang sudah dibersihkan
      const fallbackUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanedTitle)}`;
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) return null;

      const fallbackData = (await fallbackRes.json()) as typeof results;
      const match = fallbackData.find((item) => item.plainLyrics);
      if (!match || !match.plainLyrics) return null;

      return {
        title: match.trackName || cleanedTitle,
        artist: match.artistName || cleanedArtist || 'Unknown Artist',
        lyrics: match.plainLyrics.trim(),
        source: 'LRCLIB Music Database',
      };
    }

    const bestMatch = results.find((item) => item.plainLyrics) || results[0];
    if (!bestMatch?.plainLyrics) {
      return null;
    }

    return {
      title: bestMatch.trackName || cleanedTitle,
      artist: bestMatch.artistName || cleanedArtist || 'Unknown Artist',
      lyrics: bestMatch.plainLyrics.trim(),
      source: 'LRCLIB Music Database',
    };
  } catch (error) {
    console.error('[LyricsFinder Error]:', error);
    return null;
  }
}
