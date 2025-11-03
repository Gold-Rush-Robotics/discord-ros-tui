import { GuildMember, TextChannel } from "discord.js";
import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useMessages } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";

function NodeInfo({ nodeId }: { nodeId: string }) {
  const [nodeMember, setNodeMember] = useState<GuildMember | null>(null);
  const [serviceClientMembers, setServiceClientMembers] = useState<
    Map<string, GuildMember>
  >(new Map());
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

  // Extract information similar to ros2 node info
  let nodeInfo: {
    publishedTopics: Set<string>;
    subscribedTopics: Set<string>;
    serviceServers: Set<string>;
    serviceClients: Set<string>;
  } | null = null;

  if (messagesByChannel instanceof Map && messagesByChannel.size > 0) {
    const publishedTopics = new Set<string>();
    const subscribedTopics = new Set<string>();
    const serviceServers = new Set<string>();
    const serviceClients = new Set<string>();

    for (const [channelId, messages] of messagesByChannel.entries()) {
      if (messages.length === 0) continue;

      const firstMessage = messages[0];
      const channelName =
        firstMessage?.channel instanceof TextChannel
          ? firstMessage.channel.name
          : `channel-${channelId}`;

      // Check if node publishes to this topic
      const hasNodePublished = messages.some(
        (message) => message.author.id === nodeId
      );
      if (hasNodePublished) {
        publishedTopics.add(channelName);
      }

      // Check if node subscribes to this topic (receives messages from others)
      const hasOtherPublished = messages.some(
        (message) => message.author.id !== nodeId
      );
      if (hasOtherPublished) {
        subscribedTopics.add(channelName);
      }

      // Check for service servers (node is mentioned in messages)
      for (const message of messages) {
        if (
          message.mentions.users.has(nodeId) &&
          message.author.id !== nodeId
        ) {
          const serviceName =
            message.channel instanceof TextChannel
              ? message.channel.name
              : `channel-${channelId}`;
          serviceServers.add(serviceName);
        }
      }

      // Check for service clients (node mentions others)
      for (const message of messages) {
        if (message.author.id === nodeId && message.mentions.users.size > 0) {
          for (const mentionedUser of message.mentions.users.values()) {
            serviceClients.add(mentionedUser.id);
          }
        }
      }
    }

    nodeInfo = {
      publishedTopics,
      subscribedTopics,
      serviceServers,
      serviceClients,
    };
  }

  // Fetch service client member info for users mentioned by this node
  useEffect(() => {
    if (!(messagesByChannel instanceof Map) || messagesByChannel.size === 0) {
      setServiceClientMembers(new Map());
      return;
    }

    // Extract service client IDs (users mentioned by this node)
    const serviceClientIds = new Set<string>();
    for (const messages of messagesByChannel.values()) {
      for (const message of messages) {
        if (message.author.id === nodeId) {
          for (const user of message.mentions.users.values()) {
            serviceClientIds.add(user.id);
          }
        }
      }
    }

    if (serviceClientIds.size === 0) {
      setServiceClientMembers(new Map());
      return;
    }

    async function fetchServiceClients() {
      try {
        const guildObj = await client.guilds.fetch(guild);
        const members = await Promise.all(
          Array.from(serviceClientIds).map(async (userId) => {
            try {
              const member = await guildObj.members.fetch(userId);
              return [userId, member] as [string, GuildMember];
            } catch {
              return null;
            }
          })
        );
        setServiceClientMembers(
          new Map(
            members.filter(
              (item): item is [string, GuildMember] => item !== null
            )
          )
        );
      } catch (error) {
        setServiceClientMembers(new Map());
      }
    }
    fetchServiceClients();
  }, [client, guild, messagesByChannel, nodeId]);

  // Fetch service server names (channels where node is mentioned)
  const serviceServerNames = nodeInfo
    ? Array.from(nodeInfo.serviceServers).sort()
    : [];

  return (
    <>
      <Box flexDirection="column" gap={1}>
        <Text bold>
          Node: /
          {nodeMember?.displayName ?? (
            <>
              (loading
              <LoadingDots />)
            </>
          )}
        </Text>
      </Box>

      {nodeInfo === null && (
        <Box flexDirection="column" marginTop={1}>
          <Text>
            Loading node information
            <LoadingDots />
          </Text>
        </Box>
      )}

      {!!nodeInfo && (
        <Box flexDirection="column" marginTop={1} gap={1}>
          {/* Subscribers */}
          <Box flexDirection="column">
            <Text bold>Subscribers:</Text>
            {nodeInfo.subscribedTopics.size === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              Array.from(nodeInfo.subscribedTopics)
                .sort()
                .map((topicName) => <Text key={topicName}>/{topicName}</Text>)
            )}
          </Box>

          {/* Publishers */}
          <Box flexDirection="column">
            <Text bold>Publishers:</Text>
            {nodeInfo.publishedTopics.size === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              Array.from(nodeInfo.publishedTopics)
                .sort()
                .map((topicName) => <Text key={topicName}>/{topicName}</Text>)
            )}
          </Box>

          {/* Service Servers */}
          <Box flexDirection="column">
            <Text bold>Service Servers:</Text>
            {serviceServerNames.length === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              serviceServerNames.map((serviceName) => (
                <Text key={serviceName}>/{serviceName}</Text>
              ))
            )}
          </Box>

          {/* Service Clients */}
          <Box flexDirection="column">
            <Text bold>Service Clients:</Text>
            {serviceClientMembers.size === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              Array.from(serviceClientMembers.values())
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                .map((member) => (
                  <Text key={member.id}>/{member.displayName}</Text>
                ))
            )}
          </Box>
        </Box>
      )}
    </>
  );
}

export default NodeInfo;
