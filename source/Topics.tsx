import { ChannelType, GuildChannel } from "discord.js";
import { Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";

function Topics({ interactable }: { interactable: boolean }) {
	const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
	const [topics, setTopics] = useState<GuildChannel[] | null>(null);
	const { client, guild } = useDiscord();

	// Fetch all "topics" (channels) from the guild
	useEffect(() => {
		async function fetchTopics() {
			const guildObj = await client.guilds.fetch(guild);
			const channels = await guildObj.channels.fetch();
			setTopics(
				Array.from(channels.values()).filter(
					(channel) =>
						channel !== null && channel.type === ChannelType.GuildText
				)
			);
		}
		fetchTopics();
	}, [client, guild]);

	if (!topics) {
		return (
			<>
				<Text bold>Topics</Text>
				<Text>
					Loading topics
					<LoadingDots />
				</Text>
			</>
		);
	}

	return (
		<>
			<Text bold>Topics ({topics.length})</Text>
			{topics.map((topic) => (
				<Text key={topic.id}>/{topic.name}</Text>
			))}
		</>
	);
}

export default Topics;
