import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import http from 'http';

import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { FFmpeg } from '@discord-player/ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { BotCommand } from './types/bot';
import { ModernYouTubeExtractor } from './extractors/modernYouTubeExtractor';
import { registerPlayerEvents } from './events/playerEvents';
import { registerClientReadyEvent } from './events/ready';
import { registerInteractionCreateEvent } from './events/interactionCreate';
import { registerMessageCreateEvent } from './events/messageCreate';
import { initBirthdayScheduler } from './services/birthdayScheduler';

// Pastikan FFmpeg binary terdeteksi otomatis (menggunakan /usr/bin/ffmpeg di Linux Docker atau ffmpeg-static di Windows)
if (!process.env.FFMPEG_PATH) {
  if (process.platform === 'linux' && fs.existsSync('/usr/bin/ffmpeg')) {
    process.env.FFMPEG_PATH = '/usr/bin/ffmpeg';
  } else if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    process.env.FFMPEG_PATH = ffmpegPath;
  }
}

// Patch FFmpeg.spawn untuk memperbaiki bug fMP4 HLS stream (0-byte immediate exit akibat -analyzeduration 0 & -ss 0/undefined)
const originalFFmpegSpawn = FFmpeg.spawn.bind(FFmpeg);
FFmpeg.spawn = function ({ args = [], shell = false }: { args?: string[]; shell?: boolean } = {}) {
  const cleanedArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const nextVal = args[i + 1];

    // Hapus flag -ss yang bernilai 0, undefined, atau NaN karena merusak pembacaan header init.mp4 pada HLS stream
    if (
      flag === '-ss' &&
      (nextVal === '0' || nextVal === 'undefined' || nextVal === 'NaN' || nextVal === 'null')
    ) {
      i++;
      continue;
    }

    // Hapus -analyzeduration 0 agar FFmpeg dapat membaca codec AAC/Opus dari segmen fMP4 HLS dengan sempurna
    if (flag === '-analyzeduration' && nextVal === '0') {
      i++;
      continue;
    }

    cleanedArgs.push(flag);
  }

  return originalFFmpegSpawn({ args: cleanedArgs, shell });
};

async function bootstrap() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('❌ [ERROR]: DISCORD_TOKEN belum diatur di dalam file .env / Environment Variables!');
    process.exit(1);
  }

  // 1. Inisialisasi Discord Client dengan Intents lengkap (termasuk MessageContent untuk prefix m!p)
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.commands = new Collection<string, BotCommand>();

  // 2. Muat semua Slash Commands dari folder src/commands secara dinamis
  const commandsDir = path.join(__dirname, 'commands');
  const commandFiles = fs
    .readdirSync(commandsDir)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    const imported = await import(filePath);
    const command: BotCommand = imported.default || imported.command;

    if (command && 'data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ [Command Loaded]: /${command.data.name}`);
    }
  }

  // 3. Inisialisasi Discord Player Engine
  const player = new Player(client, {
    skipFFmpeg: false,
  });

  // 4. Registrasi Extractors: Modern YouTube Extractor didaftarkan pertama agar menjadi prioritas utama bridging Spotify
  console.log('⏳ [AudioEngine]: Memuat Modern YouTube Extractor & Audio Engine...');
  await player.extractors.register(ModernYouTubeExtractor, {});

  // Registrasi DefaultExtractors (Spotify, SoundCloud Fallback, Apple Music)
  await player.extractors.loadMulti(DefaultExtractors);
  for (const ext of player.extractors.store.values()) {
    ext.createBridgeQuery = (track) => `${track.author} - ${track.title} official audio`;
  }
  console.log('✅ [AudioEngine]: Seluruh Extractor (Spotify, Modern YouTube HQ Bridge, & Native Stream) siap!');

  // 5. Pasang Event Listeners (Player Events, Slash Commands, & Prefix m!p Playback Cepat)
  registerPlayerEvents(player);
  registerClientReadyEvent(client);
  registerInteractionCreateEvent(client);
  registerMessageCreateEvent(client);

  // 6. Jalankan Scheduler Otomatis Ulang Tahun Mahasiswa S2 SI ITS 2026
  initBirthdayScheduler(client);

  // 7. Built-in Health-Check HTTP Server untuk Cloud Worker 24/7 (Railway / Render)
  const port = Number(process.env.PORT) || 3000;
  http
    .createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'online',
          botTag: client.user?.tag || 'initializing',
          guilds: client.guilds.cache.size,
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        })
      );
    })
    .listen(port, '0.0.0.0', () => {
      console.log(`🌐 [HealthCheck]: Worker HTTP Server aktif di port ${port}`);
    });

  // Penanganan Error Global agar bot tidak crash tiba-tiba di production
  process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [Unhandled Rejection]:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('⚠️ [Uncaught Exception]:', error);
  });

  // 7. Login ke Discord Gateway
  await client.login(token);
}

bootstrap().catch((err) => {
  console.error('❌ [Bootstrap Fatal Error]:', err);
  process.exit(1);
});
