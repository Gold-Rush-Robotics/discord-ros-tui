import { Text } from "ink";
import React from "react";

export default function Tutorial() {
  return (
    <>
      <Text bold>Keybindings</Text>
      <Text>Tab: Focus between different panels</Text>
      <Text>Up/Down: Scroll or change selection</Text>
      <Text>Enter: Select</Text>
      <Text>Type: Focus the command input</Text>
      <Text>Ctrl+C: Exit</Text>
      <Text> </Text>
      <Text bold>Commands</Text>
      <Text>Run 'help' to view the list of available commands.</Text>
      <Text> </Text>
      <Text>
        When you run a command or select something it will appear in this
        window. This message always shows on startup.
      </Text>
    </>
  );
}
