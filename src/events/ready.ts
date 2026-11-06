import { ActivityType, Client, Events, REST, Routes } from 'discord.js';

export function registerClientReadyEvent(client: Client) {
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`🚀 [Bot Online]: Login berhasil sebagai ${readyClient.user.tag}`);

    // Set status aktivitas bot: Listening to Master's Information System ITS
    readyClient.user.setActivity("Master's Information System ITS", {
      type: ActivityType.Listening,
    });

    // Update nama bot menjadi Columba
    const guildId = process.env.DISCORD_GUILD_ID;
    if (guildId && guildId.trim() !== '') {
      const targetGuild = readyClient.guilds.cache.get(guildId.trim());
      if (targetGuild) {
        try {
          await targetGuild.members.me?.setNickname('Columba');
          console.log('✅ [Nickname]: Berhasil mengubah nama bot di server menjadi Columba');
        } catch (err) {
          console.warn('⚠️ [Nickname]: Gagal mengatur server nickname:', err);
        }
      }
    }

    // Bersihkan koneksi voice yang menggantung dari restart sebelumnya
    readyClient.guilds.cache.forEach((guild) => {
      if (guild.members.me?.voice.channel) {
        try {
          guild.members.me.voice.disconnect();
          console.log(`🧹 [Voice Clean]: Membersihkan voice stale di guild "${guild.name}"`);
        } catch {}
      }
    });

    try {
      if (readyClient.user.username !== 'Columba') {
        await readyClient.user.setUsername('Columba');
        console.log('✅ [Username]: Berhasil mengubah username global bot menjadi Columba');
      }
    } catch {
      // Abaikan jika terkena limit Discord (2x ganti per jam), server nickname sudah aktif
    }

    const token = process.env.DISCORD_TOKEN!;
    const clientId = process.env.DISCORD_CLIENT_ID || readyClient.user.id;

    const commandsPayload = readyClient.commands.map((cmd) => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);

    try {
      if (guildId && guildId.trim() !== '') {
        console.log(
          `⏳ [Slash Sync]: Mendaftarkan ${commandsPayload.length} Slash Commands ke Guild ID (${guildId})...`
        );
        await rest.put(Routes.applicationGuildCommands(clientId, guildId.trim()), {
          body: commandsPayload,
        });
        console.log('✅ [Slash Sync]: Guild Slash Commands berhasil terdaftar secara instan!');
      } else {
        console.log(
          `⏳ [Slash Sync]: Mendaftarkan ${commandsPayload.length} Global Slash Commands...`
        );
        await rest.put(Routes.applicationCommands(clientId), {
          body: commandsPayload,
        });
        console.log('✅ [Slash Sync]: Global Slash Commands berhasil terdaftar!');
      }
    } catch (error) {
      console.error('❌ [Slash Sync Error]: Gagal mendaftarkan Slash Commands:', error);
    }
  });
}
