import { Box, Key, Text, useInput } from "ink";
import React, { useState } from "react";
import { useFocusManager } from "./FocusManager.js";

export default function CommandInput({
  onSubmit,
}: {
  onSubmit: (command: string) => void;
}) {
  const [input, setInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const currentCommandInput =
    historyIndex === null ? input : commandHistory[historyIndex]!;

  const { isFocused, setFocus } = useFocusManager();

  useInput((_input, key) => {
    // Typing normal characters focuses command input; editing happens in MessageInput
    let focusAnyway = false;
    if (shouldKeyFocusCommandInput(input, key)) {
      setFocus("command-input");
      focusAnyway = true; // Otherwise the first input will probably be dropped since above state update doesn't apply yet
    }
    if (!isFocused("command-input") && !focusAnyway) {
      return;
    }
    if (key.upArrow) {
      setHistoryIndex((prev) => {
        if (commandHistory.length === 0) return null;
        if (prev === null) return commandHistory.length - 1;
        if (prev > 0) return prev - 1;
        return prev; // stay at 0
      });
      return;
    }
    if (key.downArrow) {
      setHistoryIndex((prev) => {
        if (commandHistory.length === 0) return null;
        if (prev === null) return null; // already at live input; no-op
        if (prev + 1 < commandHistory.length) return prev + 1;
        return null; // at last item; go back to live input
      });
      return;
    }
    if (key.delete || key.backspace) {
      if (historyIndex !== null) {
        // Switch to live input seeded with selected history entry, then apply backspace
        const seed = commandHistory[historyIndex] ?? "";
        setInput(seed.slice(0, -1));
        setHistoryIndex(null);
        return;
      }
      setInput((prev: string) => prev.slice(0, -1));
      return;
    }
    if (key.return) {
      if (currentCommandInput.trim() !== "") {
        onSubmit(currentCommandInput);
        setCommandHistory((prev) => [...prev, currentCommandInput]);
      }
      setHistoryIndex(null);
      setInput("");
      return;
    }
    // Append printable characters only
    if (
      !key.ctrl &&
      !key.meta &&
      !key.shift &&
      !key.tab &&
      !key.leftArrow &&
      !key.rightArrow &&
      !key.upArrow &&
      !key.downArrow
    ) {
      if (historyIndex !== null) {
        // Switch to live input seeded with selected history entry, then append
        const seed = commandHistory[historyIndex] ?? "";
        setInput(seed + _input);
        setHistoryIndex(null);
        return;
      }
      setInput((prev: string) => prev + _input);
    }
  });

  return (
    <Box height={3} borderStyle="single">
      {!currentCommandInput ? (
        <>
          <Text color="white">{"> "}</Text>
          <Text dimColor>Enter a command... (Ctrl+C to exit)</Text>
        </>
      ) : (
        <Text>
          <Text color="white">{"> "}</Text>
          {currentCommandInput}
        </Text>
      )}
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
