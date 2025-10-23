export interface Player {
  id: string;
  username: string;
  currentTile: number;
  glyphs: number;
  items: PlayerItems;
  lastDigTime: number;
  timeoutUntil: number;
  totalTilesDug: number;
  privateThreadId?: string; // Store the private thread ID for this player
  digProgress: number; // Track progress on current tile (0 to digsRequired-1)
}

export interface PlayerItems {
  pickaxes: number;
  dynamites: number;
  explosives: number;
}

export interface Mineral {
  name: string;
  reward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface ZonkEffect {
  type: 'lose_glyphs' | 'reduce_tiles' | 'timeout';
  value: number;
}

export interface DigResult {
  success: boolean;
  mineral?: Mineral;
  glyphsEarned: number;
  zonkEffect?: ZonkEffect;
  newTile: number;
  message: string;
  specialReward?: SpecialReward;
}

export interface SpecialReward {
  type: 'discord_nitro' | 'cash_10' | 'discord_classic';
  name: string;
  description: string;
  value: string;
}

export interface GameStats {
  totalPlayers: number;
  totalTilesDug: number;
  averageDepth: number;
}

export interface LeaderboardEntry {
  playerId: string;
  username: string;
  tilesDug: number;
  currentTile: number;
  glyphs: number;
}
