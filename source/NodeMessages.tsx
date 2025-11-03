import { GuildMember, Message, TextChannel } from "discord.js";
import { Box, Text } from "ink";
import React, { useEffect, useMemo, useState } from "react";
import { useDiscord, useMessages } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";

function NodeMessages({ nodeId }: { nodeId: string }) {
  const [nodeMember, setNodeMember] = useState<GuildMember | null>(null);
  const { client, guild } = useDiscord();
  const messagesByChannel = useMessages();

  // Fetch node member info
  useEffect(() => {
    setNodeMember(null);
    async function fetchNodeMember() {
      try {
        const guildObj = await client.guilds.fetch(guild);
        const fetchedMember = await guildObj.members.fetch(nodeId);
        setNodeMember(fetchedMember);
      } catch (error) {
        // Node member might not exist or be inaccessible
        setNodeMember(null);
      }
    }
    fetchNodeMember();
  }, [client, guild, nodeId]);

  // Group messages by topic/channel (published topics)
  const publishedTopics = useMemo(() => {
    if (!(messagesByChannel instanceof Map) || messagesByChannel.size === 0) {
      return null;
    }

    const topicsMap = new Map<string, Message[]>();

    for (const [channelId, messages] of messagesByChannel.entries()) {
      const nodeMessages = messages.filter(
        (message) => message.author.id === nodeId
      );

      if (nodeMessages.length > 0) {
        // Get channel name
        const firstMessage = nodeMessages[0];
        const channelName =
          firstMessage?.channel instanceof TextChannel
            ? firstMessage.channel.name
            : `channel-${channelId}`;

        // Reverse to show newest first
        topicsMap.set(channelName, [...nodeMessages].reverse());
      }
    }

    return topicsMap;
  }, [messagesByChannel, nodeId]);

  return (
    <>
      <Box flexDirection="column" gap={1}>
        <Text bold>
          Node:{" "}
          {nodeMember?.displayName ?? (
            <>
              (loading
              <LoadingDots />)
            </>
          )}
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1} gap={1}>
        <Text bold>Published Topics:</Text>
        {publishedTopics === null && (
          <Text>
            Loading topics
            <LoadingDots />
          </Text>
        )}
        {publishedTopics && publishedTopics.size === 0 && (
          <Text>This node does not publish to any topics.</Text>
        )}
        {publishedTopics &&
          Array.from(publishedTopics.entries()).map(([topicName, messages]) => (
            <Box key={topicName} flexDirection="column" gap={0} marginTop={1}>
              <Text bold>
                /{topicName} ({messages.length} message
                {messages.length !== 1 ? "s" : ""})
              </Text>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  display="flex"
                  flexDirection="column"
                  gap={0}
                  marginLeft={2}
                >
                  <Box display="flex" flexDirection="row" gap={1}>
                    <Text>[{message.createdAt.toLocaleString()}]</Text>
                    {!!message.content && <Text>{message.content}</Text>}
                  </Box>
                  {message.embeds.map((embed) => (
                    <Text key={embed.url}>
                      [embed: {!!embed.url && ` ${embed.url}: `} {embed.title}{" "}
                      {embed.description}]
                    </Text>
                  ))}
                </Box>
              ))}
            </Box>
          ))}
      </Box>
    </>
  );
}

export default NodeMessages;
