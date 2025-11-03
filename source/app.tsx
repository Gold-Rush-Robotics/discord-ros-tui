import { Box, useApp, useInput } from "ink";
import React from "react";
import DiscordClientProvider from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import MainContent from "./MainContent.js";

export default function App({
  token,
  guild,
}: {
  token: string;
  guild: string;
}) {
  const { exit } = useApp();
  const { currentFocus, setFocus } = useFocusManager();

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
  });

  return (
    <Box width="100%" height="100%">
      <DiscordClientProvider token={token} guild={guild}>
        <MainContent />
      </DiscordClientProvider>
    </Box>
  );
}
