import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  TextBasedChannel,
  User,
} from 'discord.js';
import { QueueFilters } from 'discord-player';

/**
 * Kontrak standar untuk setiap file Slash Command di folder src/commands/
 */
export interface BotCommand {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

/**
 * Metadata yang disimpan di dalam setiap GuildQueue discord-player.
 * Digunakan untuk mengirim pesan ke Text Channel dan menonaktifkan tombol Embed lama.
 */
export interface QueueMetadata {
  channel: TextBasedChannel;
  requestedBy: User;
  lastPlayerMessage?: Message | null;
  activeFilter?: AudioFilterPreset;
}

/**
 * Pilihan preset Filter Audio FFmpeg pada Dropdown Menu Baris ke-3
 */
export type AudioFilterPreset =
  | 'off'
  | 'bassboost'
  | 'nightcore'
  | 'vaporwave'
  | 'lofi'
  | '8D';

export interface FilterOptionMeta {
  label: string;
  description: string;
  emoji: string;
  ffmpegFilter: keyof QueueFilters | null;
}

/**
 * Perluasan (Module Augmentation) agar client.commands dikenali oleh TypeScript
 */
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, BotCommand>;
  }
}
