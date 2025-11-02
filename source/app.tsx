import { Box, Key, useApp, useInput } from "ink";
import React, { useState } from "react";
import DiscordClientProvider from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import { MainContent } from "./MainContent.js";

export default function App({
  token,
  guild,
}: {
  token: string;
  guild: string;
}) {
  const [input, setInput] = useState<string>("");
  const { exit } = useApp();
  const { currentFocus, setFocus, isFocused } = useFocusManager();

  useInput((input, key) => {
    // Ctrl+C always exits
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    // Tab toggles between topics and carousel
    if (key.tab && !key.shift) {
      if (currentFocus === "topics") {
        setFocus("carousel");
      } else if (currentFocus === "carousel") {
        setFocus("topics");
      } else {
        // If in command input, go to topics first
        setFocus("topics");
      }
      return;
    }

    // Typing normal characters focuses command input
    if (shouldKeyFocusCommandInput(input, key)) {
      setFocus("command-input");
    }

    // Only handle input if command input is focused
    if (
      !isFocused("command-input") &&
      !shouldKeyFocusCommandInput(input, key)
    ) {
      return;
    }

    if (key.return) {
      setInput("");
      return;
    }
    if (key.delete || key.backspace) {
      setInput((prev: string) => prev.slice(0, -1));
      return;
    }
    setInput((prev: string) => prev + input);
  });

  return (
    <Box width="100%" height="100%">
      <DiscordClientProvider token={token} guild={guild}>
        <MainContent status={input} />
      </DiscordClientProvider>
    </Box>
  );
}

function shouldKeyFocusCommandInput(input: string, key: Key) {
  if (
    key.upArrow ||
    key.downArrow ||
    key.leftArrow ||
    key.rightArrow ||
    key.tab ||
    key.return
  ) {
    return false;
  }

  return input !== "";
}
