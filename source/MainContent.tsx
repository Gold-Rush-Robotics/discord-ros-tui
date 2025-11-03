import { Box, Text, useInput } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import { MessageInput } from "./MessageInput.js";
import NodeInfo from "./NodeInfo.js";
import Nodes from "./Nodes.js";
import PackageContents from "./PackageContents.js";
import Packages from "./Packages.js";
import ServiceCalls from "./ServiceCalls.js";
import Services from "./Services.js";
import TopicMessages from "./TopicMessages.js";
import Topics from "./Topics.js";
import Tutorial from "./Tutorial.js";

export function MainContent({ status }: { status: string }) {
  const { carouselIndex, setCarouselIndex, isFocused } = useFocusManager();
  const { client } = useDiscord();
  const { selection, title } = useSelection();
  const user = client.user;
  const [guildName, setGuildName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadGuildName() {
      try {
        const me = await client.guilds.fetch();
        // Prefer showing current guild name if available among cache/fetch
        // Fallback to first available guild if needed
        const first = me.first();
        if (!active) return;
        setGuildName(first?.name ?? null);
      } catch {
        if (!active) return;
        setGuildName(null);
      }
    }
    loadGuildName();
    return () => {
      active = false;
    };
  }, [client.guilds]);

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
      mainContent = <NodeInfo nodeId={selection?.id} />;
      break;
    case "package":
      mainContent = <PackageContents pkg={selection?.id} />;
      break;
    case "service":
      mainContent = <ServiceCalls service={selection?.id} />;
      break;
    default:
      mainContent = <Tutorial />;
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
            <Box flexDirection="column" gap={1} marginBottom={1}>
              <Text bold>
                {user?.username}
                {guildName && (
                  <>
                    {" | "}
                    {guildName}
                  </>
                )}
                {title && (
                  <>
                    {" | "}
                    {title}
                  </>
                )}
              </Text>
            </Box>
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
