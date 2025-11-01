import { Box, Text } from "ink";
import React from "react";

export function MessageInput({
  input,
  placeholder,
}: {
  input: string;
  placeholder: string;
}) {
  return (
    <Box height={3} borderStyle="single">
      {!input ? (
        <>
          <Text color="white">{"> "}</Text>
          <Text dimColor>{placeholder}</Text>
        </>
      ) : (
        <Text>
          <Text color="white">{"> "}</Text>
          {input}
        </Text>
      )}
    </Box>
  );
}
