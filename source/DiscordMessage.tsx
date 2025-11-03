import { Message } from "discord.js";
import { Text } from "ink";
import React from "react";
import { useDiscord } from "./DiscordClientProvider.js";

interface DiscordMessageProps {
  message: Message;
}

/**
 * Component for rendering Discord messages with proper formatting:
 * - User mentions (@user) displayed in a different color
 * - Role mentions (@role) displayed with role name and color if available
 * - Channel mentions (#channel)
 * - Attachments rendered as [<filename>]
 * - Embeds rendered as [embed: <title> <desc>] or [embed]
 * - Components v2 (buttons, select menus) text extracted and displayed
 * - Additional formatting for spoilers, code blocks, etc.
 */
export default function DiscordMessage({ message }: DiscordMessageProps) {
  const { client } = useDiscord();
  const content = message.content || "";
  const parts: React.ReactNode[] = [];

  // Parse the message content and replace mentions
  let lastIndex = 0;
  // Match Discord mentions: <@userid>, <@!userid>, <@&roleid>, <#channelid>
  const mentionRegex = /<(@!?|@&|#)(\d+)>/g;
  let match;

  // Collect all mentions with their positions
  const mentions: Array<{
    index: number;
    length: number;
    type: "user" | "role" | "channel" | "everyone" | "here";
    id: string;
  }> = [];

  // First, find all structured mentions (avoid matching @everyone/@here inside <@...>)
  while ((match = mentionRegex.exec(content)) !== null) {
    const typeChar = match[1];
    const id = match[2];

    if (!typeChar || !id || match.index === undefined) {
      continue;
    }

    let type: "user" | "role" | "channel";

    if (typeChar === "@" || typeChar === "@!") {
      type = "user";
    } else if (typeChar === "@&") {
      type = "role";
    } else {
      type = "channel";
    }

    mentions.push({
      index: match.index,
      length: match[0].length,
      type,
      id,
    });
  }

  // Handle special mentions (@everyone, @here) - only if not inside angle brackets
  const everyoneRegex = /@(everyone|here)(?![^\s<]*>)/g;
  while ((match = everyoneRegex.exec(content)) !== null) {
    // Check if this is inside an angle bracket (already handled as structured mention)
    if (!match[1] || match.index === undefined) {
      continue;
    }

    const beforeMatch = content.slice(0, match.index);
    const lastBracket = beforeMatch.lastIndexOf("<");
    const lastBracketClose = beforeMatch.lastIndexOf(">");

    // If we're inside angle brackets (last < is after last >), skip this match
    if (lastBracket > lastBracketClose) {
      continue;
    }

    mentions.push({
      index: match.index,
      length: match[0].length,
      type: match[1] === "everyone" ? "everyone" : "here",
      id: match[1],
    });
  }

  // Sort mentions by index
  mentions.sort((a, b) => a.index - b.index);

  // Build parts array with text and mentions
  for (const mention of mentions) {
    // Add text before this mention
    if (mention.index > lastIndex) {
      const textBefore = content.slice(lastIndex, mention.index);
      if (textBefore) {
        parts.push(textBefore);
      }
    }

    // Add the mention
    if (mention.type === "everyone" || mention.type === "here") {
      parts.push(
        <Text key={`mention-${mention.index}`} color="red" bold>
          @{mention.id}
        </Text>
      );
    } else if (mention.type === "user") {
      const user = message.mentions.users.get(mention.id);
      if (user) {
        parts.push(
          <Text key={`mention-${mention.index}`} color="cyan">
            @{user.displayName || user.username}
          </Text>
        );
      } else {
        // Fallback to raw mention if user not found
        parts.push(
          <Text key={`mention-${mention.index}`} color="cyan">
            @unknown
          </Text>
        );
      }
    } else if (mention.type === "role") {
      const role = message.mentions.roles.get(mention.id);
      if (role) {
        // Try to use role's actual color if it's not the default black
        // Ink may support hex colors directly - if not, it should fallback gracefully
        const roleColorHex = role.hexColor;
        const useRoleColor =
          roleColorHex &&
          roleColorHex !== "#000000" &&
          roleColorHex !== "#000" &&
          roleColorHex.toLowerCase() !== "#000000";

        // Use hex color if available, otherwise fallback to magenta
        const colorToUse = useRoleColor ? roleColorHex : "magenta";

        parts.push(
          <Text key={`mention-${mention.index}`} color={colorToUse} bold>
            @{role.name}
          </Text>
        );
      } else {
        parts.push(
          <Text key={`mention-${mention.index}`} color="magenta">
            @unknown-role
          </Text>
        );
      }
    } else {
      // Channel mention - need to find the specific channel by ID
      const channel = message.mentions.channels.get(mention.id);
      if (channel && "name" in channel) {
        parts.push(
          <Text key={`mention-${mention.index}`} color="blue">
            #{channel.name}
          </Text>
        );
      } else {
        // Try to fetch from client cache as fallback
        const cachedChannel = client.channels.cache.get(mention.id);
        if (cachedChannel && "name" in cachedChannel) {
          parts.push(
            <Text key={`mention-${mention.index}`} color="blue">
              #{cachedChannel.name}
            </Text>
          );
        } else {
          parts.push(
            <Text key={`mention-${mention.index}`} color="blue">
              #unknown-channel
            </Text>
          );
        }
      }
    }

    lastIndex = mention.index + mention.length;
  }

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }

  // If no mentions were found, use the original content
  if (parts.length === 0 && content) {
    parts.push(content);
  }

  // Process spoilers (||text||) in the parts
  // We'll need to recursively process parts that are strings
  const processSpoilers = (
    partsArray: React.ReactNode[]
  ): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    for (const part of partsArray) {
      if (typeof part === "string") {
        // Process spoilers in string
        const spoilerRegex = /\|\|([^|]+)\|\|/g;
        let lastIdx = 0;
        let match;
        const spoilerMatches: Array<{
          index: number;
          length: number;
          text: string;
        }> = [];

        while ((match = spoilerRegex.exec(part)) !== null) {
          if (!match[1] || match.index === undefined) {
            continue;
          }
          spoilerMatches.push({
            index: match.index,
            length: match[0].length,
            text: match[1],
          });
        }

        if (spoilerMatches.length > 0) {
          for (const spoiler of spoilerMatches) {
            // Add text before spoiler
            if (spoiler.index > lastIdx) {
              result.push(part.slice(lastIdx, spoiler.index));
            }
            // Add spoiler as dimmed text
            result.push(
              <Text key={`spoiler-${spoiler.index}`} dimColor>
                {spoiler.text}
              </Text>
            );
            lastIdx = spoiler.index + spoiler.length;
          }
          // Add remaining text
          if (lastIdx < part.length) {
            result.push(part.slice(lastIdx));
          }
        } else {
          result.push(part);
        }
      } else {
        result.push(part);
      }
    }
    return result;
  };

  const processedParts = processSpoilers(parts);

  // Handle components v2 (buttons, select menus, etc.)
  const componentTexts: string[] = [];
  // Type guard: check if message has components property
  if (
    "components" in message &&
    message.components &&
    Array.isArray(message.components) &&
    message.components.length > 0
  ) {
    for (const actionRow of message.components) {
      if (
        !("components" in actionRow) ||
        !Array.isArray(actionRow.components)
      ) {
        continue;
      }
      for (const component of actionRow.components) {
        if (component.type === 2) {
          // Button
          if ("label" in component && component.label) {
            componentTexts.push(component.label);
          }
        } else if (component.type === 3) {
          // Select menu
          if ("placeholder" in component && component.placeholder) {
            componentTexts.push(`[Select: ${component.placeholder}]`);
          }
          if ("options" in component && component.options) {
            const optionLabels = component.options
              .map((opt: { label?: string }) => opt.label)
              .filter(Boolean);
            if (optionLabels.length > 0) {
              componentTexts.push(`Options: ${optionLabels.join(", ")}`);
            }
          }
        }
      }
    }
  }

  const hasContent = processedParts.length > 0;
  const hasComponents = componentTexts.length > 0;
  const hasEmbeds = message.embeds.length > 0;
  const hasAttachments = message.attachments.size > 0;

  return (
    <>
      {/* Main message content */}
      {hasContent && <Text>{processedParts}</Text>}

      {/* Component texts */}
      {hasComponents && (
        <Text dimColor>
          {hasContent ? " " : ""}[{componentTexts.join(" | ")}]
        </Text>
      )}

      {/* Attachments */}
      {Array.from(message.attachments.values()).map((attachment, index) => {
        const needsSpace =
          hasContent || hasComponents || hasEmbeds || index > 0;

        return (
          <Text key={`attachment-${attachment.id}`} dimColor>
            {needsSpace ? " " : ""}[{attachment.name}]
          </Text>
        );
      })}

      {/* Embeds */}
      {message.embeds.map((embed, index) => {
        const embedParts: string[] = [];
        if (embed.title) embedParts.push(embed.title);
        if (embed.description) embedParts.push(embed.description);

        const embedText =
          embedParts.length > 0
            ? `[embed: ${embedParts.join(" ")}]`
            : "[embed]";

        const needsSpace =
          hasContent || hasComponents || hasAttachments || index > 0;

        return (
          <Text key={`embed-${index}`} dimColor>
            {needsSpace ? " " : ""}
            {embedText}
          </Text>
        );
      })}
    </>
  );
}
