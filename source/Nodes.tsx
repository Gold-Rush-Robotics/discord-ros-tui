import { GuildMember } from "discord.js";
import { Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";

function Nodes({ interactable }: { interactable: boolean }) {
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [nodes, setNodes] = useState<GuildMember[] | null>(null);
	const { client, guild } = useDiscord();

	// Fetch all "nodes" (users) from the guild
	useEffect(() => {
		async function fetchNodes() {
			const guildObj = await client.guilds.fetch(guild);
			const members = await guildObj.members.fetch();
			setNodes(Array.from(members.values()));
		}
		fetchNodes();
	}, [client, guild]);

	if (!nodes) {
		return (
			<>
				<Text bold>Nodes</Text>
				<Text>
					Loading nodes
					<LoadingDots />
				</Text>
			</>
		);
	}

	return (
		<>
			<Text bold>Nodes ({nodes.length})</Text>
			{nodes.map((node) => (
				<Text key={node.id}>/{node.displayName}</Text>
			))}
		</>
	);
}

export default Nodes;
