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
        const rows: React.ReactNode[] = [];
        if (!serviceCalls) return rows;

        let lastDateKey: string | null = null;
        for (const call of serviceCalls) {
          const date = call.createdAt;
          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          if (dateKey !== lastDateKey) {
            lastDateKey = dateKey;
            const dateStr = date.toLocaleDateString();
            if (rows.length > 0) rows.push(<Text> </Text>); // new line
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
