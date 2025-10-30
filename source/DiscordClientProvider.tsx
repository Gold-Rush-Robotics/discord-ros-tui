import {Client, GatewayIntentBits} from 'discord.js';
import {useApp} from 'ink';
import React, {useContext, useEffect, useState} from 'react';

const DiscordClientContext = React.createContext<Client | null>(null);

function DiscordClientProvider({
	token,
	children,
}: {
	token: string;
	children: React.ReactNode;
}) {
	const [client, setClient] = useState<Client | null>(null);
	const {exit} = useApp();

	useEffect(() => {
		if (!token) {
			throw new Error('No token provided');
		}
		const newClient = new Client({intents: [GatewayIntentBits.Guilds]});
		newClient
			.login(token)
			.then(() => setClient(newClient))
			.catch(err => {
				exit(new Error('Failed to login Discord client: ' + err.message));
			});
		// Cleanup function if needed in future
		return () => {
			newClient.destroy();
		};
	}, [token]);

	return (
		<DiscordClientContext.Provider value={client}>
			{children}
		</DiscordClientContext.Provider>
	);
}

export function useDiscordClient() {
	return useContext(DiscordClientContext);
}

export default DiscordClientProvider;
