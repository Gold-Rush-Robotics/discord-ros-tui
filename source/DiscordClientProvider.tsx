import { Client, GatewayIntentBits } from "discord.js";
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

interface SelectionContext {
  selection: Selection | undefined;
  setSelection: Dispatch<SetStateAction<Selection | undefined>>;
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
        <SelectionContext.Provider value={{ selection, setSelection }}>
          {children}
        </SelectionContext.Provider>
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

async function initializeDiscordClient(
  client: Client,
  token: string,
  guild: string,
  exit: () => void,
  setClient: (client: Client) => void
): Promise<void> {
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
