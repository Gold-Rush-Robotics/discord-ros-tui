import { Box, Text } from "ink";
import React from "react";
import { useDiscord } from "./DiscordClientProvider.js";
import { MessageInput } from "./MessageInput.js";

export function MainContent({ status }: { status: string }) {
	const { client } = useDiscord();
	const user = client.user;

	return (
		<>
			<Box flexDirection="column" flexGrow={1}>
				<Box flexDirection="row" flexGrow={1} gap={1}>
					<Box flexDirection="column" width={25}>
						<Box
							borderStyle="single"
							flexDirection="column"
							flexGrow={1}
							paddingX={1}
						>
							<Text bold>Nodes</Text>
							<Text>Node1</Text>
							<Text>Node2</Text>
						</Box>

						<Box
							borderStyle="single"
							flexDirection="column"
							flexGrow={1}
							paddingX={1}
						>
							<Text bold>Topics</Text>
							<Text>Topic1</Text>
							<Text>Topic2</Text>
						</Box>
					</Box>

					<Box
						borderStyle="single"
						flexDirection="column"
						flexGrow={1}
						paddingX={1}
					>
						<Text bold>Main content</Text>
						<Text>Logged in as {user?.username}</Text>
						<Text>Show info here</Text>
					</Box>
				</Box>

				<MessageInput
					input={status}
					placeholder="Enter a command... (Ctrl+C to exit)"
				/>
			</Box>
		</>
	);
}
