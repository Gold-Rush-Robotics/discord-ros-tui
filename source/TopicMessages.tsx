import { Message } from "discord.js";
import { Box, Text } from "ink";
import React from "react";
import { useMessages } from "./DiscordClientProvider.js";
import DiscordMessage from "./DiscordMessage.js";
import LoadingDots from "./LoadingDots.js";

function TopicMessages({ channelId }: { channelId: string }) {
  const messages = useMessages(channelId) as Message[];

  // Reverse messages to show newest first (as before)
  const displayMessages =
    Array.isArray(messages) && messages.length > 0
      ? [...messages].reverse()
      : null;

  if (!displayMessages) {
    return (
      <>
        <Text>
          Loading messages
          <LoadingDots />
        </Text>
      </>
    );
  }

  return (
    <>
      {displayMessages.map((message) => (
        <Box key={message.id} display="flex" flexDirection="row" gap={1}>
          <Text>[{message.createdAt.toLocaleString()}]</Text>
          <Text>
            {"<"}
            {message.author.username}
            {">"}
          </Text>
          <DiscordMessage message={message} />
        </Box>
      ))}
    </>
  );
}

export default TopicMessages;
