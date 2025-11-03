import { Box, Text, useInput, useStdout } from "ink";
import React, { useEffect, useState } from "react";
import Command from "./Command.js";
import CommandInput from "./CommandInput.js";
import {
  useDiscord,
  useMessages,
  useSelection,
} from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import NodeInfo from "./NodeInfo.js";
import Nodes from "./Nodes.js";
import PackageContents from "./PackageContents.js";
import Packages from "./Packages.js";
import ServiceCalls from "./ServiceCalls.js";
import Services from "./Services.js";
import TopicMessages from "./TopicMessages.js";
import Topics from "./Topics.js";
import Tutorial from "./Tutorial.js";
import {
  CommandExecutorContext,
  CommandResult,
  executeCommand,
} from "./commandExecutor.js";

const MIN_TERMINAL_COLUMNS = 100;
const MIN_TERMINAL_ROWS = 24;

function TerminalSizeWarning() {
  const { stdout } = useStdout();
  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100%"
      borderStyle="single"
      paddingX={1}
    >
      <Text bold color="yellow">
        Terminal window is too small
      </Text>
      <Text> </Text>
      <Text>
        Current size: {stdout.columns} columns × {stdout.rows} rows
      </Text>
      <Text> </Text>
      <Text>
        Minimum required: {MIN_TERMINAL_COLUMNS} columns × {MIN_TERMINAL_ROWS}{" "}
        rows
      </Text>
      <Text> </Text>
      <Text dimColor>Please resize your terminal window to continue.</Text>
    </Box>
  );
}

export default function MainContent() {
  const { stdout } = useStdout();
  const { carouselIndex, setCarouselIndex, isFocused } = useFocusManager();
  const { client, guild } = useDiscord();
  const { selection, setSelection, title, setTitle } = useSelection();
  const messagesByChannel = useMessages();
  const user = client.user;
  const [guildName, setGuildName] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(
    null
  );
  const [isTerminalTooSmall, setIsTerminalTooSmall] = useState(() => {
    return (
      stdout.columns < MIN_TERMINAL_COLUMNS || stdout.rows < MIN_TERMINAL_ROWS
    );
  });

  function getMentionedUserIds() {
    if (!(messagesByChannel instanceof Map) || messagesByChannel.size === 0) {
      return new Set<string>();
    }
    const userIds = new Set<string>();
    for (const messages of messagesByChannel.values()) {
      for (const message of messages) {
        for (const user of message.mentions.users.values()) {
          userIds.add(user.id);
        }
      }
    }
    return userIds;
  }

  async function onCommandSubmit(command: string) {
    setLastCommand(command);
    setSelection(undefined); // deselect any sidebar item so command output is shown

    const context: CommandExecutorContext = {
      client,
      guildId: guild,
      setSelection,
      getMentionedUserIds,
    };

    const result = await executeCommand(command, context);
    setCommandResult(result);

    // Handle selection commands immediately
    if (result.type === "selection") {
      setSelection(result.selection);
    }
  }

  // When showing command results (no selection), set a simple title
  useEffect(() => {
    // If a sidebar selection is active, defer to that view's title management
    if (selection) {
      return;
    }
    if (commandResult && lastCommand) {
      setTitle(<Text>Command output: {lastCommand}</Text>);
      return () => setTitle(null);
    }
    // If no command result, clear title
    setTitle(null);
    return () => setTitle(null);
  }, [selection, commandResult, lastCommand, setTitle]);

  // Check terminal size and listen for resize events
  useEffect(() => {
    function checkTerminalSize() {
      setIsTerminalTooSmall(
        stdout.columns < MIN_TERMINAL_COLUMNS || stdout.rows < MIN_TERMINAL_ROWS
      );
    }
    checkTerminalSize();
    stdout.on("resize", checkTerminalSize);
    return () => {
      stdout.off("resize", checkTerminalSize);
    };
  }, [stdout]);

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
  // Selection takes priority over command results
  if (selection) {
    switch (selection.type) {
      case "topic":
        mainContent = <TopicMessages channelId={selection.id} />;
        break;
      case "node":
        mainContent = <NodeInfo nodeId={selection.id} />;
        break;
      case "package":
        mainContent = <PackageContents pkg={selection.id} />;
        break;
      case "service":
        mainContent = <ServiceCalls service={selection.id} />;
        break;
    }
  } else if (commandResult) {
    // setTitle((_prev) => <Text>Command output: {lastCommand}</Text>);

    // Show command result if no selection
    switch (commandResult.type) {
      case "list":
        mainContent = commandResult.component;
        break;
      case "help":
        mainContent = (
          <Command command={lastCommand || ""} result={commandResult} />
        );
        break;
      case "error":
        mainContent = (
          <Command command={lastCommand || ""} result={commandResult} />
        );
        break;
      case "selection":
        // Should not happen here as we handle it in onCommandSubmit
        mainContent = <Tutorial />;
        break;
    }
  } else {
    mainContent = <Tutorial />;
  }

  if (isTerminalTooSmall) {
    return (
      <Box flexDirection="column" flexGrow={1} width="100%" height="100%">
        <TerminalSizeWarning />
      </Box>
    );
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

        <CommandInput onSubmit={onCommandSubmit} />
      </Box>
    </>
  );
}
