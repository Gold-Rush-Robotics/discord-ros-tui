# discord-ros-tui

A terminal UI (TUI) Discord client that is meant to show how ROS works internally by using discord as an analogy.

## What is the ROS analogy?

- **Topics → Discord text channels**: Browse channels and view messages (like subscribing to a topic).
- **Nodes → Guild members**: Members of the server are analogous to nodes.
- **Packages → Roles**: Server roles are grouped like ROS packages.
- **Services → Mentioned users**: Users mentioned across recent messages are surfaced as callable services.

## Requirements

- Node.js >= 16
- pnpm (you can install from node)
- A Discord Bot added to your server (guild)
- Bot token and target guild ID

### Discord Developer Portal setup

1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Add a Bot: Application → Bot → "Add Bot".
3. Copy the bot token: Bot → "Reset Token". Keep it secret.
4. Enable Gateway Intents (otherwise this app won't work):
   - Enable all of them, they are all needed
5. Invite the bot to your server: OAuth2 → URL Generator:
   - Scopes: `bot`
   - Bot Permissions (minimum): View Channels, Read Message History
   - Open the generated URL, select your server, and authorize.

## Installation

Use pnpm for all commands (preferred). For globally linking the CLI locally, use npm link as pnpm link can be problematic on some systems.

Local global link (no registry publish):

```bash
# clone and install deps
git clone https://github.com/your-name/discord-ros-tui.git
cd discord-ros-tui
pnpm install

# build, then link globally
pnpm build
npm link --local   # may require sudo or root
```

## Configuration

Set credentials via environment variables or CLI flags.

- `TOKEN`: Discord bot token
- `GUILD`: Target guild (server) ID

Example `.env` in the project root:

```env
TOKEN=your-bot-token-here
GUILD=123456789012345678
```

You can also pass flags that override env:

```bash
discord-ros-tui --token=YOUR_TOKEN --guild=YOUR_GUILD_ID
```

## Usage

### From global link

```bash
discord-ros-tui
```

### From source

```bash
# fast dev run (tsx)
pnpm dev

# build TypeScript and run built CLI
pnpm build && pnpm start
```

If `TOKEN` or `GUILD` is missing, the app exits with an error and hints how to supply them.

## Keybindings

- Tab: Toggle focus between Topics and the Carousel (Nodes/Packages/Services)
- ← / →: Switch carousel panel when the carousel is focused
- ↑ / ↓: Move selection within the focused list
- Enter: Select the highlighted item
- Type any character: Focus the command input
- Ctrl+C: Exit

## Notes and limitations

- The app logs in using a Discord Bot token (not a user token).
- Message view shows recent items and streams new messages for the selected channel.
- The bot must have access to the channels you want to read, and Read Message History permission.

## Scripts

```bash
pnpm dev    # Run in watch mode with tsx
pnpm build  # Compile TypeScript to dist/
pnpm start  # Run the compiled CLI (dist/cli.js)
```

Note: Prefer pnpm for all commands. Avoid yarn and npm except for the one-time `npm link --local` step above if pnpm link does not work on your system.

## License

MIT
