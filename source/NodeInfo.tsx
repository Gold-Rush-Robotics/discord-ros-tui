import { GuildMember, TextChannel } from "discord.js";
import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import {
  useDiscord,
  useMessages,
  useSelection,
} from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";
import { useMainContentDimensions } from "./utils.js";

function NodeInfo({ nodeId }: { nodeId: string }) {
  const [nodeMember, setNodeMember] = useState<GuildMember | null>(null);
  const [serviceClientMembers, setServiceClientMembers] = useState<
    Map<string, GuildMember>
  >(new Map());
  const { client, guild } = useDiscord();
  const messagesByChannel = useMessages();
  const { setTitle } = useSelection();

  useEffect(() => {
    if (nodeMember?.displayName) {
      setTitle(<>Node info: /{nodeMember.displayName}</>);
    } else {
      setTitle(
        <>
          Node info: /<LoadingDots />
        </>
      );
    }
    return () => {
      setTitle(null);
    };
  }, [nodeId, nodeMember?.displayName, setTitle]);

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

  const { height } = useMainContentDimensions();

  // Available height: terminal height - 11
  // -7 for other UI elements
  // -4 for the 4 section headers
  const availableLines = Math.max(4, height - 11); // Minimum 4 lines (1 per section)

  const subscribers = nodeInfo
    ? Array.from(nodeInfo.subscribedTopics).sort()
    : [];
  const publishers = nodeInfo
    ? Array.from(nodeInfo.publishedTopics).sort()
    : [];
  const serviceClients = Array.from(serviceClientMembers.values()).sort(
    (a, b) => a.displayName.localeCompare(b.displayName)
  );

  // Calculate how many items to show from each section
  // Smart truncation: prioritize longer sections, ensure at least 1 per section
  type SectionData<T> = {
    name: string;
    items: T[];
    visible: T[];
    remaining: number;
  };

  const sections: [
    SectionData<string>,
    SectionData<string>,
    SectionData<string>,
    SectionData<GuildMember>
  ] = [
    { name: "subscribers", items: subscribers, visible: [], remaining: 0 },
    { name: "publishers", items: publishers, visible: [], remaining: 0 },
    {
      name: "serviceServers",
      items: serviceServerNames,
      visible: [],
      remaining: 0,
    },
    {
      name: "serviceClients",
      items: serviceClients,
      visible: [],
      remaining: 0,
    },
  ];

  // Simple truncation algorithm:
  // 1. Count total items across all sections
  // 2. If total > available height, remove from longest sections first
  // 3. First truncation removes 2 items (to account for truncation indicator line)
  // 4. Subsequent truncations remove 1 item at a time

  // Initialize: show all items, no truncation
  sections.forEach((s) => {
    s.visible = s.items;
    s.remaining = 0;
  });

  // Calculate current lines used (items + truncation indicators)
  const calculateLinesUsed = () => {
    return sections.reduce((sum, s) => {
      const items = s.visible.length;
      const truncationIndicator = s.remaining > 0 ? 1 : 0;
      return sum + items + truncationIndicator;
    }, 0);
  };

  let linesUsed = calculateLinesUsed();

  // If we exceed available lines, truncate from longest sections first
  while (linesUsed > availableLines) {
    // Find the section with the most visible items (longest section)
    let longestIdx = -1;
    let longestCount = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section) continue;

      // Only consider sections with more than 1 item visible
      if (section.visible.length > 1) {
        if (section.visible.length > longestCount) {
          longestCount = section.visible.length;
          longestIdx = i;
        }
      }
    }

    // If no section can be truncated further, break
    if (longestIdx === -1) break;

    const section = sections[longestIdx];
    if (!section) break;

    const currentVisible = section.visible.length;

    // First truncation of this section: remove 2 items (to account for truncation indicator)
    // Subsequent truncations: remove 1 item at a time
    if (section.remaining === 0) {
      // First truncation: remove 2 items
      if (currentVisible >= 2) {
        section.visible = section.items.slice(0, currentVisible - 2);
        section.remaining = section.items.length - section.visible.length;
      } else {
        // Can't remove 2, but we're over limit, so remove 1 anyway
        section.visible = section.items.slice(0, currentVisible - 1);
        section.remaining = section.items.length - section.visible.length;
      }
    } else {
      // Already truncated, remove 1 more item
      section.visible = section.items.slice(0, currentVisible - 1);
      section.remaining = section.items.length - section.visible.length;
    }

    // Recalculate lines used
    linesUsed = calculateLinesUsed();
  }

  const subscribersTruncated = {
    visible: sections[0]?.visible ?? [],
    remaining: sections[0]?.remaining ?? 0,
  };
  const publishersTruncated = {
    visible: sections[1]?.visible ?? [],
    remaining: sections[1]?.remaining ?? 0,
  };
  const serviceServersTruncated = {
    visible: sections[2]?.visible ?? [],
    remaining: sections[2]?.remaining ?? 0,
  };
  const serviceClientsTruncated = {
    visible: sections[3]?.visible ?? [],
    remaining: sections[3]?.remaining ?? 0,
  };

  return (
    <>
      {nodeInfo === null && (
        <Box flexDirection="column">
          <Text>
            Loading node information
            <LoadingDots />
          </Text>
        </Box>
      )}

      {!!nodeInfo && (
        <Box flexDirection="column" gap={1}>
          {/* Subscribers */}
          <Box flexDirection="column">
            <Text bold>Subscribers:</Text>
            {nodeInfo.subscribedTopics.size === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              <>
                {subscribersTruncated.visible.map((topicName) => (
                  <Text key={topicName}>/{topicName}</Text>
                ))}
                {subscribersTruncated.remaining > 0 && (
                  <Text dimColor>
                    ... {subscribersTruncated.remaining} more
                  </Text>
                )}
              </>
            )}
          </Box>

          {/* Publishers */}
          <Box flexDirection="column">
            <Text bold>Publishers:</Text>
            {nodeInfo.publishedTopics.size === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              <>
                {publishersTruncated.visible.map((topicName) => (
                  <Text key={topicName}>/{topicName}</Text>
                ))}
                {publishersTruncated.remaining > 0 && (
                  <Text dimColor>... {publishersTruncated.remaining} more</Text>
                )}
              </>
            )}
          </Box>

          {/* Service Servers */}
          <Box flexDirection="column">
            <Text bold>Service Servers:</Text>
            {serviceServerNames.length === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              <>
                {serviceServersTruncated.visible.map((serviceName) => (
                  <Text key={serviceName}>/{serviceName}</Text>
                ))}
                {serviceServersTruncated.remaining > 0 && (
                  <Text dimColor>
                    ... {serviceServersTruncated.remaining} more
                  </Text>
                )}
              </>
            )}
          </Box>

          {/* Service Clients */}
          <Box flexDirection="column">
            <Text bold>Service Clients:</Text>
            {serviceClientMembers.size === 0 ? (
              <Text dimColor>(none)</Text>
            ) : (
              <>
                {serviceClientsTruncated.visible.map((member) => (
                  <Text key={member.id}>/{member.displayName}</Text>
                ))}
                {serviceClientsTruncated.remaining > 0 && (
                  <Text dimColor>
                    ... {serviceClientsTruncated.remaining} more
                  </Text>
                )}
              </>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}

export default NodeInfo;
