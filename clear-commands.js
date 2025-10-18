const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function clearCommands() {
  try {
    console.log('🗑️ Clearing all application commands...');
    
    // Clear global commands
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    
    console.log('✅ All global commands cleared');
    
    // If you have a specific guild, clear guild commands too
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: [] }
      );
      console.log('✅ All guild commands cleared');
    }
    
  } catch (error) {
    console.error('❌ Error clearing commands:', error);
  }
}

clearCommands();

