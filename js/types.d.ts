/**
 * DEAD SHIFT - TypeScript Definitions & Interfaces
 */

export interface SaveSettings {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    autoFire: boolean;
    autoAim: boolean;
    showDamageNumbers: boolean;
    bloodToggle: boolean;
    screenShake: boolean;
    highContrast: boolean;
    colorblind: boolean;
    reduceMotion: boolean;
}

export interface SaveStats {
    totalKills: number;
    bossKills: number;
    runsPlayed: number;
    runsWon: number;
    totalCoinsEarned: number;
    highScore: number;
}

export interface SaveData {
    coins: number;
    keys: number;
    tokens: number;
    unlockedCharacters: string[];
    unlockedWeapons: string[];
    unlockedMaps: string[];
    purchasedPassives: Record<string, number>;
    settings: SaveSettings;
    stats: SaveStats;
    achievements: string[];
}

export interface CharacterClassDef {
    id: string;
    name: string;
    desc: string;
    icon: string;
    hpMod: number;
    armorMod: number;
    moveMod: number;
}

export interface WeaponDef {
    id: string;
    name: string;
    category: string;
    rarity: string;
    damage: number;
    fireRate: number;
    clipSize: number;
    reloadTime: number;
    projSpeed?: number;
    spread?: number;
    projCount?: number;
    pierce?: number;
    ricochet?: number;
    knockback?: number;
    element?: string | null;
    isExplosive?: boolean;
    explosionRadius?: number;
    length?: number;
    width?: number;
    color?: string;
    audioType?: string;
}

export interface EnemyDef {
    id: string;
    name: string;
    health: number;
    speed: number;
    damage: number;
    xpValue: number;
    color?: string;
    radius?: number;
    isElite?: boolean;
    isFlying?: boolean;
    isBomber?: boolean;
    isSpitter?: boolean;
    coinDropChance?: number;
}

export interface BossDef {
    id: string;
    name: string;
    health: number;
    speed: number;
    radius?: number;
}

export interface MapDef {
    id: string;
    name: string;
    width?: number;
    height?: number;
    bgColor?: string;
    gridColor?: string;
    obstacles?: Array<{ x: number; y: number; w: number; h: number }>;
}
