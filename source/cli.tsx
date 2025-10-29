#!/usr/bin/env node
import {withFullScreen} from 'fullscreen-ink';
import meow from 'meow';
import React from 'react';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ discord-ros-tui

	Options
		--name  Your name

	Examples
	  $ discord-ros-tui --name=Jane
	  Hello, Jane
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

withFullScreen(<App name={cli.flags.name} />).start();
