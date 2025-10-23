import { Player, Mineral, ZonkEffect, LuckyTileEffect, DigResult, PlayerItems, SpecialReward } from './types';

export class MiningGame {
  private readonly MINERALS: Mineral[] = [
    { name: 'Coal', reward: 10, rarity: 'common' },
    { name: 'Iron', reward: 20, rarity: 'common' },
    { name: 'Copper', reward: 30, rarity: 'uncommon' },
    { name: 'Silver', reward: 40, rarity: 'uncommon' },
    { name: 'Gold', reward: 50, rarity: 'rare' },
    { name: 'Platinum', reward: 100, rarity: 'rare' },
    { name: 'Diamond', reward: 200, rarity: 'epic' },
    { name: 'Mythril', reward: 500, rarity: 'legendary' }
  ];

  private readonly ZONK_CHANCE = 0.10; // 10% chance
  private readonly LUCKY_TILE_CHANCE = 0.08; // 8% chance
  private readonly DIG_COOLDOWN = 30000; // 30 seconds
  private readonly TIMEOUT_DURATION = 30000; // 30 seconds

  /**
   * Calculate the number of digs needed for a tile based on depth
   * Deeper tiles require more digs (1x, 2x, 3x, etc.)
   */
  getDigsRequired(tile: number): number {
    if (tile > 1800) return 1;  // Tiles 2000-1801: 1 dig
    if (tile > 1400) return 2;  // Tiles 1800-1401: 2 digs
    if (tile > 1000) return 3;  // Tiles 1400-1001: 3 digs
    if (tile > 600) return 4;   // Tiles 1000-601: 4 digs
    if (tile > 200) return 5;   // Tiles 600-201: 5 digs
    return 6; // Tiles 200-0: 6 digs (deepest)
  }

  /**
   * Get a random mineral based on depth and rarity
   */
  private getRandomMineral(tile: number): Mineral {
    const depthFactor = Math.max(0, (2000 - tile) / 2000);
    
    // Deeper tiles have better chances for rare minerals
    const rarityRoll = Math.random();
    let selectedRarity: Mineral['rarity'];
    
    if (depthFactor > 0.8 && rarityRoll < 0.05) {
      selectedRarity = 'legendary';
    } else if (depthFactor > 0.6 && rarityRoll < 0.15) {
      selectedRarity = 'epic';
    } else if (depthFactor > 0.4 && rarityRoll < 0.35) {
      selectedRarity = 'rare';
    } else if (depthFactor > 0.2 && rarityRoll < 0.65) {
      selectedRarity = 'uncommon';
    } else {
      selectedRarity = 'common';
    }
    
    const availableMinerals = this.MINERALS.filter(m => m.rarity === selectedRarity);
    return availableMinerals[Math.floor(Math.random() * availableMinerals.length)];
  }

  /**
   * Check if a Zonk event should occur
   */
  private shouldTriggerZonk(tile: number): boolean {
    console.log(`🔍 Checking zonk for tile ${tile}: 10% chance`);
    const zonkRoll = Math.random();
    const willTrigger = zonkRoll < this.ZONK_CHANCE;
    console.log(`🎲 Zonk roll: ${zonkRoll.toFixed(3)} < ${this.ZONK_CHANCE} = ${willTrigger}`);
    return willTrigger;
  }

  /**
   * Check if a Lucky Tile event should occur
   */
  private shouldTriggerLuckyTile(tile: number): boolean {
    console.log(`🍀 Checking lucky tile for tile ${tile}: 8% chance`);
    const luckyRoll = Math.random();
    const willTrigger = luckyRoll < this.LUCKY_TILE_CHANCE;
    console.log(`🎲 Lucky tile roll: ${luckyRoll.toFixed(3)} < ${this.LUCKY_TILE_CHANCE} = ${willTrigger}`);
    return willTrigger;
  }

  /**
   * Generate a Lucky Tile effect
   */
  private generateLuckyTileEffect(): LuckyTileEffect {
    const rewardTypes: LuckyTileEffect['rewardType'][] = ['explosives', 'tiles', 'glyphs'];
    const randomRewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    
    return {
      type: 'lucky_tile',
      rewardType: randomRewardType,
      explosivesAdded: randomRewardType === 'explosives' ? 5 : 0,
      tilesDug: randomRewardType === 'tiles' ? 5 : 0,
      glyphsAdded: randomRewardType === 'glyphs' ? 2000 : 0
    };
  }

