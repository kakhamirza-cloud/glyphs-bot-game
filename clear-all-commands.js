const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function clearAllCommands() {
  try {
    console.log('🗑️ Clearing ALL commands (global and guild)...');
    
    // Clear global commands
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log('✅ Global commands cleared');
    
    // Clear guild commands for your specific guild
    const guildId = '1207668052859158569'; // Your guild ID from the logs
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: [] }
    );
    console.log('✅ Guild commands cleared for GLYPH TALES');
    
    console.log('🎉 All commands cleared! Now restart the bot.');
    
  } catch (error) {
    console.error('❌ Error clearing commands:', error);
  }
}

clearAllCommands();

