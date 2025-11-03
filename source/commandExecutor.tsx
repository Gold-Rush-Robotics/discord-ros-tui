import { ChannelType, Client, TextChannel } from "discord.js";
import { Text } from "ink";
import React from "react";
import { Selection } from "./DiscordClientProvider.js";
import Nodes from "./Nodes.js";
import Packages from "./Packages.js";
import Services from "./Services.js";
import Topics from "./Topics.js";
import {
  findChannelByNameOrId,
  findNodeByNameOrId,
  findPackageByNameOrId,
  findServiceByNameOrId,
} from "./commandUtils.js";

export type CommandResult =
  | { type: "list"; component: React.ReactNode }
  | { type: "selection"; selection: Selection }
  | { type: "error"; message: React.ReactNode }
  | { type: "help"; content: React.ReactNode };

export interface CommandExecutorContext {
  client: Client;
  guildId: string;
  setSelection: (selection: Selection | undefined) => void;
  getMentionedUserIds: () => Set<string>;
}

// Utilities for resolving channels and sending messages
async function resolveTextChannelId(
  client: Client,
  guildId: string,
  channelToken?: string | null
): Promise<string | null> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    // If explicit channel provided: try ID first, then by name includes
    if (channelToken) {
      const byId = channels.get(channelToken);
      if (byId && byId.type === ChannelType.GuildText) {
        return byId.id;
      }
      const normalized = channelToken.toLowerCase();
      const byName = Array.from(channels.values()).find(
        (c) =>
          c &&
          c.type === ChannelType.GuildText &&
          c.name.toLowerCase().includes(normalized)
      );
      if (byName) return byName.id;
    }

    // Fallback to #general
    const general = Array.from(channels.values()).find(
      (c) =>
        c &&
        c.type === ChannelType.GuildText &&
        c.name.toLowerCase() === "general"
    );
    if (general) return general.id;

    // Fallback to first text channel
    const firstText = Array.from(channels.values()).find(
      (c) => c && c.type === ChannelType.GuildText
    );
    return firstText?.id ?? null;
  } catch {
    return null;
  }
}

async function sendTextToChannel(
  client: Client,
  channelId: string,
  text: string
): Promise<void> {
  try {
    const fetched = await client.channels.fetch(channelId);
    if (fetched && fetched.type === ChannelType.GuildText) {
      await (fetched as TextChannel).send(text);
    }
  } catch {
    // ignore send failures
  }
}