  /**
   * Generate a random Zonk effect
   */
  private generateZonkEffect(): ZonkEffect {
    const effectTypes: ZonkEffect['type'][] = ['lose_glyphs', 'reduce_tiles', 'timeout'];
    const randomType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
    
    switch (randomType) {
      case 'lose_glyphs':
        return { type: 'lose_glyphs', value: Math.floor(Math.random() * 151) + 50 }; // 50-200
      case 'reduce_tiles':
        return { type: 'reduce_tiles', value: Math.floor(Math.random() * 5) + 1 }; // 1-5
      case 'timeout':
        return { type: 'timeout', value: this.TIMEOUT_DURATION };
      default:
        return { type: 'lose_glyphs', value: 100 };
    }
  }

  /**
   * Check if player can dig (cooldown and timeout checks)
   */
  canDig(player: Player): { canDig: boolean; reason?: string; timeLeft?: number } {
    const now = Date.now();
    
    // Check timeout
    if (player.timeoutUntil > now) {
      return {
        canDig: false,
        reason: 'timeout',
        timeLeft: player.timeoutUntil - now
      };
    }
    
    // Check cooldown
    const timeSinceLastDig = now - player.lastDigTime;
    if (timeSinceLastDig < this.DIG_COOLDOWN) {
      return {
        canDig: false,
        reason: 'cooldown',
        timeLeft: this.DIG_COOLDOWN - timeSinceLastDig
      };
    }
    
    return { canDig: true };
  }

