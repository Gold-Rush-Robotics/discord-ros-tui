#!/usr/bin/env node
import "dotenv/config";
import { withFullScreen } from "fullscreen-ink";
import meow from "meow";
import React from "react";
import App from "./app.js";

const cli = meow(
	`
	Usage
	  $ discord-ros-tui

	Options
		--token  Discord bot token (overrides env)

	Examples
	  $ discord-ros-tui
	  $ discord-ros-tui --token=1234567890
`,
	{
		importMeta: import.meta,
		flags: {
			token: { type: "string" },
		},
	}
);

const tokenFromFlags = (cli.flags as any)["token"] as string | undefined;
const token = tokenFromFlags ?? process.env["TOKEN"] ?? undefined;

if (!token) {
	process.stderr.write(
		`\nNo token provided. Provide a token with --token or set TOKEN in your environment (e.g. in .env).\n\n`
	);
	process.exitCode = 1;
} else {
	const props: Record<string, string | undefined> = { token };
	withFullScreen(<App {...(props as any)} />).start();
}
