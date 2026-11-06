import {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { GuildQueue, Player, Track } from 'discord-player';
import { QueueMetadata } from '../types/bot';
import { BRAND_COLORS, createNowPlayingPayload } from '../utils/embedBuilder';

// Pelacak waktu mulai lagu per Guild untuk mencegah spam jika ada stream yang rusak
const trackStartTimestamps = new Map<string, number>();
const rapidSkipCounts = new Map<string, number>();

/**
 * SMART CLEAN-UP:
 * Menonaktifkan tombol pada pesan lama jika memiliki komponen tombol.
 */
export async function disableOldPlayerMessage(
  queue: GuildQueue<QueueMetadata>,
  _finishedTrack?: Track | null
) {
  const oldMessage = queue.metadata?.lastPlayerMessage;
  if (!oldMessage) return;

  try {
    if (oldMessage.components.length > 0) {
      const disabledRows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
      for (const row of oldMessage.components) {
        if (!('components' in row)) continue;
        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
        for (const comp of row.components) {
          if (comp.type === ComponentType.Button) {
            actionRow.addComponents(ButtonBuilder.from(comp).setDisabled(true));
          } else if (comp.type === ComponentType.StringSelect) {
            actionRow.addComponents(StringSelectMenuBuilder.from(comp).setDisabled(true));
          }
        }
        if (actionRow.components.length > 0) {
          disabledRows.push(actionRow);
        }
      }
      await oldMessage.edit({ components: disabledRows });
    }
  } catch {
    // Abaikan jika pesan lama sudah dihapus manual
  } finally {
    if (queue.metadata) {
      queue.metadata.lastPlayerMessage = null;
    }
  }
}

/**
 * Mendaftarkan seluruh event siklus hidup pemutar musik (discord-player)
 */
export function registerPlayerEvents(player: Player) {
  // 1. Saat lagu baru mulai diputar -> Kirim notifikasi minimalis Merpatify
  player.events.on('playerStart', async (queue: GuildQueue<QueueMetadata>, track: Track) => {
    const guildId = queue.guild.id;
    trackStartTimestamps.set(guildId, Date.now());
    console.log(`🎶 [Player]: Memulai audio "${track.title}" (${track.duration}) di ${queue.guild.name} [Volume: ${queue.node.volume}%]`);

    const channel = queue.metadata?.channel;
    if (!channel || !('send' in channel)) return;

    try {
      const payload = createNowPlayingPayload(queue, track, false);
      const sentMessage = await channel.send(payload);
      if (queue.metadata) {
        queue.metadata.lastPlayerMessage = sentMessage;
      }
    } catch (error) {
      console.error('[playerStart Send Error]:', error);
    }
  });

  // 2. Saat lagu selesai diputar -> Cek apakah lagu selesai normal atau terlalu cepat (proteksi anti-spam)
  player.events.on('playerFinish', async (queue: GuildQueue<QueueMetadata>, track: Track) => {
    const guildId = queue.guild.id;
    const startedAt = trackStartTimestamps.get(guildId) || 0;
    const elapsedMs = Date.now() - startedAt;

    if (startedAt > 0 && elapsedMs < 2500) {
      const fails = (rapidSkipCounts.get(guildId) || 0) + 1;
      rapidSkipCounts.set(guildId, fails);

      if (fails >= 3) {
        console.warn(`[AntiSpam Guard]: Menghentikan antrean di ${queue.guild.name} karena 3 stream berturut-turut gagal.`);
        rapidSkipCounts.set(guildId, 0);
        queue.tracks.clear();
        queue.node.stop();
        const channel = queue.metadata?.channel;
        if (channel && 'send' in channel) {
          await channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.ERROR)
                  .setDescription('⚠️ Stream lagu tidak tersedia saat ini. Silakan coba judul atau link lain.'),
              ],
            })
            .catch(() => null);
        }
        return;
      }
    } else {
      rapidSkipCounts.set(guildId, 0);
    }

    await disableOldPlayerMessage(queue, track);
  });

  // 3. Saat semua lagu di antrean telah habis diputar
  player.events.on('emptyQueue', async (queue: GuildQueue<QueueMetadata>) => {
    rapidSkipCounts.set(queue.guild.id, 0);
    await disableOldPlayerMessage(queue);
  });

  // 4. Smart Auto-Leave: Saat Voice Channel kosong selama 3 menit
  player.events.on('emptyChannel', async (queue: GuildQueue<QueueMetadata>) => {
    rapidSkipCounts.set(queue.guild.id, 0);
    await disableOldPlayerMessage(queue);
  });

  // 5. Saat bot terputus dari Voice Channel
  player.events.on('disconnect', async (queue: GuildQueue<QueueMetadata>) => {
    rapidSkipCounts.set(queue.guild.id, 0);
    console.log(`🔌 [Voice Connection]: Bot terputus dari voice di ${queue.guild.name}`);
    await disableOldPlayerMessage(queue);
  });

  // Saat bot berhasil terhubung ke Voice Channel
  player.events.on('connection', (queue: GuildQueue<QueueMetadata>) => {
    console.log(`📡 [Voice Connection]: Berhasil terhubung ke "${queue.channel?.name}" di ${queue.guild.name}`);
    const dispatcher = queue.dispatcher;
    if (dispatcher) {
      dispatcher.voiceConnection?.on('stateChange', (oldS, newS) => {
        console.log(`🔊 [VoIP State]: ${oldS.status} -> ${newS.status}`);
      });
      dispatcher.audioPlayer?.on('stateChange', (oldS, newS) => {
        console.log(`🎵 [AudioPlayer State]: ${oldS.status} -> ${newS.status}`);
      });
    }
  });

  // 6. Penanganan Error pada Player / Audio Stream
  player.events.on('error', (queue, error) => {
    console.error(`[Queue Error di Guild ${queue.guild.name}]:`, error.message);
  });

  player.events.on('playerError', (queue: GuildQueue<QueueMetadata>, error, track) => {
    console.error(`[Player Stream Error untuk "${track.title}"]:`, error.message);
  });
}
