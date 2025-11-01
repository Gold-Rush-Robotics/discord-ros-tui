import { Box, Key, useApp, useFocus, useFocusManager, useInput } from "ink";
import React, { useState } from "react";
import DiscordClientProvider from "./DiscordClientProvider.js";
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
  const { focus } = useFocusManager();
  const { isFocused: isCommandFocused } = useFocus({ id: "command-input" });

  useInput((input, key) => {
    let shouldFocusAnyway = false; // since I don't think focus() will update the state immediately
    if (shouldKeyFocusCommandInput(input, key)) {
      shouldFocusAnyway = true;
      focus("command-input");
    }
    if (key.ctrl && input === "c") {
      exit();
      return;
    }
    if (!isCommandFocused && !shouldFocusAnyway) {
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
    // The top-level box stretches to fill 100% of the screen height and width
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