// Help text for each command type
const HELP_TEXT = {
  node: {
    name: "Node commands",
    content: (
      <>
        <Text> ros2 node list</Text>
        <Text> ros2 node info {"<node_name_or_id>"}</Text>
      </>
    ),
  },
  topic: {
    name: "Topic commands",
    content: (
      <>
        <Text> ros2 topic list</Text>
        <Text> ros2 topic echo {"<topic_name_or_id>"}</Text>
        <Text> ros2 topic pub {"<topic_name_or_id> <message>"}</Text>
      </>
    ),
  },
  pkg: {
    name: "Package commands",
    content: (
      <>
        <Text> ros2 pkg list</Text>
        <Text> ros2 pkg contents {"<package_name_or_id>"}</Text>
      </>
    ),
  },
  service: {
    name: "Service commands",
    content: (
      <>
        <Text> ros2 service list</Text>
        <Text> ros2 service show {"<service_name_or_id>"}</Text>
        <Text> ros2 service call {"<service_name_or_id>"}</Text>
        <Text bold> Optional flags:</Text>
        <Text> -m | --message: optional message</Text>
        <Text> -c | --channel: optional channel (defaults to #general)</Text>
      </>
    ),
  },
} as const;

function getAllHelp(): React.ReactNode {
  return (
    <>
      <Text bold>Available commands:</Text>
      <Text> </Text>
      {Object.entries(HELP_TEXT).map(([key, { name, content }]) => (
        <React.Fragment key={key}>
          <Text bold>{name}:</Text>
          {content}
          <Text> </Text>
        </React.Fragment>
      ))}
      <Text>You can use IDs or names (partial matches work).</Text>
    </>
  );
}

function errorWithUsage(
  errorText: React.ReactNode,
  usage: React.ReactNode
): CommandResult {
  return {
    type: "error",
    message: (
      <>
        {errorText}
        <Text>Usage:</Text>
        {usage}
      </>
    ),
  };
}

// Node command handlers
async function handleNodeCommand(
  subArgs: string[],
  context: CommandExecutorContext
): Promise<CommandResult> {
  if (subArgs.length === 0) {
    return errorWithUsage(
      <Text>Incomplete command.</Text>,
      HELP_TEXT.node.content
    );
  }

  if (subArgs[0] === "list") {
    return {
      type: "list",
      component: <Nodes interactable={false} />,
    };
  }

  if (subArgs[0] === "info" && subArgs.length >= 2) {
    const nodeName = subArgs.slice(1).join(" ");
    const node = await findNodeByNameOrId(
      context.client,
      context.guildId,
      nodeName
    );
    if (!node) {
      return errorWithUsage(
        <Text>
          Node not found: <Text color="red">{nodeName}</Text>
        </Text>,
        <Text> ros2 node info {"<node_name_or_id>"}</Text>
      );
    }
    return {
      type: "selection",
      selection: { id: node.id, type: "node" },
    };
  }

  return errorWithUsage(
    <Text>Invalid node command.</Text>,
    HELP_TEXT.node.content
  );
}

// Topic command handlers
async function handleTopicCommand(
  subArgs: string[],
  context: CommandExecutorContext
): Promise<CommandResult> {
  if (subArgs.length === 0) {
    return errorWithUsage(
      <Text>Incomplete command.</Text>,
      HELP_TEXT.topic.content
    );
  }

  if (subArgs[0] === "list") {
    return {
      type: "list",
      component: <Topics interactable={false} />,
    };
  }

  if (subArgs[0] === "echo" && subArgs.length >= 2) {
    const topicName = subArgs.slice(1).join(" ");
    const channel = await findChannelByNameOrId(
      context.client,
      context.guildId,
      topicName
    );
    if (!channel) {
      return errorWithUsage(
        <Text>
          Topic not found: <Text color="red">{topicName}</Text>
        </Text>,
        <Text> ros2 topic echo {"<topic_name_or_id>"}</Text>
      );
    }
    return {
      type: "selection",
      selection: { id: channel.id, type: "topic" },
    };
  }

  if (subArgs[0] === "pub" && subArgs.length >= 3) {
    const topicName = subArgs[1]!;
    const message = subArgs.slice(2).join(" ");
    const channel = await findChannelByNameOrId(
      context.client,
      context.guildId,
      topicName
    );
    if (!channel) {
      return errorWithUsage(
        <Text>
          Topic not found: <Text color="red">{topicName}</Text>
        </Text>,
        <Text> ros2 topic pub {"<topic_name_or_id> <message>"}</Text>
      );
    }
    try {
      const fetched = await context.client.channels.fetch(channel.id);
      if (fetched && fetched.type === ChannelType.GuildText) {
        await (fetched as TextChannel).send(message);
      }
    } catch {}
    return {
      type: "selection",
      selection: { id: channel.id, type: "topic" },
    };
  }

  return errorWithUsage(
    <Text>Invalid topic command.</Text>,
    HELP_TEXT.topic.content
  );
}

// Package command handlers
async function handlePackageCommand(
  subArgs: string[],
  context: CommandExecutorContext
): Promise<CommandResult> {
  if (subArgs.length === 0) {
    return errorWithUsage(
      <Text>Incomplete package command.</Text>,
      HELP_TEXT.pkg.content
    );
  }

  if (subArgs[0] === "list") {
    return {
      type: "list",
      component: <Packages interactable={false} />,
    };
  }

  if (subArgs[0] === "contents" && subArgs.length >= 2) {
    const pkgName = subArgs.slice(1).join(" ");
    const role = await findPackageByNameOrId(
      context.client,
      context.guildId,
      pkgName
    );
    if (!role) {
      return errorWithUsage(
        <Text>
          Package not found: <Text color="red">{pkgName}</Text>
        </Text>,
        <Text> ros2 pkg contents {"<package_name_or_id>"}</Text>
      );
    }
    return {
      type: "selection",
      selection: { id: role.id, type: "package" },
    };
  }

  return errorWithUsage(
    <Text>Invalid package command.</Text>,
    HELP_TEXT.pkg.content
  );
}

// Service command handlers
async function handleServiceCall(
  tokens: string[],
  context: CommandExecutorContext
): Promise<CommandResult> {
  const {
    serviceToken,
    messagePayload: parsedMessage,
    channelToken,
    invalidFlags,
  } = parseServiceCallArgs(tokens);

  if (invalidFlags.length > 0) {
    return errorWithUsage(
      <Text>
        Invalid flag(s): <Text color="red">{invalidFlags.join(", ")}</Text>
      </Text>,
      HELP_TEXT.service.content
    );
  }

  const serviceName = (serviceToken ?? "").trim();
  if (!serviceName) {
    return errorWithUsage(
      <Text>Missing service identifier.</Text>,
      HELP_TEXT.service.content
    );
  }

  const mentionedIds = context.getMentionedUserIds();
  let service = await findServiceByNameOrId(
    context.client,
    context.guildId,
    serviceName,
    mentionedIds
  );
  if (!service) {
    const member = await findNodeByNameOrId(
      context.client,
      context.guildId,
      serviceName
    );
    if (member) service = member;
  }
  if (!service) {
    return {
      type: "error",
      message: (
        <>
          <Text>
            Service not found:{" "}
            <Text color="red">{serviceName || "<empty>"}</Text>
          </Text>
          <Text>Usage:</Text>
          {HELP_TEXT.service.content}
          <Text dimColor>
            (Services are users mentioned in recent messages)
          </Text>
        </>
      ),
    };
  }

  // Send message (always send, even if empty)
  let messagePayload = parsedMessage;
  if (messagePayload === null) {
    messagePayload = "";
  }
  const targetChannelId = await resolveTextChannelId(
    context.client,
    context.guildId,
    channelToken
  );
  if (targetChannelId) {
    const text =
      messagePayload.trim().length > 0
        ? `<@${service.id}> ${messagePayload}`
        : `<@${service.id}>`;
    await sendTextToChannel(context.client, targetChannelId, text);
  }

  return {
    type: "selection",
    selection: { id: service.id, type: "service" },
  };
}

async function handleServiceCommand(
  subArgs: string[],
  context: CommandExecutorContext
): Promise<CommandResult> {
  if (subArgs.length === 0) {
    return errorWithUsage(
      <Text>Incomplete service command.</Text>,
      HELP_TEXT.service.content
    );
  }

  if (subArgs[0] === "list") {
    return {
      type: "list",
      component: <Services interactable={false} />,
    };
  }

  if (subArgs[0] === "show" && subArgs.length >= 2) {
    const serviceName = subArgs.slice(1).join(" ");
    const mentionedIds = context.getMentionedUserIds();
    let service = await findServiceByNameOrId(
      context.client,
      context.guildId,
      serviceName,
      mentionedIds
    );
    if (!service) {
      const member = await findNodeByNameOrId(
        context.client,
        context.guildId,
        serviceName
      );
      if (member) service = member;
    }
    if (!service) {
      return {
        type: "error",
        message: (
          <>
            <Text>
              Service not found:{" "}
              <Text color="red">{serviceName || "<empty>"}</Text>
            </Text>
            <Text>Usage:</Text>
            <Text> ros2 service show {"<service_name_or_id>"}</Text>
            <Text dimColor>
              (Services are users mentioned in recent messages)
            </Text>
          </>
        ),
      };
    }
    return {
      type: "selection",
      selection: { id: service.id, type: "service" },
    };
  }

  if (subArgs[0] === "call" && subArgs.length >= 2) {
    return handleServiceCall(subArgs.slice(1), context);
  }

  return errorWithUsage(
    <Text>Invalid service command.</Text>,
    HELP_TEXT.service.content
  );
}

// Parse service call tokens into structured args
function parseServiceCallArgs(tokens: string[]): {
  serviceToken: string | null;
  messagePayload: string | null;
  channelToken: string | null;
  invalidFlags: string[];
} {
  let serviceToken: string | null = null;
  let messagePayload: string | null = null;
  let channelToken: string | null = null;
  const invalidFlags: string[] = [];

  // Gather leading positional tokens (service name can contain spaces)
  const leadingPositional: string[] = [];
  let idx = 0;
  while (idx < tokens.length && !tokens[idx]!.startsWith("-")) {
    leadingPositional.push(tokens[idx]!);
    idx++;
  }
  if (leadingPositional.length > 0) {
    serviceToken = leadingPositional.join(" ");
  }

  // Parse flags from the remainder
  for (let i = idx; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === "--message" || t === "-m") {
      const parts: string[] = [];
      while (i + 1 < tokens.length && !tokens[i + 1]!.startsWith("-")) {
        parts.push(tokens[i + 1]!);
        i++;
      }
      if (parts.length === 0) {
        invalidFlags.push(t);
      } else {
        messagePayload = parts.join(" ");
      }
    } else if (t === "--channel" || t === "-c") {
      if (i + 1 >= tokens.length || tokens[i + 1]!.startsWith("-")) {
        invalidFlags.push(t);
      } else {
        channelToken = tokens[i + 1] ?? "";
        i++;
      }
    } else if (t === "--service" || t === "-s") {
      if (i + 1 >= tokens.length || tokens[i + 1]!.startsWith("-")) {
        invalidFlags.push(t);
      } else {
        serviceToken = tokens[i + 1] ?? serviceToken ?? "";
        i++;
      }
    } else if (t.startsWith("-")) {
      invalidFlags.push(t);
    } else {
      invalidFlags.push(t);
    }
  }

  return { serviceToken, messagePayload, channelToken, invalidFlags };
}

