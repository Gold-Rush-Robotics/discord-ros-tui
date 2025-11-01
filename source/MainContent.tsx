import { Box, Text } from "ink";
import React from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import { MessageInput } from "./MessageInput.js";
import Nodes from "./Nodes.js";
import TopicMessages from "./TopicMessages.js";
import Topics from "./Topics.js";

export function MainContent({ status }: { status: string }) {
  const { client } = useDiscord();
  const { selection } = useSelection();
  const user = client.user;

  let mainContent;
  switch (selection?.type) {
    case "topic":
      mainContent = <TopicMessages channelId={selection.id} />;
      break;
    case "node":
      mainContent = (
        <>
          <Text>Node: {selection?.id}</Text>
          <Text>Not yet implemented</Text>
        </>
      );
      break;
    default:
      mainContent = <Text>No selection</Text>;
      break;
  }

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
              overflow="hidden"
            >
              <Nodes interactable={true} />
            </Box>

            <Box
              borderStyle="single"
              flexDirection="column"
              flexGrow={1}
              paddingX={1}
              overflow="hidden"
            >
              <Topics interactable={true} />
            </Box>
          </Box>

          <Box
            borderStyle="single"
            flexDirection="column"
            flexGrow={1}
            paddingX={1}
            overflow="hidden"
          >
            <Text bold>Main content</Text>
            <Text>Logged in as {user?.username}</Text>
            <Text>Show info here</Text>
            {mainContent}
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
