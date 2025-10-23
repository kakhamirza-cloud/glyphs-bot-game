import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { GameCommands } from './commands';

// Load environment variables
config();

const commands = new GameCommands().getSlashCommands();
const commandData = commands.map(command => command.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`🔄 Started refreshing ${commandData.length} application (/) commands.`);

    // Register commands for specific guild only
    const guildId = process.env.GUILD_ID!;
    const clientId = process.env.CLIENT_ID!;

    if (!guildId || !clientId) {
      console.error('❌ Missing GUILD_ID or CLIENT_ID in environment variables');
      process.exit(1);
    }

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandData },
    );

    console.log(`✅ Successfully reloaded ${(data as any).length} application (/) commands.`);
    console.log('🎯 Commands registered for guild:', guildId);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

