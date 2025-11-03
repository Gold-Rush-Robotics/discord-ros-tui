import { Message } from "discord.js";
import { Text } from "ink";
import React, { useEffect } from "react";
import {
  useDiscord,
  useMessages,
  useSelection,
} from "./DiscordClientProvider.js";
import DiscordMessage from "./DiscordMessage.js";
import LoadingDots from "./LoadingDots.js";

function TopicMessages({ channelId }: { channelId: string }) {
  const messages = useMessages(channelId) as Message[];
  const { client } = useDiscord();
  const { setTitle } = useSelection();

  useEffect(() => {
    let isActive = true;
    async function setChannelTitle() {
      setTitle(
        <>
          Topic messages: /<LoadingDots />
        </>
      );
      try {
        const channel = await client.channels.fetch(channelId);
        if (!isActive) return;
        // Only text channels have names we want to show
        // @ts-ignore - name exists on text-like channels
        const name: string | undefined = channel && (channel as any).name;
        if (name) {
          setTitle(<>Topic messages: /{name}</>);
        } else {
          setTitle(<>Topic messages: /{channelId}</>);
        }
      } catch {
        if (!isActive) return;
        setTitle(<>Topic messages: /{channelId}</>);
      }
    }
    setChannelTitle();
    return () => {
      isActive = false;
      setTitle(null);
    };
  }, [channelId, client.channels, setTitle]);

  // Render with day dividers like Discord client
  const rows: React.ReactNode[] = [];
  if (messages) {
    let lastDateKey: string | null = null;
    for (const message of messages) {
      const date = message.createdAt;
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

      rows.push(
        <Text key={message.id}>
          <Text color="gray">[{message.createdAt.toLocaleTimeString()}] </Text>
          <Text color="cyanBright" bold>
            {"<"}
            {message.author.username}
            {">"}{" "}
          </Text>
          <DiscordMessage message={message} />
        </Text>
      );
    }
  }

  if (rows.length === 0) {
    return <Text>No messages in this topic yet.</Text>;
  }

  return <>{rows}</>;
}

export default TopicMessages;
