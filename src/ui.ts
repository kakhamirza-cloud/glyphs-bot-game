import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType
} from 'discord.js';
import { Player, LeaderboardEntry } from './types';
import { MiningGame } from './game';

export class GameUI {
  private game: MiningGame;

  constructor(game: MiningGame) {
    this.game = game;
  }

  /**
   * Create the main game embed
   */
  createGameEmbed(player: Player): EmbedBuilder {
    const timeRemaining = this.game.getTimeRemaining(player);
    const cooldownSeconds = Math.ceil(timeRemaining.cooldown / 1000);
    const timeoutSeconds = Math.ceil(timeRemaining.timeout / 1000);
    
    const embed = new EmbedBuilder()
      .setTitle('⛏️ Glyphs Mining Game')
      .setColor(0x9B59B6)
      .setTimestamp()
      .setFooter({ text: 'Dig deeper to find rare minerals!' });

    // Player info
    embed.addFields(
      {
        name: '🎯 Current Tile',
        value: `**${player.currentTile.toLocaleString()}**`,
        inline: true
      },
      {
        name: '💰 Glyphs',
        value: `**${player.glyphs.toLocaleString()}**`,
        inline: true
      },
      {
        name: '📊 Tiles Dug',
        value: `**${player.totalTilesDug.toLocaleString()}**`,
        inline: true
      }
    );

    // Items
    embed.addFields(
      {
        name: '⛏️ Pickaxes',
        value: `**${player.items.pickaxes}**`,
        inline: true
      },
      {
        name: '💥 Dynamites',
        value: `**${player.items.dynamites}**`,
        inline: true
      },
      {
        name: '💣 Explosives',
        value: `**${player.items.explosives}**`,
        inline: true
      }
    );

    // Status with static timer and dig progress
    let statusText = '';
    if (timeoutSeconds > 0) {
      statusText = `⏰ **Timed out for 30 seconds**\n*Use refresh button to check when ready*`;
    } else if (cooldownSeconds > 0) {
      statusText = `⏱️ **Cooldown: 30 seconds**\n*Use refresh button to check when ready*`;
    } else {
      const digsRequired = this.game.getDigsRequired(player.currentTile);
      const digProgress = player.digProgress || 0;
      if (digProgress > 0) {
        statusText = `⛏️ **Digging Progress: ${digProgress}/${digsRequired}**\n*Keep digging to complete this tile!*`;
      } else {
        statusText = '✅ **Ready to dig!**';
      }
    }

    embed.addFields({
      name: '📋 Status',
      value: statusText,
      inline: false
    });

    // Progress bar
    const progress = Math.max(0, Math.min(100, ((3000 - player.currentTile) / 3000) * 100));
    const progressBar = this.createProgressBar(progress);
    embed.addFields({
      name: '📈 Progress',
      value: `${progressBar} **${progress.toFixed(1)}%**`,
      inline: false
    });

    return embed;
  }

  /**
   * Create action buttons
   */
  createActionButtons(player: Player): ActionRowBuilder<ButtonBuilder> {
    const timeRemaining = this.game.getTimeRemaining(player);
    const canDig = timeRemaining.cooldown === 0 && timeRemaining.timeout === 0;
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('dig')
          .setLabel('⛏️ Dig')
          .setStyle(canDig ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(!canDig),
        
        new ButtonBuilder()
          .setCustomId('market')
          .setLabel('🛒 Market')
          .setStyle(ButtonStyle.Success),
        
        new ButtonBuilder()
          .setCustomId('leaderboard')
          .setLabel('🏆 Leaderboard')
          .setStyle(ButtonStyle.Secondary),
        
        new ButtonBuilder()
          .setCustomId('balance')
          .setLabel('💰 Balance')
          .setStyle(ButtonStyle.Secondary),
        
        new ButtonBuilder()
          .setCustomId('refresh')
          .setLabel('🔄 Manual Refresh')
          .setStyle(ButtonStyle.Secondary)
      );

    return row;
  }

  /**
   * Create market embed
   */
  createMarketEmbed(player: Player): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('🛒 Mining Market')
      .setColor(0x2ECC71)
      .setDescription('Purchase items to help you dig faster and deeper!')
      .addFields(
        {
          name: '⛏️ Pickaxe - 500 Glyphs',
          value: 'Instantly dig 1 tile (any depth)',
          inline: true
        },
        {
          name: '💥 Dynamite - 1000 Glyphs',
          value: 'Blow up 3 tiles at once',
          inline: true
        },
        {
          name: '💣 Explosive - 2000 Glyphs',
          value: 'Blow up 5 tiles at once',
          inline: true
        }
      )
      .addFields({
        name: '💰 Your Balance',
        value: `**${player.glyphs.toLocaleString()} Glyphs**`,
        inline: false
      })
      .setFooter({ text: 'Items are automatically used on your next dig!' });

