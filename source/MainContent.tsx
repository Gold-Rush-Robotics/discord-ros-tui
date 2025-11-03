import { Box, Text, useInput } from "ink";
import React from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import { MessageInput } from "./MessageInput.js";
import Nodes from "./Nodes.js";
import Packages from "./Packages.js";
import Services from "./Services.js";
import TopicMessages from "./TopicMessages.js";
import Topics from "./Topics.js";

export function MainContent({ status }: { status: string }) {
  const { carouselIndex, setCarouselIndex, isFocused } = useFocusManager();
  const { client } = useDiscord();
  const { selection } = useSelection();
  const user = client.user;

  const carousel = [
    { id: "node", element: <Nodes interactable={true} /> },
    { id: "packages", element: <Packages interactable={true} /> },
    { id: "services", element: <Services interactable={true} /> },
  ];

  // Handle left/right arrows in carousel
  useInput((_input, key) => {
    if (!isFocused("carousel")) {
      return;
    }

    if (key.leftArrow) {
      setCarouselIndex((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else {
          return carousel.length - 1;
        }
      });
    }
    if (key.rightArrow) {
      setCarouselIndex((prev) => {
        if (prev + 1 < carousel.length) {
          return prev + 1;
        } else {
          return 0;
        }
      });
    }
  });

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
            {/* Topics (channels) - static */}
            <Box
              borderStyle="single"
              flexDirection="column"
              paddingX={1}
              overflow="hidden"
              height={"50%"}
            >
              <Topics interactable={true} />
            </Box>
            {/* Carousel for other selection screens */}
            <Box
              borderStyle="single"
              flexDirection="column"
              paddingX={1}
              overflow="hidden"
              height={"50%"}
            >
              {carousel[carouselIndex]?.element}
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
