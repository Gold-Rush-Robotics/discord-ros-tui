import { GuildMember, Message } from "discord.js";
import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useMessages } from "./DiscordClientProvider.js";
import DiscordMessage from "./DiscordMessage.js";
import LoadingDots from "./LoadingDots.js";

function ServiceCalls({ service }: { service: string }) {
  const [serviceMember, setServiceMember] = useState<GuildMember | null>(null);
  const { client, guild } = useDiscord();
  const messagesByChannel = useMessages();

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

  // Filter messages for service calls from the cached messages
  // useMessages() without channelId returns Map<string, Message[]>
  let serviceCalls: Message[] | null = null;
  if (messagesByChannel instanceof Map && messagesByChannel.size > 0) {
    const allMessages: Message[] = [];
    for (const messages of messagesByChannel.values()) {
      allMessages.push(...messages);
    }

    serviceCalls = allMessages.filter(
      (message) =>
        message.mentions &&
        (message.mentions.users.has(service) || message.author.id === service)
    );
    // Messages are already sorted by time in the provider
    // but since we're merging across channels, sort ascending here
    serviceCalls.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  return (
    <>
      <Text bold>
        Service Calls for service{" "}
        {serviceMember?.displayName ?? (
          <>
            (loading
            <LoadingDots />)
          </>
        )}
      </Text>
      {serviceCalls === null && (
        <Text>
          Loading service calls
          <LoadingDots />
        </Text>
      )}
      {serviceCalls?.length === 0 && (
        <Text>No recent calls to/from this service.</Text>
      )}
      {(() => {
        const rows: React.ReactNode[] = [];
        if (!serviceCalls) return rows;

        let lastDateKey: string | null = null;
        for (const call of serviceCalls) {
          const date = call.createdAt;
          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          if (dateKey !== lastDateKey) {
            lastDateKey = dateKey;
            const dateStr = date.toLocaleDateString();
            rows.push(
              <Text key={`date-${dateKey}`} dimColor>
                ——————————————————— {dateStr} ———————————————————
              </Text>
            );
          }

          const sender = call.author;
          const receiver =
            call.author.id === service
              ? serviceMember
              : call.mentions.users.at(0);
          rows.push(
            <Box key={call.id} display="flex" flexDirection="row" gap={1}>
              <Text>[{call.createdAt.toLocaleTimeString()}]</Text>
              <Text bold>{sender.displayName}</Text>
              <Text>{"->"}</Text>
              <Text bold>{receiver?.displayName}:</Text>
              <DiscordMessage message={call} />
            </Box>
          );
        }
        return rows;
      })()}
    </>
  );
}

export default ServiceCalls;
