import { Message } from "discord.js";
import { Box, Text } from "ink";
import React from "react";
import { useMessages } from "./DiscordClientProvider.js";
import DiscordMessage from "./DiscordMessage.js";

function TopicMessages({ channelId }: { channelId: string }) {
  const messages = useMessages(channelId) as Message[];

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
        rows.push(
          <Text key={`date-${dateKey}`} dimColor>
            ——————————————————— {dateStr} ———————————————————
          </Text>
        );
      }

      rows.push(
        <Box key={message.id} display="flex" flexDirection="row" gap={1}>
          <Text>[{message.createdAt.toLocaleTimeString()}]</Text>
          <Text>
            {"<"}
            {message.author.username}
            {">"}
          </Text>
          <DiscordMessage message={message} />
        </Box>
      );
    }
  }

  if (rows.length === 0) {
    return <Text>No messages in this topic yet.</Text>;
  }

  return <>{rows}</>;
}

export default TopicMessages;
