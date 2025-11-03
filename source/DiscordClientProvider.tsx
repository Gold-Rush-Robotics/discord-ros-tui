import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
} from "discord.js";
import { Text, useApp } from "ink";
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import LoadingDots from "./LoadingDots.js";
import { exitError } from "./utils.js";

const DiscordClientContext = React.createContext<Client | null>(null);
const GuildContext = React.createContext<string | null>(null);
const SelectionContext = React.createContext<SelectionContext | null>(null);
const MessagesContext = React.createContext<Map<string, Message[]> | null>(
  null
);

interface SelectionContext {
  selection: Selection | undefined;
  setSelection: Dispatch<SetStateAction<Selection | undefined>>;
  title: React.ReactNode | null;
  setTitle: Dispatch<SetStateAction<React.ReactNode | null>>;
}

/**
 * Topic: Channel,
 * Node: User,
 * Package: Role,
 * Service: Mention
 */
export interface Selection {
  id: string;
  type: "topic" | "node" | "package" | "service";
}

function DiscordClientProvider({
  token,
  guild,
  children,
}: {
  token: string;
  guild: string;
  children: React.ReactNode;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [selection, setSelection] = useState<Selection | undefined>(undefined);
  const [title, setTitle] = useState<React.ReactNode | null>(null);
  const [messagesByChannel, setMessagesByChannel] = useState<
    Map<string, Message[]>
  >(new Map());
  const { exit } = useApp();

  useEffect(() => {
    if (!token) {
      throw new Error("No token provided");
    }
    const newClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    initializeDiscordClient(newClient, token, guild, exit, setClient);

    // Cleanup function if needed in future
    return () => {
      newClient.destroy();
    };
  }, [token, guild, exit]);

  // Fetch messages from all channels and set up event listeners
  useEffect(() => {
    if (!client) return;

    let messageHandler: ((message: Message) => void) | null = null;

    async function fetchAllMessages() {
      if (!client) return;
      try {
        const guildObj = await client.guilds.fetch(guild);
        const channels = await guildObj.channels.fetch();
        const textChannels = Array.from(channels.values()).filter(
          (channel) =>
            channel !== null &&
            channel.type === ChannelType.GuildText &&
            channel instanceof TextChannel
        ) as TextChannel[];

        const fetchPromises = textChannels.map(async (channel) => {
          try {
            const messages = await channel.messages.fetch({ limit: 100 });
            return {
              channelId: channel.id,
              messages: Array.from(messages.values()),
            };
          } catch {
            return { channelId: channel.id, messages: [] };
          }
        });

        const results = await Promise.all(fetchPromises);
        const messagesMap = new Map<string, Message[]>();

        for (const { channelId, messages } of results) {
          // Sort messages by creation time (oldest first)
          messages.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
          messagesMap.set(channelId, messages);
        }

        setMessagesByChannel(messagesMap);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }

    // Set up event listener for new messages
    messageHandler = (message: Message) => {
      if (message.channel && message.channel instanceof TextChannel) {
        setMessagesByChannel((prev) => {
          const newMap = new Map(prev);
          const channelId = message.channelId;
          const existingMessages = newMap.get(channelId) || [];

          // Check if message already exists to avoid duplicates
          if (!existingMessages.some((m) => m.id === message.id)) {
            const updatedMessages = [...existingMessages, message];
            // Keep sorted by creation time
            updatedMessages.sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
            );
            newMap.set(channelId, updatedMessages);
          }

          return newMap;
        });
      }
    };

    client.on("messageCreate", messageHandler);
    fetchAllMessages();

    // Cleanup: remove listener when component unmounts
    return () => {
      if (messageHandler) {
        client.off("messageCreate", messageHandler);
      }
    };
  }, [client, guild]);

  if (!client) {
    return (
      <Text>
        Logging in to Discord
        <LoadingDots />
      </Text>
    );
  }

  return (
    <DiscordClientContext.Provider value={client}>
      <GuildContext.Provider value={guild}>
        <MessagesContext.Provider value={messagesByChannel}>
          <SelectionContext.Provider
            value={{ selection, setSelection, title, setTitle }}
          >
            {children}
          </SelectionContext.Provider>
        </MessagesContext.Provider>
      </GuildContext.Provider>
    </DiscordClientContext.Provider>
  );
}

export function useDiscord() {
  const client = useContext(DiscordClientContext);
  const guild = useContext(GuildContext);
  if (client === null || guild === null) {
    throw new Error("useDiscord must be used within a DiscordClientProvider");
  }
  return { client, guild };
}

/**
 * Hook to keep track of the current selected item and what type it is.
 * If nothing is selected, the selection will be undefined.
 * Throws an error if used outside of a DiscordClientProvider.
 *
 * @returns The current selected item and what type it is, and a function to set the selection.
 */
export function useSelection() {
  const selection = useContext(SelectionContext);
  if (selection === null) {
    throw new Error("useSelection must be used within a DiscordClientProvider");
  }
  return selection;
}

/**
 * Hook to access messages fetched by the DiscordClientProvider.
 * Messages are automatically fetched from all text channels and updated in real-time.
 * Throws an error if used outside of a DiscordClientProvider.
 *
 * @param channelId Optional channel ID to filter messages by a specific channel.
 *                  If not provided, returns all messages from all channels.
 * @returns A map of channel IDs to messages, or messages for a specific channel.
 */
export function useMessages(
  channelId?: string
): Map<string, Message[]> | Message[] {
  const messagesByChannel = useContext(MessagesContext);
  if (messagesByChannel === null) {
    throw new Error("useMessages must be used within a DiscordClientProvider");
  }

  if (channelId) {
    return messagesByChannel.get(channelId) || [];
  }

  return messagesByChannel;
}

async function initializeDiscordClient(
  client: Client,
  token: string,
  guild: string,
  exit: () => void,
  setClient: (client: Client) => void
) {
  try {
    await client.login(token);
  } catch (err) {
    exitError(
      exit,
      new Error("Failed to login Discord client: " + (err as Error).message)
    );
    return;
  }

  try {
    await client.guilds.fetch(guild);
    setClient(client);
  } catch (err) {
    exitError(
      exit,
      new Error(
        `Failed to access guild with ID "${guild}": ${
          (err as Error).message
        }.\nMake sure the guild ID is correct and the user/bot is in the guild.`
      )
    );
  }
}

export default DiscordClientProvider;