export async function executeCommand(
  command: string,
  context: CommandExecutorContext
): Promise<CommandResult> {
  const parts = command
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    return {
      type: "error",
      message: (
        <Text>
          No command provided. Type <Text color="cyan">help</Text> to see
          commands.
        </Text>
      ),
    };
  }

  const [cmd, ...args] = parts;

  // Handle help command
  if (
    cmd === "help" ||
    (cmd === "ros2" && args.length > 0 && args[0] === "help")
  ) {
    return {
      type: "help",
      content: getAllHelp(),
    };
  }

  // Handle ROS2 commands
  if (cmd === "ros2" && args.length > 0) {
    const subcommand = args[0];
    const subArgs = args.slice(1);

    switch (subcommand) {
      case "node":
        return handleNodeCommand(subArgs, context);
      case "topic":
        return handleTopicCommand(subArgs, context);
      case "pkg":
        return handlePackageCommand(subArgs, context);
      case "service":
        return handleServiceCommand(subArgs, context);
      default:
        return {
          type: "error",
          message: (
            <>
              <Text>
                Unknown ros2 subcommand: <Text color="red">{subcommand}</Text>
              </Text>
              <Text>
                Run <Text color="cyan">help</Text> to see available commands.
              </Text>
            </>
          ),
        };
    }
  }

  return {
    type: "error",
    message: (
      <>
        <Text>
          Command not found: <Text color="red">{cmd}</Text>
        </Text>
        <Text>
          Run <Text color="cyan">help</Text> to see the list of available
          commands.
        </Text>
      </>
    ),
  };
}
