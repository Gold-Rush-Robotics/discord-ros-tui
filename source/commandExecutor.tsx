import { Client } from "discord.js";
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
      content: (
        <>
          <Text bold>Available commands:</Text>
          <Text> </Text>
          <Text bold>Node commands:</Text>
          <Text> ros2 node list</Text>
          <Text> ros2 node info {"<node_name_or_id>"}</Text>
          <Text> </Text>
          <Text bold>Topic commands:</Text>
          <Text> ros2 topic list</Text>
          <Text> ros2 topic echo {"<topic_name_or_id>"}</Text>
          <Text> </Text>
          <Text bold>Package commands:</Text>
          <Text> ros2 pkg list</Text>
          <Text> ros2 pkg contents {"<package_name_or_id>"}</Text>
          <Text> </Text>
          <Text bold>Service commands:</Text>
          <Text> ros2 service list</Text>
          <Text> ros2 service call {"<service_name_or_id>"}</Text>
          <Text> </Text>
          <Text>You can use IDs or names (partial matches work).</Text>
        </>
      ),
    };
  }

  // Handle ROS2 commands
  if (cmd === "ros2" && args.length > 0) {
    const subcommand = args[0];
    const subArgs = args.slice(1);

    // Node commands
    if (subcommand === "node") {
      if (subArgs.length === 0 || subArgs[0] === "list") {
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
          return {
            type: "error",
            message: (
              <>
                <Text>
                  Node not found: <Text color="red">{nodeName}</Text>
                </Text>
                <Text>Usage: ros2 node info {"<node_name_or_id>"}</Text>
              </>
            ),
          };
        }
        return {
          type: "selection",
          selection: { id: node.id, type: "node" },
        };
      }
      return {
        type: "error",
        message: (
          <>
            <Text>Invalid node command. Usage:</Text>
            <Text> ros2 node list</Text>
            <Text> ros2 node info {"<node_name_or_id>"}</Text>
          </>
        ),
      };
    }

    // Topic commands
    if (subcommand === "topic") {
      if (subArgs.length === 0 || subArgs[0] === "list") {
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
          return {
            type: "error",
            message: (
              <>
                <Text>
                  Topic not found: <Text color="red">{topicName}</Text>
                </Text>
                <Text>Usage: ros2 topic echo {"<topic_name_or_id>"}</Text>
              </>
            ),
          };
        }
        return {
          type: "selection",
          selection: { id: channel.id, type: "topic" },
        };
      }
      return {
        type: "error",
        message: (
          <>
            <Text>Invalid topic command. Usage:</Text>
            <Text> ros2 topic list</Text>
            <Text> ros2 topic echo {"<topic_name_or_id>"}</Text>
          </>
        ),
      };
    }

    // Package commands
    if (subcommand === "pkg") {
      if (subArgs.length === 0 || subArgs[0] === "list") {
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
          return {
            type: "error",
            message: (
              <>
                <Text>
                  Package not found: <Text color="red">{pkgName}</Text>
                </Text>
                <Text>Usage: ros2 pkg contents {"<package_name_or_id>"}</Text>
              </>
            ),
          };
        }
        return {
          type: "selection",
          selection: { id: role.id, type: "package" },
        };
      }
      return {
        type: "error",
        message: (
          <>
            <Text>Invalid package command. Usage:</Text>
            <Text> ros2 pkg list</Text>
            <Text> ros2 pkg contents {"<package_name_or_id>"}</Text>
          </>
        ),
      };
    }

    // Service commands
    if (subcommand === "service") {
      if (subArgs.length === 0 || subArgs[0] === "list") {
        return {
          type: "list",
          component: <Services interactable={false} />,
        };
      }
      if (subArgs[0] === "call" && subArgs.length >= 2) {
        const serviceName = subArgs.slice(1).join(" ");
        const mentionedIds = context.getMentionedUserIds();
        const service = await findServiceByNameOrId(
          context.client,
          context.guildId,
          serviceName,
          mentionedIds
        );
        if (!service) {
          return {
            type: "error",
            message: (
              <>
                <Text>
                  Service not found: <Text color="red">{serviceName}</Text>
                </Text>
                <Text>Usage: ros2 service call {"<service_name_or_id>"}</Text>
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
      return {
        type: "error",
        message: (
          <>
            <Text>Invalid service command. Usage:</Text>
            <Text> ros2 service list</Text>
            <Text> ros2 service call {"<service_name_or_id>"}</Text>
          </>
        ),
      };
    }

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