    return embed;
  }

  /**
   * Create market buttons
   */
  createMarketButtons(player: Player): ActionRowBuilder<ButtonBuilder> {
    const canAffordPickaxe = player.glyphs >= 500;
    const canAffordDynamite = player.glyphs >= 1000;
    const canAffordExplosive = player.glyphs >= 2000;

    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('buy_pickaxe')
          .setLabel('Buy Pickaxe (500)')
          .setStyle(canAffordPickaxe ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(!canAffordPickaxe),
        
        new ButtonBuilder()
          .setCustomId('buy_dynamite')
          .setLabel('Buy Dynamite (1000)')
          .setStyle(canAffordDynamite ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(!canAffordDynamite),
        
        new ButtonBuilder()
          .setCustomId('buy_explosive')
          .setLabel('Buy Explosive (2000)')
          .setStyle(canAffordExplosive ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(!canAffordExplosive),
        
        new ButtonBuilder()
          .setCustomId('back_to_game')
          .setLabel('← Back to Game')
          .setStyle(ButtonStyle.Secondary)
      );
  }

  /**
   * Create leaderboard embed
   */
  createLeaderboardEmbed(leaderboard: LeaderboardEntry[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('🏆 Mining Leaderboard')
      .setColor(0xFFD700)
      .setDescription('Top miners by tiles dug!')
      .setTimestamp();

    if (leaderboard.length === 0) {
      embed.addFields({
        name: 'No players yet!',
        value: 'Start digging to appear on the leaderboard!',
        inline: false
      });
    } else {
      const leaderboardText = leaderboard
        .map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          return `${medal} **${entry.username}**\n` +
                 `   Tiles: ${entry.tilesDug.toLocaleString()} | ` +
                 `Depth: ${(3000 - entry.currentTile).toLocaleString()} | ` +
                 `Glyphs: ${entry.glyphs.toLocaleString()}`;
        })
        .join('\n\n');

      embed.addFields({
        name: 'Top Miners',
        value: leaderboardText,
        inline: false
      });
    }

    return embed;
  }

  /**
   * Create balance embed
   */
  createBalanceEmbed(player: Player): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('💰 Your Balance')
      .setColor(0x3498DB)
      .addFields(
        {
          name: '💎 Glyphs',
          value: `**${player.glyphs.toLocaleString()}**`,
          inline: true
        },
        {
          name: '📊 Total Tiles Dug',
          value: `**${player.totalTilesDug.toLocaleString()}**`,
          inline: true
        },
        {
          name: '🎯 Current Depth',
          value: `**${(3000 - player.currentTile).toLocaleString()}** tiles deep`,
          inline: true
        }
      )
      .setTimestamp();

    return embed;
  }

  /**
   * Create dig result embed
   */
  createDigResultEmbed(result: any, player: Player): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('⛏️ Dig Result')
      .setColor(result.success ? 0x2ECC71 : 0xE74C3C)
      .setDescription(result.message)
      .setTimestamp();

    if (result.success) {
      embed.addFields(
        {
          name: '💰 Glyphs Earned',
          value: `**+${result.glyphsEarned.toLocaleString()}**`,
          inline: true
        },
        {
          name: '🎯 New Tile',
          value: `**${result.newTile.toLocaleString()}**`,
          inline: true
        },
        {
          name: '💎 Total Glyphs',
          value: `**${player.glyphs.toLocaleString()}**`,
          inline: true
        }
      );
    }

    return embed;
  }

  /**
   * Create welcome embed
   */
  createWelcomeEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('🎉 Welcome to Glyphs Mining Game!')
      .setColor(0x9B59B6)
      .setDescription('Welcome to the deepest mining adventure!')
      .addFields(
        {
          name: '🎯 Goal',
          value: 'Dig from tile 3,000 down to tile 0!',
          inline: false
        },
        {
          name: '⛏️ How to Play',
          value: 'Click the **Dig** button every 30 seconds to mine tiles and find minerals!',
          inline: false
        },
        {
          name: '💎 Minerals',
          value: 'Find rare minerals like Coal (10), Gold (50), Diamond (200), and Mythril (500)!',
          inline: false
        },
        {
          name: '💥 Zonks',
          value: 'Watch out for Zonks on any tile! They can reduce your progress or glyphs!',
          inline: false
        },
        {
          name: '🛒 Market',
          value: 'Buy pickaxes, dynamites, and explosives to dig faster!',
          inline: false
        },
        {
          name: '🏆 Competition',
          value: 'First player to reach tile 0 wins!',
          inline: false
        }
      )
      .setFooter({ text: 'Use /help for more information!' });
  }

  /**
   * Create help embed
   */
  createHelpEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('❓ Mining Game Help')
      .setColor(0x3498DB)
      .addFields(
        {
          name: '🎮 Commands',
          value: '• `/help` - Show this help message\n• `/start` - Start the mining game\n• `/balance` - Check your balance\n• `/leaderboard` - View top players\n• `/reset` - Reset all your progress\n• `/reset-leaderboard` - Reset all player data (admin)',
          inline: false
        },
        {
          name: '⛏️ Game Mechanics',
          value: '• Dig every 30 seconds\n• Deeper tiles require more effort\n• Find minerals for glyphs\n• Watch out for Zonks!',
          inline: false
        },
        {
          name: '🛒 Items',
          value: '• **Pickaxe** (500): Dig 1 tile instantly\n• **Dynamite** (1000): Blow 3 tiles\n• **Explosive** (2000): Blow 5 tiles',
          inline: false
        },
        {
          name: '💥 Zonks',
          value: '• Random events on any tile\n• Can lose glyphs, reduce progress, or timeout\n• 10% chance of occurring',
          inline: false
        }
      )
      .setFooter({ text: 'Good luck mining!' });
  }

  /**
   * Create progress bar
   */
  private createProgressBar(percentage: number, length: number = 20): string {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const filled = Math.round((clampedPercentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}
