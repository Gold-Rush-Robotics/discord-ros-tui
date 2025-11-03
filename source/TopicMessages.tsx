import { Message } from "discord.js";
import { Text } from "ink";
import React, { useEffect, useMemo } from "react";
import {
  useDiscord,
  useMessages,
  useSelection,
} from "./DiscordClientProvider.js";
import DiscordMessage from "./DiscordMessage.js";
import LoadingDots from "./LoadingDots.js";
import { calculateMessageLines, useMainContentDimensions } from "./utils.js";

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

  const { height, width } = useMainContentDimensions();

  // Calculate which messages to show, working backwards from newest
  const visibleMessages = useMemo(() => {
    if (!messages || messages.length === 0) {
      return { messages: [], truncated: 0 };
    }

    let linesUsed = 0;
    const visible: Message[] = [];
    let lastDateKey: string | null = null;

    // Work backwards from newest messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (!message) continue;

      const date = message.createdAt;
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      // Check if we need a date divider
      const needsDateDivider = dateKey !== lastDateKey;
      if (needsDateDivider) {
        // Date divider takes 2 lines (blank line + divider line) unless it's the first one
        if (linesUsed > 0) {
          linesUsed += 2;
        } else {
          linesUsed += 1; // First date divider only takes 1 line
        }
      }

      // Calculate message lines (accounting for timestamp + author prefix)
      const messageLines = calculateMessageLines(message, width, 25);
      linesUsed += messageLines;

      // Reserve 1 line for truncation indicator if we're truncating
      const reservedHeight = height - 1;

      // If we exceed available height, stop
      if (linesUsed > reservedHeight) {
        break;
      }

      visible.unshift(message); // Add to front to maintain chronological order
      lastDateKey = dateKey;
    }

    const truncated = messages.length - visible.length;
    const isAtLimit = messages.length === 100; // 100 is the fetch limit
    return { messages: visible, truncated, isAtLimit };
  }, [messages, height, width]);

  // Render with day dividers like Discord client
  const rows: React.ReactNode[] = [];

  // Show truncation indicator at top if we're truncating old messages
  if (visibleMessages.truncated > 0) {
    rows.push(
      <Text key="truncated-top" dimColor>
        ... {visibleMessages.truncated}
        {visibleMessages.isAtLimit ? "+" : ""} older message
        {visibleMessages.truncated !== 1 ? "s" : ""} not shown
      </Text>
    );
  }

  if (visibleMessages.messages.length > 0) {
    let lastDateKey: string | null = null;
    for (const message of visibleMessages.messages) {
      const date = message.createdAt;
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        const dateStr = date.toLocaleDateString();
        if (rows.length > 0) rows.push(<Text key={`blank-${dateKey}`}> </Text>); // new line
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
