import { Player, LeaderboardEntry, SpecialReward } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class GameStorage {
  private readonly dataPath: string;
  private readonly playersFile: string;
  private readonly specialRewardsFile: string;
  private players: Map<string, Player> = new Map();
  private specialRewards: Map<string, { tile: number; claimedBy?: string; claimedAt?: string }> = new Map();

  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data');
    this.playersFile = path.join(this.dataPath, 'players.json');
    this.specialRewardsFile = path.join(this.dataPath, 'special-rewards.json');
    this.ensureDataDirectory();
    this.loadPlayers();
    this.loadSpecialRewards();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadPlayers(): void {
    try {
      if (fs.existsSync(this.playersFile)) {
        const data = fs.readFileSync(this.playersFile, 'utf8');
        const playersData = JSON.parse(data);
        
        // Convert array back to Map
        this.players = new Map(playersData);
        console.log(`Loaded ${this.players.size} players from storage`);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      this.players = new Map();
    }
  }

  private loadSpecialRewards(): void {
    try {
      if (fs.existsSync(this.specialRewardsFile)) {
        const data = fs.readFileSync(this.specialRewardsFile, 'utf8');
        const rewardsData = JSON.parse(data);
        
        // Convert array back to Map
        this.specialRewards = new Map(rewardsData);
        console.log(`Loaded ${this.specialRewards.size} special rewards from storage`);
      } else {
        // Initialize special rewards if file doesn't exist
        this.initializeSpecialRewards();
      }
    } catch (error) {
      console.error('Error loading special rewards:', error);
      this.specialRewards = new Map();
      this.initializeSpecialRewards();
    }
  }

  private initializeSpecialRewards(): void {
    // Generate random tiles for each reward (adjusted for 2000 starting tile)
    const nitroTile = Math.floor(Math.random() * 1001) + 1000; // 1000-2000
    const cashTile = Math.floor(Math.random() * 501) + 1000;   // 1000-1500
    const classicTile = Math.floor(Math.random() * 101) + 2000; // 2000-2100

    this.specialRewards.set('discord_nitro', { tile: nitroTile });
    this.specialRewards.set('cash_10', { tile: cashTile });
    this.specialRewards.set('discord_classic', { tile: classicTile });

    this.saveSpecialRewards();
    console.log('Special rewards initialized:', {
      nitro: nitroTile,
      cash: cashTile,
      classic: classicTile
    });
  }

  private saveSpecialRewards(): void {
    try {
      // Convert Map to array for JSON serialization
      const rewardsArray = Array.from(this.specialRewards.entries());
      fs.writeFileSync(this.specialRewardsFile, JSON.stringify(rewardsArray, null, 2));
    } catch (error) {
      console.error('Error saving special rewards:', error);
    }
  }

  private savePlayers(): void {
    try {
      // Convert Map to array for JSON serialization
      const playersArray = Array.from(this.players.entries());
      fs.writeFileSync(this.playersFile, JSON.stringify(playersArray, null, 2));
    } catch (error) {
      console.error('Error saving players:', error);
    }
  }

  /**
   * Get a player by ID
   */
  getPlayer(userId: string): Player | undefined {
    // Reload data from file to ensure we have the latest data
    this.reloadPlayerData(userId);
    return this.players.get(userId);
  }

  /**
   * Save or update a player
   */
  savePlayer(player: Player): void {
    this.players.set(player.id, player);
    this.savePlayers();
  }

  /**
   * Update player's private thread ID
   */
  updatePlayerThreadId(userId: string, threadId: string): void {
    const player = this.players.get(userId);
    if (player) {
      player.privateThreadId = threadId;
      this.savePlayer(player);
    }
  }

  /**
   * Create a new player if they don't exist
   */
  getOrCreatePlayer(userId: string, username: string): Player {
    // Reload data from file to ensure we have the latest data
    this.reloadPlayerData(userId);
    
    let player = this.players.get(userId);
    if (!player) {
      player = {
        id: userId,
        username,
        currentTile: 2000,
        glyphs: 0,
        items: { pickaxes: 0, dynamites: 0, explosives: 0 },
        lastDigTime: 0,
        timeoutUntil: 0,
        totalTilesDug: 0,
        privateThreadId: undefined,
        digProgress: 0
      };
      this.savePlayer(player);
    } else {
      // Update username in case it changed
      player.username = username;
    }
    return player;
  }

  /**
   * Reload player data from file for a specific user
   */
  private reloadPlayerData(userId: string): void {
    try {
      if (fs.existsSync(this.playersFile)) {
        const data = fs.readFileSync(this.playersFile, 'utf8');
        const playersData = JSON.parse(data);
        
        // Find the specific player in the loaded data
        const playerEntry = playersData.find(([id]: [string, Player]) => id === userId);
        if (playerEntry) {
          const [, playerData] = playerEntry;
          // Migrate old players to include digProgress
          if (playerData.digProgress === undefined) {
            playerData.digProgress = 0;
          }
          this.players.set(userId, playerData);
        }
      }
    } catch (error) {
      console.error('Error reloading player data:', error);
    }
  }

  /**
   * Get all players
   */
  getAllPlayers(): Player[] {
    // Reload all data from file to ensure we have the latest data
    this.loadPlayers();
    return Array.from(this.players.values());
  }

  /**
   * Get leaderboard (top players by tiles dug)
   */
  getLeaderboard(limit: number = 10): LeaderboardEntry[] {
    const players = this.getAllPlayers();
    
    return players
      .sort((a, b) => b.totalTilesDug - a.totalTilesDug)
      .slice(0, limit)
      .map(player => ({
        playerId: player.id,
        username: player.username,
        tilesDug: player.totalTilesDug,
        currentTile: player.currentTile,
        glyphs: player.glyphs
      }));
  }

  /**
   * Get game statistics
   */
  getGameStats() {
    const players = this.getAllPlayers();
    const totalTilesDug = players.reduce((sum, player) => sum + player.totalTilesDug, 0);
    const averageDepth = players.length > 0 
      ? players.reduce((sum, player) => sum + (2000 - player.currentTile), 0) / players.length 
      : 0;

    return {
      totalPlayers: players.length,
      totalTilesDug,
      averageDepth: Math.round(averageDepth)
    };
  }

  /**
   * Check if any player has reached tile 0
   */
  checkForWinner(): Player | null {
    const players = this.getAllPlayers();
    return players.find(player => player.currentTile <= 0) || null;
  }

  /**
   * Reset all player data (for leaderboard reset)
   */
  resetAllPlayers(): void {
    try {
      // Create backup before reset
      this.backup();
      
      // Clear all players
      this.players.clear();
      
      // Save empty data
      this.savePlayers();
      
      console.log('All player data has been reset');
    } catch (error) {
      console.error('Error resetting player data:', error);
    }
  }

  /**
   * Reset a specific player's data
   */
  resetPlayer(userId: string): void {
    try {
      const player = this.players.get(userId);
      if (player) {
        // Reset player to starting state
        player.currentTile = 2000;
        player.glyphs = 0;
        player.items = { pickaxes: 0, dynamites: 0, explosives: 0 };
        player.lastDigTime = 0;
        player.timeoutUntil = 0;
        player.totalTilesDug = 0;
        player.digProgress = 0;
        
        this.savePlayer(player);
        console.log(`Player ${userId} data has been reset`);
      }
    } catch (error) {
      console.error('Error resetting player data:', error);
    }
  }

  /**
   * Check if a tile contains a special reward
   */
  checkSpecialReward(tile: number): SpecialReward | null {
    for (const [rewardType, rewardData] of this.specialRewards.entries()) {
      if (rewardData.tile === tile && !rewardData.claimedBy) {
        const rewardMap = {
          'discord_nitro': {
            type: 'discord_nitro' as const,
            name: 'Discord Nitro',
            description: '1 Month Discord Nitro Subscription',
            value: '$9.99 value'
          },
          'cash_10': {
            type: 'cash_10' as const,
            name: '$10 Cash Reward',
            description: 'Real money reward',
            value: '$10 USD'
          },
          'discord_classic': {
            type: 'discord_classic' as const,
            name: 'Discord Classic',
            description: 'Discord Classic Subscription',
            value: '$4.99 value'
          }
        };
        return rewardMap[rewardType as keyof typeof rewardMap];
      }
    }
    return null;
  }

  /**
   * Claim a special reward
   */
  claimSpecialReward(tile: number, userId: string, username: string): SpecialReward | null {
    for (const [rewardType, rewardData] of this.specialRewards.entries()) {
      if (rewardData.tile === tile && !rewardData.claimedBy) {
        // Mark as claimed
        rewardData.claimedBy = userId;
        rewardData.claimedAt = new Date().toISOString();
        this.saveSpecialRewards();

        const rewardMap = {
          'discord_nitro': {
            type: 'discord_nitro' as const,
            name: 'Discord Nitro',
            description: '1 Month Discord Nitro Subscription',
            value: '$9.99 value'
          },
          'cash_10': {
            type: 'cash_10' as const,
            name: '$10 Cash Reward',
            description: 'Real money reward',
            value: '$10 USD'
          },
          'discord_classic': {
            type: 'discord_classic' as const,
            name: 'Discord Classic',
            description: 'Discord Classic Subscription',
            value: '$4.99 value'
          }
        };
        
        console.log(`Special reward claimed: ${rewardType} by ${username} (${userId}) at tile ${tile}`);
        return rewardMap[rewardType as keyof typeof rewardMap];
      }
    }
    return null;
  }

  /**
   * Get special rewards status
   */
  getSpecialRewardsStatus(): { [key: string]: { tile: number; claimed: boolean; claimedBy?: string; claimedAt?: string } } {
    const status: { [key: string]: { tile: number; claimed: boolean; claimedBy?: string; claimedAt?: string } } = {};
    
    for (const [rewardType, rewardData] of this.specialRewards.entries()) {
      status[rewardType] = {
        tile: rewardData.tile,
        claimed: !!rewardData.claimedBy,
        claimedBy: rewardData.claimedBy,
        claimedAt: rewardData.claimedAt
      };
    }
    
    return status;
  }

  /**
   * Export all data
   */
  exportAllData(): any {
    return {
      players: Array.from(this.players.entries()),
      specialRewards: Array.from(this.specialRewards.entries()),
      gameStats: this.getGameStats(),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Backup data
   */
  backup(): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.dataPath, `backup-${timestamp}.json`);
      const playersArray = Array.from(this.players.entries());
      fs.writeFileSync(backupFile, JSON.stringify(playersArray, null, 2));
      console.log(`Backup created: ${backupFile}`);
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }
}
