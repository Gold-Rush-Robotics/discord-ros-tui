import { Client, GatewayIntentBits } from "discord.js";
import { Text, useApp } from "ink";
import React, { useContext, useEffect, useState } from "react";
import LoadingDots from "./LoadingDots.js";
import { exitError } from "./utils.js";

const DiscordClientContext = React.createContext<Client | null>(null);
const GuildContext = React.createContext<string | null>(null);

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
  const { exit } = useApp();

  useEffect(() => {
    if (!token) {
      throw new Error("No token provided");
    }
    const newClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
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
      <GuildContext.Provider value={guild}>{children}</GuildContext.Provider>
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
