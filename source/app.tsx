import { Box, useApp, useInput } from "ink";
import React, { useState } from "react";
import DiscordClientProvider from "./DiscordClientProvider.js";
import { MainContent } from "./MainContent.js";

export default function App({ token: inputToken }: { token?: string }) {
	const [input, setInput] = useState<string>("");
	const [token, setToken] = useState<string | undefined>(inputToken);
	const { exit } = useApp();

	useInput((input, key) => {
		if (key.ctrl && input === "c") {
			exit();
			return;
		}
		if (key.return) {
			setInput("");
			return;
		}
		if (key.delete || key.backspace) {
			if (!token) {
				setToken((_prev: string | undefined) => input.trim());
			}
			setInput((prev: string) => prev.slice(0, -1));
			return;
		}
		setInput((prev: string) => prev + input);
	});

	return (
		// The top-level box stretches to fill 100% of the screen height and width
		<Box width="100%" height="100%">
			<DiscordClientProvider token={token ?? ""}>
				<MainContent status={input} />
			</DiscordClientProvider>
		</Box>
	);
}
