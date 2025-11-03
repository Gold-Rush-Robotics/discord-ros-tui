import {
  ChannelType,
  Client,
  GuildChannel,
  GuildMember,
  Role,
} from "discord.js";

/**
 * Lookup a channel by name or ID
 */
export async function findChannelByNameOrId(
  client: Client,
  guildId: string,
  nameOrId: string
): Promise<GuildChannel | null> {
  const guild = await client.guilds.fetch(guildId);
  const channels = await guild.channels.fetch();

  // Try as ID first
  const byId = channels.get(nameOrId);
  if (byId && byId.type === ChannelType.GuildText) {
    return byId as GuildChannel;
  }

  // Try by name (case-insensitive, partial match)
  const normalized = nameOrId.toLowerCase();
  for (const channel of channels.values()) {
    if (
      channel?.type === ChannelType.GuildText &&
      channel.name.toLowerCase().includes(normalized)
    ) {
      return channel as GuildChannel;
    }
  }

  return null;
}

/**
 * Lookup a guild member (node) by display name, username, or ID
 */
export async function findNodeByNameOrId(
  client: Client,
  guildId: string,
  nameOrId: string
): Promise<GuildMember | null> {
  const guild = await client.guilds.fetch(guildId);
  const members = await guild.members.fetch();

  // Try as ID first
  const byId = members.get(nameOrId);
  if (byId) {
    return byId;
  }

  // Try by display name or username (case-insensitive, partial match)
  const normalized = nameOrId.toLowerCase();
  for (const member of members.values()) {
    if (
      member.displayName.toLowerCase().includes(normalized) ||
      member.user.username.toLowerCase().includes(normalized)
    ) {
      return member;
    }
  }

  return null;
}

/**
 * Lookup a role (package) by name or ID
 */
export async function findPackageByNameOrId(
  client: Client,
  guildId: string,
  nameOrId: string
): Promise<Role | null> {
  const guild = await client.guilds.fetch(guildId);
  const roles = await guild.roles.fetch();

  // Try as ID first
  const byId = roles.get(nameOrId);
  if (byId) {
    return byId;
  }

  // Try by name (case-insensitive, partial match)
  const normalized = nameOrId.toLowerCase();
  for (const role of roles.values()) {
    if (role.name.toLowerCase().includes(normalized)) {
      return role;
    }
  }

  return null;
}

/**
 * Lookup a service (mentioned user) by display name, username, or ID
 * Only searches users that have been mentioned in messages
 */
export async function findServiceByNameOrId(
  client: Client,
  guildId: string,
  nameOrId: string,
  mentionedUserIds: Set<string>
): Promise<GuildMember | null> {
  if (mentionedUserIds.size === 0) {
    return null;
  }

  const guild = await client.guilds.fetch(guildId);

  // Try as ID first
  if (mentionedUserIds.has(nameOrId)) {
    try {
      return await guild.members.fetch(nameOrId);
    } catch {
      return null;
    }
  }

  // Try by display name or username (case-insensitive, partial match)
  const normalized = nameOrId.toLowerCase();
  for (const userId of mentionedUserIds) {
    try {
      const member = await guild.members.fetch(userId);
      if (
        member.displayName.toLowerCase().includes(normalized) ||
        member.user.username.toLowerCase().includes(normalized)
      ) {
        return member;
      }
    } catch {
      // Skip users no longer in guild
      continue;
    }
  }

  return null;
}
