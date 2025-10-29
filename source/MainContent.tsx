import {Box, Text} from 'ink';
import React from 'react';
import {MessageInput} from './MessageInput.js';

export function MainContent({status}: {status: string}) {
	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box borderStyle="single" flexGrow={1}>
				<Text>MAIN CONTENT</Text>
			</Box>
			<MessageInput input={status} />
		</Box>
	);
}
