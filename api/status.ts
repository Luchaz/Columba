interface VercelRequestLike {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponseLike {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(body: unknown): void;
  };
}

export default function handler(_req: VercelRequestLike, res: VercelResponseLike) {
  const botName = process.env.BOT_NAME || 'Columba';
  const hasDiscordClient = Boolean(process.env.DISCORD_CLIENT_ID);
  const inviteUrl = hasDiscordClient
    ? `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=3147776&scope=bot%20applications.commands`
    : null;

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
  res.status(200).json({
    status: 'online',
    service: botName,
    architecture: 'Hybrid (Vercel Status API + 24/7 Voice Worker)',
    audioEngine: {
      core: 'discord-player v7',
      youtubeExtractor: 'discord-player-youtubei (InnerTube ANDROID Client)',
      spotifyBridging: '@discord-player/extractor (On-Demand Audio Stream Bridging)',
    },
    features: [
      'Dynamic Brand Embed Color (Spotify #1DB954 & YouTube #FF0000)',
      '2-Layer Interactive Control Buttons + 1-Layer Audio Filter Dropdown',
      'Live Search Autocomplete on /play',
      'Ephemeral Lyrics Lookup via LRCLIB',
      'Smart 3-Minute Auto-Leave & Automatic Old Button Cleanup',
    ],
    links: {
      inviteBot: inviteUrl,
    },
    timestamp: new Date().toISOString(),
  });
}
