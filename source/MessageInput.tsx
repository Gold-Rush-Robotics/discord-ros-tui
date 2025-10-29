import {Box, Text} from 'ink';
import React from 'react';

export function MessageInput({input}: {input: string}) {
	return (
		<Box height={3} borderStyle="single">
			{!input ? (
				<>
					<Text color="white">{'> '}</Text>
					<Text dimColor>Enter a command... (Ctrl+C to exit)</Text>
				</>
			) : (
				<Text>
					<Text color="white">{'> '}</Text>
					{input}
				</Text>
			)}
		</Box>
	);
}
