import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from 'dotenv';
import express from 'express';
import { GameCommands } from './commands';
import { GameStorage } from './storage';

// Load environment variables
config();

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize game systems
const gameCommands = new GameCommands();
const storage = new GameStorage();

// Store commands
const commands = new Collection();
const slashCommands = gameCommands.getSlashCommands();

// Add commands to collection
slashCommands.forEach(command => {
  commands.set(command.name, command);
});

// Bot ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🚀 ${readyClient.user.tag} is online and ready to mine!`);
  
  // Register slash commands - GUILD ONLY (no global commands)
  try {
    console.log('📝 Registering GUILD commands only...');
    
    // Force guild commands only - use your specific guild ID
    const guildId = '1207668052859158569'; // GLYPH TALES guild ID
    const guild = readyClient.guilds.cache.get(guildId);
    
    if (guild) {
      await guild.commands.set(slashCommands);
      console.log(`✅ Commands registered for guild: ${guild.name} (ID: ${guildId})`);
      console.log('🎯 Using GUILD commands only - no global commands!');
    } else {
      console.log('❌ Guild not found! Available guilds:');
      readyClient.guilds.cache.forEach(g => {
        console.log(`  - ${g.name} (ID: ${g.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }

  // Send welcome message to a specific channel (optional)
  const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
  if (welcomeChannelId) {
    try {
      const channel = await readyClient.channels.fetch(welcomeChannelId);
      if (channel && channel.isTextBased() && 'send' in channel) {
        const welcomeEmbed = gameCommands.ui.createWelcomeEmbed();
        await (channel as any).send({ embeds: [welcomeEmbed] });
        console.log('📢 Welcome message sent');
      }
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await gameCommands.handleSlashCommand(interaction);
  } else if (interaction.isButton()) {
    await gameCommands.handleButtonInteraction(interaction);
  }
});

// Handle errors
client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  gameCommands.stopAllAutoRefresh();
  storage.backup();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  gameCommands.stopAllAutoRefresh();
  storage.backup();
  client.destroy();
  process.exit(0);
});

// Simple health check server for Railway
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req: any, res: any) => {
  res.status(200).json({ 
    message: 'Glyphs Bot Game is running',
    status: 'online',
    bot: client.user ? 'connected' : 'connecting'
  });
});

app.listen(port, () => {
  console.log(`🚀 Health check server running on port ${port}`);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN not found in environment variables!');
  process.exit(1);
}

client.login(token).catch((error) => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