  /**
   * Process a dig action for a player
   */
  dig(player: Player, useItem?: keyof PlayerItems, checkSpecialReward?: (tile: number) => SpecialReward | null): DigResult {
    const canDigResult = this.canDig(player);
    if (!canDigResult.canDig) {
      const timeLeft = Math.ceil((canDigResult.timeLeft || 0) / 1000);
      return {
        success: false,
        glyphsEarned: 0,
        newTile: player.currentTile,
        message: canDigResult.reason === 'timeout' 
          ? `⏰ You're timed out! Wait ${timeLeft}s`
          : `⏱️ Cooldown active! Wait ${timeLeft}s`
      };
    }

    // Check if player has reached the end
    if (player.currentTile <= 0) {
      return {
        success: false,
        glyphsEarned: 0,
        newTile: 0,
        message: '🎉 Congratulations! You\'ve reached the deepest point!'
      };
    }

    let newTile = player.currentTile;
    let glyphsEarned = 0;
    let message = '';
    let zonkEffect: ZonkEffect | undefined;
    let luckyTileEffect: LuckyTileEffect | undefined;
    let specialReward: SpecialReward | undefined;

    // Handle item usage
    if (useItem && player.items[useItem] > 0) {
      player.items[useItem]--;
      
      switch (useItem) {
        case 'pickaxes':
          newTile = Math.max(0, newTile - 1);
          glyphsEarned = this.getRandomMineral(newTile).reward;
          message = `⛏️ Pickaxe used! Found ${this.getRandomMineral(newTile).name} (+${glyphsEarned} glyphs)`;
          break;
        case 'dynamites':
          newTile = Math.max(0, newTile - 3);
          for (let i = 0; i < 3; i++) {
            glyphsEarned += this.getRandomMineral(newTile + i).reward;
          }
          message = `💥 Dynamite used! Blew 3 tiles (+${glyphsEarned} glyphs)`;
          break;
        case 'explosives':
          newTile = Math.max(0, newTile - 5);
          for (let i = 0; i < 5; i++) {
            glyphsEarned += this.getRandomMineral(newTile + i).reward;
          }
          message = `💣 Explosive used! Blew 5 tiles (+${glyphsEarned} glyphs)`;
          break;
      }
    } else {
      // Normal digging with dig counter system
      const digsRequired = this.getDigsRequired(player.currentTile);
      
      // Initialize digProgress if not set
      if (player.digProgress === undefined) {
        player.digProgress = 0;
      }
      
      // Increment dig progress
      player.digProgress++;
      
      if (player.digProgress >= digsRequired) {
        // Tile is fully dug, move to next tile
        newTile = Math.max(0, player.currentTile - 1);
        player.digProgress = 0; // Reset progress for new tile
        
        const mineral = this.getRandomMineral(newTile);
        glyphsEarned = mineral.reward;
        
        message = `⛏️ Tile completed! Moved to tile ${newTile} - Found ${mineral.name} (+${glyphsEarned} glyphs)`;
      } else {
        // Still digging current tile
        newTile = player.currentTile; // Stay on same tile
        glyphsEarned = 0; // No reward until tile is complete
        
        message = `⛏️ Digging... (${player.digProgress}/${digsRequired}) - Keep digging to complete this tile!`;
      }
    }

    // Check for Zonk
    if (this.shouldTriggerZonk(player.currentTile)) {
      zonkEffect = this.generateZonkEffect();
      
      switch (zonkEffect.type) {
        case 'lose_glyphs':
          glyphsEarned = Math.max(0, glyphsEarned - zonkEffect.value);
          message += `\n💥 ZONK! Lost ${zonkEffect.value} glyphs!`;
          break;
        case 'reduce_tiles':
          newTile = Math.min(2000, newTile + zonkEffect.value);
          message += `\n💥 ZONK! Moved back ${zonkEffect.value} tiles!`;
          break;
        case 'timeout':
          player.timeoutUntil = Date.now() + zonkEffect.value;
          message += `\n💥 ZONK! Timed out for 30 seconds!`;
          break;
      }
    }

    // Check for Lucky Tile (independent of Zonks)
    if (this.shouldTriggerLuckyTile(player.currentTile)) {
      luckyTileEffect = this.generateLuckyTileEffect();
      
      // Apply the specific reward based on type
      switch (luckyTileEffect.rewardType) {
        case 'explosives':
          player.items.explosives += luckyTileEffect.explosivesAdded;
          message += `\n🍀 LUCKY TILE! Found ${luckyTileEffect.explosivesAdded} explosives!`;
          break;
        case 'tiles':
          newTile = Math.max(0, newTile - luckyTileEffect.tilesDug);
          player.digProgress = 0; // Reset dig progress for new tile
          message += `\n🍀 LUCKY TILE! Dug ${luckyTileEffect.tilesDug} tiles instantly!`;
          break;
        case 'glyphs':
          glyphsEarned += luckyTileEffect.glyphsAdded;
          message += `\n🍀 LUCKY TILE! Found ${luckyTileEffect.glyphsAdded} bonus glyphs!`;
          break;
      }
    }

    // Check for special reward if callback is provided
    if (checkSpecialReward && newTile !== player.currentTile) {
      const foundReward = checkSpecialReward(newTile);
      if (foundReward) {
        specialReward = foundReward;
        message += `\n🎁 SPECIAL REWARD FOUND! ${specialReward.name} (${specialReward.value})!`;
      }
    }

    // Update player stats
    player.currentTile = newTile;
    player.glyphs += glyphsEarned;
    player.lastDigTime = Date.now();
    player.totalTilesDug++;

    return {
      success: true,
      mineral: this.getRandomMineral(newTile),
      glyphsEarned,
      zonkEffect,
      luckyTileEffect,
      newTile,
      message,
      specialReward
    };
  }

  /**
   * Get time remaining for cooldown/timeout
   */
  getTimeRemaining(player: Player): { cooldown: number; timeout: number } {
    const now = Date.now();
    const cooldown = Math.max(0, this.DIG_COOLDOWN - (now - player.lastDigTime));
    const timeout = Math.max(0, player.timeoutUntil - now);
    
    return { cooldown, timeout };
  }

  /**
   * Create a new player
   */
  createPlayer(userId: string, username: string): Player {
    return {
      id: userId,
      username,
      currentTile: 2000,
      glyphs: 0,
      items: { pickaxes: 0, dynamites: 0, explosives: 0 },
      lastDigTime: 0,
      timeoutUntil: 0,
      totalTilesDug: 0,
      digProgress: 0
    };
  }
}
