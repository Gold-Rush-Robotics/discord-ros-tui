import { GuildMember, Message } from "discord.js";
import { Text } from "ink";
import React, { useEffect, useState } from "react";
import {
  useDiscord,
  useMessages,
  useSelection,
} from "./DiscordClientProvider.js";
import DiscordMessage from "./DiscordMessage.js";
import LoadingDots from "./LoadingDots.js";
import { calculateMessageLines, useMainContentDimensions } from "./utils.js";

function ServiceCalls({ service }: { service: string }) {
  const [serviceMember, setServiceMember] = useState<GuildMember | null>(null);
  const { client, guild } = useDiscord();
  const messagesByChannel = useMessages();
  const { setTitle } = useSelection();

  // Fetch service member info
  useEffect(() => {
    setServiceMember(null);
    async function fetchServiceMember() {
      try {
        const guildObj = await client.guilds.fetch(guild);
        const fetchedService = await guildObj.members.fetch(service);
        setServiceMember(fetchedService);
      } catch (error) {
        // Service member might not exist or be inaccessible
        setServiceMember(null);
      }
    }
    fetchServiceMember();
  }, [client, guild, service]);

  useEffect(() => {
    if (serviceMember?.displayName) {
      setTitle(<>Service calls: /{serviceMember.displayName}</>);
    } else {
      setTitle(
        <>
          Service calls: /<LoadingDots />
        </>
      );
    }
    return () => setTitle(null);
  }, [serviceMember?.displayName, setTitle]);

  // Filter messages for service calls from the cached messages
  // useMessages() without channelId returns Map<string, Message[]>
  let serviceCalls: Message[] | null = null;
  if (messagesByChannel instanceof Map && messagesByChannel.size > 0) {
    const allMessages: Message[] = [];
    for (const messages of messagesByChannel.values()) {
      allMessages.push(...messages);
    }

    serviceCalls = allMessages.filter((message) => {
      if (!message.mentions) return false;

      // Check if message mentions the service or is from the service
      const mentionsService = message.mentions.users.has(service);
      const isFromService = message.author.id === service;

      if (!mentionsService && !isFromService) return false;

      // Filter out author from mentions to get valid receivers
      const validReceivers = Array.from(message.mentions.users.values()).filter(
        (user) => user.id !== message.author.id
      );

      // Skip if no valid receivers (author only mentioned themselves)
      return validReceivers.length > 0;
    });
    // Messages are already sorted by time in the provider
    // but since we're merging across channels, sort ascending here
    serviceCalls.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  return (
    <>
      {serviceCalls === null && (
        <Text>
          Loading
          <LoadingDots />
        </Text>
      )}
      {serviceCalls?.length === 0 && (
        <Text>No recent calls to/from this service.</Text>
      )}
      {(() => {
        const { height, width } = useMainContentDimensions();

        // Calculate which service calls to show, working backwards from newest
        let linesUsed = 0;
        const visible: Message[] = [];
        let lastDateKeyCalc: string | null = null;

        if (serviceCalls && serviceCalls.length > 0) {
          // Work backwards from newest calls
          for (let i = serviceCalls.length - 1; i >= 0; i--) {
            const call = serviceCalls[i];
            if (!call) continue;

            const date = call.createdAt;
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

            // Check if we need a date divider
            const needsDateDivider = dateKey !== lastDateKeyCalc;
            if (needsDateDivider) {
              // Date divider takes 2 lines (blank line + divider line) unless it's the first one
              if (linesUsed > 0) {
                linesUsed += 2;
              } else {
                linesUsed += 1; // First date divider only takes 1 line
              }
            }

            // Calculate message lines (accounting for timestamp + sender -> receiver prefix)
            // Service call format: "[HH:MM:SS] sender -> receiver: "
            const timestampWidth = 10; // "[HH:MM:SS] "
            const senderName = call.author.displayName;
            const receiverName =
              call.mentions?.users.filter((u) => u.id !== call.author.id).at(0)
                ?.displayName ?? "";
            const totalPrefix =
              timestampWidth + senderName.length + 4 + receiverName.length + 2; // "[HH:MM:SS] sender -> receiver: "
            const messageLines = calculateMessageLines(
              call,
              width,
              totalPrefix
            );
            linesUsed += messageLines;

            // Reserve 1 line for truncation indicator if we're truncating
            const reservedHeight = height - 1;

            // If we exceed available height, stop
            if (linesUsed > reservedHeight) {
              break;
            }

            visible.unshift(call); // Add to front to maintain chronological order
            lastDateKeyCalc = dateKey;
          }
        }

        const truncated = serviceCalls
          ? serviceCalls.length - visible.length
          : 0;

        // Check if we're at the fetch limit (100 per channel)
        // We can't know for sure if there are more, but if we have messages from multiple channels
        // and any channel might have more, we should show +. For simplicity, check if total messages
        // from all channels is large (could indicate we hit limits)
        // Actually, we can't easily tell here. Let's check if any channel has 100 messages
        let isAtLimit = false;
        if (messagesByChannel instanceof Map) {
          for (const channelMessages of messagesByChannel.values()) {
            if (channelMessages.length === 100) {
              isAtLimit = true;
              break;
            }
          }
        }

        const rows: React.ReactNode[] = [];

        // Show truncation indicator at top if we're truncating old messages
        if (truncated > 0) {
          rows.push(
            <Text key="truncated-top" dimColor>
              ... {truncated}
              {isAtLimit ? "+" : ""} older call{truncated !== 1 ? "s" : ""} not
              shown
            </Text>
          );
        }

        if (visible.length === 0) {
          return rows;
        }

        let lastDateKeyRender: string | null = null;
        for (const call of visible) {
          const date = call.createdAt;
          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          if (dateKey !== lastDateKeyRender) {
            lastDateKeyRender = dateKey;
            const dateStr = date.toLocaleDateString();
            if (rows.length > 0)
              rows.push(<Text key={`blank-${dateKey}`}> </Text>); // new line
            rows.push(
              <Text key={`date-${dateKey}`} dimColor>
                ——————————————————— {dateStr} ———————————————————
              </Text>
            );
          }

          const sender = call.author;
          // Get receiver: filter out author from mentions, then take first
          const receiver = call.mentions?.users
            .filter((user) => user.id !== call.author.id)
            .at(0);
          rows.push(
            <Text key={call.id}>
              <Text color="gray">[{call.createdAt.toLocaleTimeString()}] </Text>
              <Text bold>{sender.displayName}</Text> {"->"}{" "}
              <Text bold>{receiver?.displayName}</Text>
              {": "}
              <DiscordMessage message={call} />
            </Text>
          );
        }

        return rows;
      })()}
    </>
  );
}

export default ServiceCalls;
