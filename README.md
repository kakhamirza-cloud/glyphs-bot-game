# Glyphs Bot Game

A Discord mining game bot with tile digging mechanics, built with TypeScript and Discord.js.

## 🎮 Game Features

- **Tile Mining System**: Dig through tiles to find valuable minerals
- **Mineral Collection**: Discover different types of minerals with varying rarities
- **Private Threads**: Each player gets their own private mining thread
- **Leaderboard**: Track your progress against other miners
- **Auto-refresh**: Real-time updates of your mining progress
- **Grumble System**: Bet on mining outcomes with other players

## 🛠️ Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Discord.js v14** - Discord API wrapper
- **Express** - Health check server for Railway
- **Node.js** - Runtime environment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Discord Bot Token
- Discord Application with proper permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd glyphs-bot-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your values
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   WELCOME_CHANNEL_ID=your_welcome_channel_id_here
   PORT=3000
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## 📋 Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production bot
- `npm run dev` - Start the bot in development mode
- `npm run watch` - Watch for TypeScript changes and recompile

## 🎯 Bot Commands

### Slash Commands

- `/start` - Begin your mining adventure
- `/dig` - Dig a tile in your current location
- `/inventory` - View your collected minerals
- `/leaderboard` - See the top miners
- `/stats` - View your mining statistics
- `/help` - Get help with commands

### Game Mechanics

- **Tiles**: Each player starts with a grid of tiles to dig
- **Minerals**: Different minerals have different values and rarities
- **Depth**: Dig deeper to find rarer minerals
- **Private Threads**: Each player gets their own private mining thread
- **Auto-refresh**: Your mining progress updates automatically

## 🏗️ Project Structure

```
src/
├── index.ts          # Main bot entry point
├── commands.ts       # Slash command handlers
├── game.ts          # Game logic and mechanics
├── storage.ts       # Data persistence
├── types.ts         # TypeScript type definitions
└── ui.ts           # Discord UI components
```

## 🚀 Deployment

### Railway Deployment

This bot is configured for Railway deployment:

1. **Railway Configuration**: `railway.json` is included
2. **Health Check**: Express server for Railway health monitoring
3. **Environment Variables**: Set in Railway dashboard

### Manual Deployment

1. Build the project: `npm run build`
2. Set environment variables
3. Start with: `npm start`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | ✅ |
| `CLIENT_ID` | Your Discord application ID | ✅ |
| `GUILD_ID` | Your Discord server ID | ✅ |
| `WELCOME_CHANNEL_ID` | Channel for welcome messages | ❌ |
| `PORT` | Port for health check server | ❌ (default: 3000) |

### Discord Bot Permissions

Your bot needs the following permissions:
- Send Messages
- Use Slash Commands
- Create Public Threads
- Create Private Threads
- Manage Threads
- Read Message History
- Embed Links

## 📊 Game Data

- **Player Data**: Stored in `data/players.json`
- **Backups**: Automatic backups created in `data/backup-*.json`
- **Persistence**: All game state is saved automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the logs for error messages
2. Verify your environment variables are set correctly
3. Ensure your bot has the required Discord permissions
4. Check that your Discord application is properly configured

## 🎮 Game Rules

- Each player starts with a fresh mining grid
- Dig tiles to discover minerals
- Rarer minerals are found deeper
- Your progress is automatically saved
- Compete with other players on the leaderboard

---

**Happy Mining! ⛏️**