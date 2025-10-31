import { Box, Text } from "ink";
import React from "react";
import { useDiscord } from "./DiscordClientProvider.js";
import { MessageInput } from "./MessageInput.js";

export function MainContent({ status }: { status: string }) {
	const { client } = useDiscord();
	const user = client.user;

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box borderStyle="single" flexGrow={1}>
				<Text>Logged in as {user?.username}</Text>
			</Box>
			<MessageInput
				input={status}
				placeholder="Enter a command... (Ctrl+C to exit)"
			/>
		</Box>
	);
}
