import { Message, TextChannel } from "discord.js";
import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";

function TopicMessages({ channelId }: { channelId: string }) {
  const { client, guild } = useDiscord();
  const [messages, setMessages] = useState<Message[] | null>(null);

  // Fetch latest messages from the channel and listen for new messages
  useEffect(() => {
    // Defined here so that we can clean it up when it doesn't need to be listening anymore
    let messageHandler: ((message: Message) => void) | null = null;

    async function fetchMessages() {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        return;
      }
      const messages = await channel.messages.fetch({ limit: 20 });
      setMessages(Array.from(messages.values()).reverse());

      // Set up listener for new messages
      messageHandler = (message: Message) => {
        if (message.channelId === channelId) {
          setMessages((prev) => (prev ? [...prev, message] : [message]));
        }
      };

      client.on("messageCreate", messageHandler);
    }
    fetchMessages();

    // Cleanup: remove listener when component unmounts or channel changes
    return () => {
      if (messageHandler) {
        client.off("messageCreate", messageHandler);
      }
    };
  }, [channelId, client, guild]);

  if (!messages) {
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
      {messages.map((message) => (
        <Box key={message.id} display="flex" flexDirection="row" gap={1}>
          <Text>[{message.createdAt.toLocaleString()}]</Text>
          <Text>
            {"<"}/{message.author.username}
            {">"}
          </Text>
          {!!message.content && <Text>{message.content}</Text>}
          {message.embeds.map((embed) => (
            <Text key={embed.url}>
              [embed: {!!embed.url && ` ${embed.url}: `} {embed.title}{" "}
              {embed.description}]
            </Text>
          ))}
        </Box>
      ))}
    </>
  );
}

export default TopicMessages;
