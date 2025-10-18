import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  PermissionFlagsBits,
  ChannelType,
  ThreadChannel
} from 'discord.js';
import { MiningGame } from './game';
import { GameStorage } from './storage';
import { GameUI } from './ui';
import { Player } from './types';

export class GameCommands {
  private game: MiningGame;
  private storage: GameStorage;
  public ui: GameUI;
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly ADMIN_USER_ID = '410662767981232128'; // Admin can see all threads

  constructor() {
    this.game = new MiningGame();
    this.storage = new GameStorage();
    this.ui = new GameUI(this.game);
  }

  /**
   * Get or create a private thread for the player
   */
  private async getOrCreatePrivateThread(interaction: ChatInputCommandInteraction, userId: string, username: string): Promise<ThreadChannel> {
    const player = this.storage.getOrCreatePlayer(userId, username);
    
    // If player already has a thread, try to get it
    if (player.privateThreadId) {
      try {
        const existingThread = await interaction.client.channels.fetch(player.privateThreadId) as ThreadChannel;
        if (existingThread && existingThread.type === ChannelType.PrivateThread) {
          return existingThread;
        }
      } catch (error) {
        console.log(`Thread ${player.privateThreadId} not found, creating new one`);
      }
    }

    // Create new private thread
    const channel = interaction.channel;
    if (!channel || !('threads' in channel)) {
      throw new Error('This channel does not support threads');
    }
    
    const thread = await channel.threads.create({
      name: `Mining Game - ${username}`,
      autoArchiveDuration: 60 // Auto-archive after 1 hour of inactivity
    });

    // Add admin to the thread so they can see all threads
    try {
      await thread.members.add(this.ADMIN_USER_ID);
    } catch (error) {
      console.log('Could not add admin to thread:', error);
    }

    // Save thread ID to player data
    this.storage.updatePlayerThreadId(userId, thread.id);

    return thread;
  }

  /**
   * Check if user is admin
   */
  private isAdmin(userId: string): boolean {
    return userId === this.ADMIN_USER_ID;
  }

  /**
   * Handle slash commands
   */
  async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = interaction.commandName;

    try {
      switch (command) {
        case 'help':
          await this.handleHelp(interaction);
          break;
        case 'start':
          await this.handleStart(interaction);
          break;
        case 'balance':
          await this.handleBalance(interaction);
          break;
        case 'leaderboard':
          // Only show leaderboard to admin
          if (this.isAdmin(interaction.user.id)) {
            await this.handleLeaderboard(interaction);
          } else {
            await interaction.reply({ 
              content: '🔒 Leaderboard is only available to administrators.', 
              ephemeral: true 
            });
          }
          break;
        case 'reset':
          await this.handleReset(interaction);
          break;
        case 'reset-leaderboard':
          await this.handleResetLeaderboard(interaction);
          break;
        case 'addglyphs':
          await this.handleAddGlyphs(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown command!', ephemeral: true });
      }
    } catch (error) {
      console.error(`Error handling command ${command}:`, error);
      await interaction.reply({ 
        content: 'An error occurred while processing your command!', 
        ephemeral: true 
      });
    }
  }

  /**
   * Handle button interactions
   */
  async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
      // Stop any existing auto-refresh for this user when they interact with buttons
      this.stopAutoRefresh(userId);

