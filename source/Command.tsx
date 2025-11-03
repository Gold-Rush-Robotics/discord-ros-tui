import { Text } from "ink";
import React from "react";
import { CommandResult } from "./commandExecutor.js";

export default function Command({
  command,
  result,
}: {
  command: string;
  result?: CommandResult;
}) {
  let content: React.ReactNode;
  if (result) {
    if (result.type === "help") {
      content = result.content;
    } else if (result.type === "error") {
      content = result.message;
    } else {
      content = <Text>Command executed successfully.</Text>;
    }
  } else {
    content = (
      <Text>
        Command not found. Run <Text color="cyan">help</Text> to see the list of
        available commands.
      </Text>
    );
  }

  return (
    <>
      <Text dimColor>
        {"> "}
        {command}
      </Text>
      <Text> </Text>
      {content}
    </>
  );
}
