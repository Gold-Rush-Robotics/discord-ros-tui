import {Box, Text} from 'ink';
import React from 'react';
import {MessageInput} from './MessageInput.js';

export function MainContent({status}: {status: string}) {
  return (
    <>
      <Box flexDirection="column" flexGrow={1}>
        <Box flexDirection="row" flexGrow={1}>
          <Box borderStyle="single" flexDirection="column" width={25}>

            <Box flexDirection="column" flexGrow={1} paddingX={1}>
              <Text bold>Nodes</Text>
              <Text>Node1</Text>
              <Text>Node2</Text>
            </Box>

            <Box flexDirection="column" flexGrow={1} paddingX={1}>
              <Text bold>Topics</Text>
              <Text>Topic1</Text>
              <Text>Topic2</Text>
            </Box>

          </Box>

          <Box borderStyle="single" flexDirection="column" flexGrow={1} paddingX={1}>
            <Text bold>Main content</Text>
            <Text>Show info here</Text>
          </Box>

        </Box>

        <MessageInput input={status} />
      </Box>
    </>
  );
}
