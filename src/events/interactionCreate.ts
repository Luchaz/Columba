import {
  Client,
  EmbedBuilder,
  Events,
  GuildMember,
  Interaction,
} from 'discord.js';
import { QueueRepeatMode, useQueue } from 'discord-player';
import { AudioFilterPreset, QueueMetadata } from '../types/bot';
import {
  AUDIO_FILTER_PRESETS,
  BRAND_COLORS,
  createNowPlayingPayload,
  createQueuePayload,
  resolvePlatformTheme,
} from '../utils/embedBuilder';
import { findTrackLyrics } from '../utils/lyricsFinder';
import { disableOldPlayerMessage } from './playerEvents';
import { buildLabDetailEmbed } from '../commands/lab';

export function registerInteractionCreateEvent(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      // ======================================================================
      // 1. LIVE SEARCH AUTOCOMPLETE HANDLER (/play <query>)
      // ======================================================================
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) {
          await command.autocomplete(interaction);
        }
        return;
      }

      // ======================================================================
      // 2. SLASH COMMANDS HANDLER (/play, /nowplaying, /queue, /skip, dll.)
      // ======================================================================
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction);
        return;
      }

      // ======================================================================
      // 3. INTERACTIVE BUTTONS HANDLER (Baris 1 & Baris 2 + Pagination Queue)
      // ======================================================================
      if (interaction.isButton()) {
        const { customId } = interaction;
        if (!customId.startsWith('music_')) return;

        const queue = useQueue<QueueMetadata>(interaction.guildId!);

        // A. Tombol Navigasi Halaman Queue & Tombol "View Queue" (Bisa diklik siapa saja)
        if (customId.startsWith('music_queue_page_')) {
          if (!queue || !queue.currentTrack) {
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.WARNING)
                  .setDescription('ℹ️ **Antrean musik saat ini sudah kosong.**'),
              ],
              ephemeral: true,
            });
            return;
          }

          const targetPage = Number(customId.replace('music_queue_page_', '')) || 0;
          const queuePayload = createQueuePayload(queue, targetPage);

          // Jika tombol diklik dari dalam pesan Daftar Antrean (Prev / Next Page), update pesan tersebut
          const isQueueEmbedMessage =
            interaction.message.embeds[0]?.title?.includes('Daftar Antrean Musik');

          if (isQueueEmbedMessage) {
            await interaction.update(queuePayload);
          } else {
            // Jika diklik dari tombol [📜 View Queue] di kartu Now Playing, tampilkan secara Ephemeral
            await interaction.reply({
              ...queuePayload,
              ephemeral: true,
            });
          }
          return;
        }

        // B. Tombol [📝 Lyrics] -> Tampilkan Lirik secara Ephemeral (Anti-Spam Chat)
        if (customId === 'music_lyrics') {
          if (!queue || !queue.currentTrack) {
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.WARNING)
                  .setDescription('ℹ️ **Tidak ada lagu yang sedang diputar saat ini.**'),
              ],
              ephemeral: true,
            });
            return;
          }

          await interaction.deferReply({ ephemeral: true });
          const track = queue.currentTrack;
          const lyricsData = await findTrackLyrics(track.title, track.author);

          if (!lyricsData) {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.ERROR)
                  .setDescription(
                    `📝 **Maaf, lirik untuk lagu \`${track.title}\` belum ditemukan di database.**`
                  ),
              ],
            });
            return;
          }

          const theme = resolvePlatformTheme(track);
          const safeLyrics =
            lyricsData.lyrics.length > 3900
              ? `${lyricsData.lyrics.slice(0, 3900)}\n\n*... (Lirik dipotong karena batas karakter Discord)*`
              : lyricsData.lyrics;

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(theme.color)
                .setTitle(`📝 ${lyricsData.title} — ${lyricsData.artist}`)
                .setURL(track.url)
                .setThumbnail(track.thumbnail || null)
                .setDescription(safeLyrics)
                .setFooter({
                  text: `Sumber: ${lyricsData.source} • Hanya terlihat olehmu (Ephemeral)`,
                })
                .setTimestamp(),
            ],
          });
          return;
        }

        // C. Validasi Voice Channel untuk Tombol Kontrol Pemutaran (Pause, Skip, Stop, Shuffle, Loop, Autoplay)
        if (!queue || !queue.currentTrack) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.WARNING)
                .setDescription('ℹ️ **Sesi pemutaran musik sudah berakhir.**'),
            ],
            ephemeral: true,
          });
          return;
        }

        const member = interaction.member as GuildMember;
        const botVoiceChannel = interaction.guild?.members.me?.voice.channel;
        if (botVoiceChannel && member.voice.channelId !== botVoiceChannel.id) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.ERROR)
                .setDescription(
                  `❌ **Kamu harus berada di Voice Channel ${botVoiceChannel} untuk menggunakan panel kontrol ini!**`
                ),
            ],
            ephemeral: true,
          });
          return;
        }

        switch (customId) {
          case 'music_pause_resume': {
            const wasPaused = queue.node.isPaused();
            queue.node.setPaused(!wasPaused);
            await interaction.update(createNowPlayingPayload(queue, queue.currentTrack));
            break;
          }

          case 'music_skip': {
            const skippedTitle = queue.currentTrack.title;
            queue.node.skip();
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.PRIMARY)
                  .setDescription(`⏭️ **${interaction.user} melewati lagu:** \`${skippedTitle}\``),
              ],
              ephemeral: true,
            });
            break;
          }

          case 'music_stop': {
            await disableOldPlayerMessage(queue, queue.currentTrack);
            queue.delete();
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(BRAND_COLORS.ERROR)
                  .setDescription(
                    `⏹️ **Pemutaran musik dihentikan dan antrean dibersihkan oleh ${interaction.user}.**`
                  ),
              ],
            });
            break;
          }

          case 'music_shuffle': {
            if (queue.tracks.size < 2) {
              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(BRAND_COLORS.WARNING)
                    .setDescription('🔀 **Minimal harus ada 2 lagu di antrean untuk di-shuffle!**'),
                ],
                ephemeral: true,
              });
              return;
            }
            queue.tracks.shuffle();
            await interaction.update(createNowPlayingPayload(queue, queue.currentTrack));
            break;
          }

          case 'music_loop': {
            // Siklus: OFF -> TRACK -> QUEUE -> OFF
            const nextLoopMode =
              queue.repeatMode === QueueRepeatMode.OFF
                ? QueueRepeatMode.TRACK
                : queue.repeatMode === QueueRepeatMode.TRACK
                ? QueueRepeatMode.QUEUE
                : QueueRepeatMode.OFF;

            queue.setRepeatMode(nextLoopMode);
            await interaction.update(createNowPlayingPayload(queue, queue.currentTrack));
            break;
          }

          case 'music_autoplay': {
            const nextMode =
              queue.repeatMode === QueueRepeatMode.AUTOPLAY
                ? QueueRepeatMode.OFF
                : QueueRepeatMode.AUTOPLAY;

            queue.setRepeatMode(nextMode);
            await interaction.update(createNowPlayingPayload(queue, queue.currentTrack));
            break;
          }
        }
        return;
      }

      // ======================================================================
      // 4. DROPDOWN HANDLER (Filter Audio & Direktori Laboratorium)
      // ======================================================================
      if (interaction.isStringSelectMenu()) {
        // A. Direktori Mahasiswa per Lab Riset (/mahasiswa)
        if (interaction.customId === 'select_lab_directory') {
          const selectedLab = interaction.values[0];
          const embed = buildLabDetailEmbed(selectedLab);
          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
          return;
        }

        if (interaction.customId !== 'music_filter_select') return;

        const queue = useQueue<QueueMetadata>(interaction.guildId!);
        if (!queue || !queue.currentTrack) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.WARNING)
                .setDescription('ℹ️ **Tidak ada lagu yang sedang diputar saat ini.**'),
            ],
            ephemeral: true,
          });
          return;
        }

        const member = interaction.member as GuildMember;
        const botVoiceChannel = interaction.guild?.members.me?.voice.channel;
        if (botVoiceChannel && member.voice.channelId !== botVoiceChannel.id) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(BRAND_COLORS.ERROR)
                .setDescription(
                  `❌ **Kamu harus berada di Voice Channel ${botVoiceChannel} untuk mengubah filter audio!**`
                ),
            ],
            ephemeral: true,
          });
          return;
        }

        const selectedKey = interaction.values[0] as AudioFilterPreset;
        const filterMeta = AUDIO_FILTER_PRESETS[selectedKey] || AUDIO_FILTER_PRESETS.off;

        if (queue.metadata) {
          queue.metadata.activeFilter = selectedKey;
        }

        await interaction.update(createNowPlayingPayload(queue, queue.currentTrack));

        // Terapkan filter FFmpeg secara asinkron
        if (selectedKey === 'off' || !filterMeta.ffmpegFilter) {
          await queue.filters.ffmpeg.setFilters(false);
        } else {
          await queue.filters.ffmpeg.setFilters([filterMeta.ffmpegFilter]);
        }

        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(BRAND_COLORS.SUCCESS)
              .setDescription(
                `${filterMeta.emoji} **Filter Audio diubah ke \`${filterMeta.label}\`!** *(Efek akan terdengar dalam beberapa detik)*`
              ),
          ],
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('[InteractionCreate Error]:', error);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: '⚠️ Terjadi kesalahan saat memproses interaksi ini.',
            ephemeral: true,
          })
          .catch(() => null);
      }
    }
  });
}