      switch (customId) {
        case 'dig':
          await this.handleDig(interaction, userId, username);
          break;
        case 'market':
          await this.handleMarket(interaction, userId, username);
          break;
        case 'leaderboard':
          // Only show leaderboard to admin, or make it private
          if (this.isAdmin(userId)) {
            await this.handleLeaderboard(interaction);
          } else {
            await interaction.reply({ 
              content: '🔒 Leaderboard is only available to administrators.', 
              ephemeral: true 
            });
          }
          break;
        case 'balance':
          await this.handleBalance(interaction);
          break;
        case 'refresh':
          await this.handleRefresh(interaction, userId, username);
          break;
        case 'back_to_game':
          await this.handleBackToGame(interaction, userId, username);
          break;
        case 'buy_pickaxe':
          await this.handleBuyItem(interaction, userId, username, 'pickaxes', 500);
          break;
        case 'buy_dynamite':
          await this.handleBuyItem(interaction, userId, username, 'dynamites', 1000);
          break;
        case 'buy_explosive':
          await this.handleBuyItem(interaction, userId, username, 'explosives', 2000);
          break;
        default:
          await interaction.reply({ content: 'Unknown button!', ephemeral: true });
      }
    } catch (error) {
      console.error(`Error handling button ${customId}:`, error);
      await interaction.reply({ 
        content: 'An error occurred while processing your action!', 
        ephemeral: true 
      });
    }
  }

  /**
   * Help command
   */
  private async handleHelp(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = this.ui.createHelpEmbed();
    await interaction.reply({ embeds: [embed] });
  }

  /**
   * Start command - shows welcome and game interface
   */
  private async handleStart(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    // Get or create private thread for this player
    const thread = await this.getOrCreatePrivateThread(interaction, userId, username);
    
    const player = this.storage.getOrCreatePlayer(userId, username);
    const embed = this.ui.createGameEmbed(player);
    const buttons = this.ui.createActionButtons(player);

    // Send initial response in main channel (ephemeral)
    await interaction.reply({ 
      content: `🎮 Your private mining game has been created! Check your private thread: ${thread}`,
      ephemeral: true
    });

    // Send game interface to private thread
    const message = await thread.send({ 
      embeds: [embed], 
      components: [buttons]
    });

    // Start auto-refresh if there's a cooldown
    this.startAutoRefresh(userId, message);
  }

  /**
   * Balance command
   */
  private async handleBalance(interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<void> {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    const player = this.storage.getOrCreatePlayer(userId, username);
    const embed = this.ui.createBalanceEmbed(player);

    if (interaction.isChatInputCommand()) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.update({ embeds: [embed] });
    }
  }

  /**
   * Leaderboard command
   */
  private async handleLeaderboard(interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<void> {
    const leaderboard = this.storage.getLeaderboard(5);
    const embed = this.ui.createLeaderboardEmbed(leaderboard);

    if (interaction.isChatInputCommand()) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.update({ embeds: [embed] });
    }
  }

  /**
   * Dig action
   */
  private async handleDig(interaction: ButtonInteraction, userId: string, username: string): Promise<void> {
    const player = this.storage.getOrCreatePlayer(userId, username);
    
    // Check if player has items to use
    let itemToUse: keyof Player['items'] | undefined;
    if (player.items.pickaxes > 0) {
      itemToUse = 'pickaxes';
    } else if (player.items.dynamites > 0) {
      itemToUse = 'dynamites';
    } else if (player.items.explosives > 0) {
      itemToUse = 'explosives';
    }

    const result = this.game.dig(player, itemToUse);
    this.storage.savePlayer(player);

    // Check if player won
    if (result.newTile <= 0 && result.success) {
      const winnerEmbed = new EmbedBuilder()
        .setTitle('🎉 CONGRATULATIONS!')
        .setColor(0xFFD700)
        .setDescription(`**${username}** has reached the deepest point!`)
        .addFields(
          {
            name: '🏆 Achievement',
            value: 'First player to reach tile 0!',
            inline: false
          },
          {
            name: '📊 Final Stats',
            value: `Tiles Dug: ${player.totalTilesDug.toLocaleString()}\nGlyphs Earned: ${player.glyphs.toLocaleString()}`,
            inline: false
          }
        )
        .setTimestamp();

      // Send notification to specific user
      const notificationUserId = process.env.DEEPEST_NOTIFICATION_USER_ID;
      if (notificationUserId) {
        try {
          const user = await interaction.client.users.fetch(notificationUserId);
          await user.send(`🎉 **${username}** has reached the deepest point in the mining game!`);
        } catch (error) {
          console.error('Error sending winner notification:', error);
        }
      }

      await interaction.update({ 
        embeds: [winnerEmbed], 
        components: [] 
      });
      return;
    }

    const resultEmbed = this.ui.createDigResultEmbed(result, player);
    const gameEmbed = this.ui.createGameEmbed(player);
    const buttons = this.ui.createActionButtons(player);

    const message = await interaction.update({ 
      embeds: [resultEmbed, gameEmbed], 
      components: [buttons],
      fetchReply: true
    }) as Message;

    // Start auto-refresh if there's a new cooldown
    this.startAutoRefresh(userId, message);
  }

  /**
   * Market action
   */
  private async handleMarket(interaction: ButtonInteraction, userId: string, username: string): Promise<void> {
    const player = this.storage.getOrCreatePlayer(userId, username);
    const embed = this.ui.createMarketEmbed(player);
    const buttons = this.ui.createMarketButtons(player);

    await interaction.update({ 
      embeds: [embed], 
      components: [buttons] 
    });
  }

  /**
   * Buy item action
   */
  private async handleBuyItem(
    interaction: ButtonInteraction, 
    userId: string, 
    username: string, 
    itemType: keyof Player['items'], 
    cost: number
  ): Promise<void> {
    const player = this.storage.getOrCreatePlayer(userId, username);

    if (player.glyphs < cost) {
      await interaction.reply({ 
        content: `❌ You don't have enough glyphs! You need ${cost} but only have ${player.glyphs}.`, 
        ephemeral: true 
      });
      return;
    }

    player.glyphs -= cost;
    player.items[itemType]++;
    this.storage.savePlayer(player);

    const itemNames = {
      pickaxes: 'Pickaxe',
      dynamites: 'Dynamite',
      explosives: 'Explosive'
    };

    // Update the market display
    const embed = this.ui.createMarketEmbed(player);
    const buttons = this.ui.createMarketButtons(player);
    
    await interaction.update({ 
      content: `✅ Successfully purchased ${itemNames[itemType]} for ${cost} glyphs!`,
      embeds: [embed], 
      components: [buttons] 
    });
  }

  /**
   * Refresh action
   */
  private async handleRefresh(interaction: ButtonInteraction, userId: string, username: string): Promise<void> {
    const player = this.storage.getOrCreatePlayer(userId, username);
    const embed = this.ui.createGameEmbed(player);
    const buttons = this.ui.createActionButtons(player);

    const message = await interaction.update({ 
      embeds: [embed], 
      components: [buttons],
      fetchReply: true
    }) as Message;

    // Start auto-refresh if there's a cooldown
    this.startAutoRefresh(userId, message);
  }

  /**
   * Back to game action
   */
  private async handleBackToGame(interaction: ButtonInteraction, userId: string, username: string): Promise<void> {
    const player = this.storage.getOrCreatePlayer(userId, username);
    const embed = this.ui.createGameEmbed(player);
    const buttons = this.ui.createActionButtons(player);

    const message = await interaction.update({ 
      embeds: [embed], 
      components: [buttons],
      fetchReply: true
    }) as Message;

    // Start auto-refresh if there's a cooldown
    this.startAutoRefresh(userId, message);
  }

  /**
   * Reset command - resets all player progress
   */
  private async handleReset(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    // Create a fresh player (this resets everything)
    const resetPlayer = this.storage.getOrCreatePlayer(userId, username);
    
    // Reset all progress
    resetPlayer.currentTile = 2000;
    resetPlayer.glyphs = 0;
    resetPlayer.items = { pickaxes: 0, dynamites: 0, explosives: 0 };
    resetPlayer.lastDigTime = 0;
    resetPlayer.timeoutUntil = 0;
    resetPlayer.totalTilesDug = 0;
    
    // Save the reset player
    this.storage.savePlayer(resetPlayer);
    
    const embed = new EmbedBuilder()
      .setTitle('🔄 Progress Reset')
      .setColor(0xFF6B6B)
      .setDescription('Your mining progress has been completely reset!')
      .addFields(
        {
          name: '🎯 Current Tile',
          value: '**2,000** (Starting position)',
          inline: true
        },
        {
          name: '💰 Glyphs',
          value: '**0**',
          inline: true
        },
        {
          name: '📊 Tiles Dug',
          value: '**0**',
          inline: true
        },
        {
          name: '🛒 Items',
          value: '**All items removed**',
          inline: false
        }
      )
      .setFooter({ text: 'Start fresh with /start command!' })
      .setTimestamp();

    await interaction.reply({ 
      embeds: [embed],
      ephemeral: true 
    });
  }

  /**
   * Reset leaderboard command - resets all player data
   */
  private async handleResetLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
    // Reset all player data
    this.storage.resetAllPlayers();
    
    const embed = new EmbedBuilder()
      .setTitle('🏆 Leaderboard Reset')
      .setColor(0xFF6B6B)
      .setDescription('All player data has been reset! The leaderboard is now empty.')
      .addFields(
        {
          name: '📊 What was reset',
          value: '• All player progress\n• All glyphs and items\n• All tiles dug counts\n• All leaderboard positions',
          inline: false
        },
        {
          name: '💾 Backup Created',
          value: 'A backup of the previous data was created before reset.',
          inline: false
        }
      )
      .setFooter({ text: 'Everyone starts fresh now!' })
      .setTimestamp();

    await interaction.reply({ 
      embeds: [embed],
      ephemeral: true 
    });
  }

  /**
   * Add glyphs command - adds glyphs to a player's balance
   */
  private async handleAddGlyphs(interaction: ChatInputCommandInteraction): Promise<void> {
    const amount = interaction.options.getInteger('amount', true);
    const targetUser = interaction.options.getUser('user', false);
    
    // Validate amount
    if (amount <= 0) {
      await interaction.reply({ 
        content: '❌ Amount must be greater than 0!', 
        ephemeral: true 
      });
      return;
    }

    if (amount > 1000000) {
      await interaction.reply({ 
        content: '❌ Amount cannot exceed 1,000,000 glyphs!', 
        ephemeral: true 
      });
      return;
    }

    // Determine target user
    const targetUserId = targetUser ? targetUser.id : interaction.user.id;
    const targetUsername = targetUser ? targetUser.username : interaction.user.username;
    
    // Get or create player
    const player = this.storage.getOrCreatePlayer(targetUserId, targetUsername);
    
    // Add glyphs
    const oldBalance = player.glyphs;
    player.glyphs += amount;
    this.storage.savePlayer(player);

    const embed = new EmbedBuilder()
      .setTitle('💰 Glyphs Added')
      .setColor(0x2ECC71)
      .setDescription(`Successfully added **${amount.toLocaleString()}** glyphs!`)
      .addFields(
        {
          name: '👤 Player',
          value: `**${targetUsername}**`,
          inline: true
        },
        {
          name: '💎 Previous Balance',
          value: `**${oldBalance.toLocaleString()}**`,
          inline: true
        },
        {
          name: '💰 New Balance',
          value: `**${player.glyphs.toLocaleString()}**`,
          inline: true
        }
      )
      .setTimestamp();

    // Create response content with user tag if target user is specified
    let responseContent = '';
    if (targetUser && targetUser.id !== interaction.user.id) {
      responseContent = `🎉 ${targetUser} you've received **${amount.toLocaleString()}** glyphs!`;
    }

    await interaction.reply({ 
      content: responseContent,
      embeds: [embed],
      ephemeral: true // Make it private so only the admin can see it
    });
  }

  /**
   * Start auto-refresh for a user's game message
   */
  private startAutoRefresh(userId: string, message: Message): void {
    // Clear any existing timer for this user
    this.stopAutoRefresh(userId);

    const player = this.storage.getOrCreatePlayer(userId, message.author.username);
    const timeRemaining = this.game.getTimeRemaining(player);
    
    // Only start auto-refresh if there's an active cooldown or timeout
    if (timeRemaining.cooldown > 0 || timeRemaining.timeout > 0) {
      const timer = setInterval(async () => {
        try {
          // Check if message still exists and is editable
          if (!message) {
            this.stopAutoRefresh(userId);
            return;
          }

          const currentPlayer = this.storage.getOrCreatePlayer(userId, message.author.username);
          const currentTimeRemaining = this.game.getTimeRemaining(currentPlayer);
          
          const embed = this.ui.createGameEmbed(currentPlayer);
          const buttons = this.ui.createActionButtons(currentPlayer);
          
          await message.edit({ embeds: [embed], components: [buttons] });
          
          // Stop auto-refresh if cooldown/timeout is finished
          if (currentTimeRemaining.cooldown <= 0 && currentTimeRemaining.timeout <= 0) {
            this.stopAutoRefresh(userId);
            return;
          }
        } catch (error) {
          console.error('Error in auto-refresh:', error);
          this.stopAutoRefresh(userId);
        }
      }, 2000); // Update every 2 seconds to reduce API calls

      this.activeTimers.set(userId, timer);
    }
  }

  /**
   * Stop auto-refresh for a user
   */
  private stopAutoRefresh(userId: string): void {
    const timer = this.activeTimers.get(userId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(userId);
    }
  }

  /**
   * Stop all auto-refresh timers (for cleanup)
   */
  stopAllAutoRefresh(): void {
    for (const [userId, timer] of this.activeTimers) {
      clearInterval(timer);
    }
    this.activeTimers.clear();
  }

  /**
   * Get slash command definitions
   */
  getSlashCommands() {
    return [
      new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help information for the mining game'),
      
      new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start the mining game'),
      
      new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your current balance and stats'),
      
      new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top miners leaderboard'),
      
      new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset all your mining progress and items'),
      
      new SlashCommandBuilder()
        .setName('reset-leaderboard')
        .setDescription('Reset all player data and leaderboard (admin only)'),
      
      new SlashCommandBuilder()
        .setName('addglyphs')
        .setDescription('Add glyphs to a player\'s balance (Admin only)')
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Amount of glyphs to add')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1000000)
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to add glyphs to (defaults to yourself)')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ];
  }
}
