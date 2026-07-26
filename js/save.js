/**
 * DEAD SHIFT - LocalStorage Save Manager
 */
const SAVE_KEY = 'DEAD_SHIFT_SAVE_V1';

const defaultSaveData = {
    coins: 0,
    keys: 0,
    tokens: 0,
    unlockedCharacters: ['commando'],
    unlockedWeapons: ['pistol_m1911', 'shotgun_pump', 'smg_vector'],
    unlockedMaps: ['downtown', 'hospital'],
    purchasedPassives: {
        maxHealth: 0,
        armor: 0,
        moveSpeed: 0,
        damage: 0,
        critChance: 0,
        pickupRadius: 0,
        xpGain: 0,
        coinsGain: 0
    },
    settings: {
        masterVolume: 80,
        sfxVolume: 80,
        musicVolume: 60,
        autoFire: false,
        autoAim: false,
        showDamageNumbers: true,
        bloodToggle: true,
        screenShake: true,
        highContrast: false,
        colorblind: false,
        reduceMotion: false
    },
    stats: {
        totalKills: 0,
        bossKills: 0,
        runsPlayed: 0,
        runsWon: 0,
        totalCoinsEarned: 0,
        highScore: 0
    },
    achievements: []
};

class SaveManager {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(defaultSaveData));
            const parsed = JSON.parse(raw);
            return {
                ...defaultSaveData,
                ...parsed,
                purchasedPassives: { ...defaultSaveData.purchasedPassives, ...(parsed.purchasedPassives || {}) },
                settings: { ...defaultSaveData.settings, ...(parsed.settings || {}) },
                stats: { ...defaultSaveData.stats, ...(parsed.stats || {}) }
            };
        } catch (e) {
            console.error('Failed to load save data from LocalStorage:', e);
            return JSON.parse(JSON.stringify(defaultSaveData));
        }
    }

    saveData() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to write save data to LocalStorage:', e);
        }
    }

    resetData() {
        this.data = JSON.parse(JSON.stringify(defaultSaveData));
        this.saveData();
    }

    updateSetting(key, value) {
        this.data.settings[key] = value;
        this.saveData();
    }

    addCoins(amount) {
        this.data.coins += amount;
        this.data.stats.totalCoinsEarned += amount;
        this.saveData();
    }

    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.saveData();
            return true;
        }
        return false;
    }

    unlockCharacter(charId) {
        if (!this.data.unlockedCharacters.includes(charId)) {
            this.data.unlockedCharacters.push(charId);
            this.saveData();
        }
    }

    unlockWeapon(weaponId) {
        if (!this.data.unlockedWeapons.includes(weaponId)) {
            this.data.unlockedWeapons.push(weaponId);
            this.saveData();
        }
    }
}

export const saveManager = new SaveManager();
