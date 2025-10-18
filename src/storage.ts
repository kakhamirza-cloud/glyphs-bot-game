import { Player, LeaderboardEntry } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class GameStorage {
  private readonly dataPath: string;
  private readonly playersFile: string;
  private players: Map<string, Player> = new Map();

  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data');
    this.playersFile = path.join(this.dataPath, 'players.json');
    this.ensureDataDirectory();
    this.loadPlayers();
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
        privateThreadId: undefined
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
        
        this.savePlayer(player);
        console.log(`Player ${userId} data has been reset`);
      }
    } catch (error) {
      console.error('Error resetting player data:', error);
    }
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
