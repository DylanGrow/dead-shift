/**
 * DEAD SHIFT - UI & HUD Manager
 */
import { saveManager } from './save.js';
import { PerkManager } from './perks.js';

export class UIManager {
    constructor() {
        this.floatingTextPool = [];
    }

    static spawnFloatingText(x, y, text, color = '#ffffff', isCrit = false) {
        const s = saveManager.data.settings;
        if (!s.showDamageNumbers) return;

        const el = document.createElement('div');
        el.className = `floating-dmg ${isCrit ? 'crit' : ''}`;
        el.innerText = text;
        el.style.color = color;
        el.style.position = 'absolute';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.pointerEvents = 'none';
        el.style.fontWeight = '900';
        el.style.fontSize = isCrit ? '1.4rem' : '1.0rem';
        el.style.zIndex = '50';
        el.style.textShadow = '0 2px 4px #000';
        el.style.transition = 'all 0.6s ease-out';

        document.getElementById('uiContainer').appendChild(el);

        setTimeout(() => {
            el.style.transform = 'translateY(-30px) scale(1.2)';
            el.style.opacity = '0';
        }, 20);

        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 650);
    }

    updateHUD(player, wave, waveTimer, fps, dps, activeEvent = null, boss = null) {
        // Health & Shield Bars
        const hpBar = document.getElementById('hudHealthBar');
        const shBar = document.getElementById('hudShieldBar');
        const hpText = document.getElementById('hudHealthText');

        const hpPct = Math.max(0, (player.health / player.maxHealth) * 100);
        hpBar.style.width = `${hpPct}%`;

        if (player.maxShield > 0) {
            const shPct = Math.max(0, (player.shield / player.maxShield) * 100);
            shBar.style.width = `${shPct}%`;
        } else {
            shBar.style.width = '0%';
        }
        hpText.innerText = `${Math.ceil(player.health)} / ${player.maxHealth}`;

        // Stamina Bar
        const stBar = document.getElementById('hudStaminaBar');
        stBar.style.width = `${(player.stamina / player.maxStamina) * 100}%`;

        // XP Bar & Level Badge
        const xpFill = document.getElementById('hudXPFill');
        const lvlBadge = document.getElementById('hudLevelBadge');
        xpFill.style.width = `${(player.xp / player.nextLevelXP) * 100}%`;
        lvlBadge.innerText = `LVL ${player.level}`;

        // Wave & Timer
        document.getElementById('hudWaveTitle').innerText = `WAVE ${wave}`;
        const mins = Math.floor(waveTimer / 60).toString().padStart(2, '0');
        const secs = Math.floor(waveTimer % 60).toString().padStart(2, '0');
        document.getElementById('hudWaveTimer').innerText = `${mins}:${secs}`;

        // Currencies & FPS
        document.getElementById('hudCoins').innerText = player.coins;
        document.getElementById('hudKeys').innerText = player.keys;
        document.getElementById('hudTokens').innerText = player.tokens;
        document.getElementById('hudFPS').innerText = `${Math.round(fps)} FPS`;
        document.getElementById('hudDPS').innerText = `${Math.round(dps)} DPS`;

        // Weapon Display
        const activeWep = player.getActiveWeapon();
        if (activeWep) {
            document.getElementById('hudWeaponName').innerText = activeWep.name;
            document.getElementById('hudWeaponRarity').innerText = activeWep.rarity.toUpperCase();
            document.getElementById('hudAmmoCurrent').innerText = activeWep.isReloading ? 'RELOADING' : activeWep.ammo;
            document.getElementById('hudAmmoMax').innerText = activeWep.clipSize;
        }

        // Active Event Banner
        const eventBanner = document.getElementById('hudEventBanner');
        if (activeEvent) {
            eventBanner.classList.remove('hidden');
            document.getElementById('hudEventIcon').innerText = activeEvent.icon;
            document.getElementById('hudEventTitle').innerText = activeEvent.title;
        } else {
            eventBanner.classList.add('hidden');
        }

        // Boss Bar
        const bossContainer = document.getElementById('hudBossContainer');
        if (boss && boss.health > 0) {
            bossContainer.classList.remove('hidden');
            document.getElementById('hudBossName').innerText = boss.name;
            const bossHpPct = Math.max(0, (boss.health / boss.maxHealth) * 100);
            document.getElementById('hudBossHealthBar').style.width = `${bossHpPct}%`;
        } else {
            bossContainer.classList.add('hidden');
        }
    }

    renderPerkModal(player, onSelectCallback) {
        const perkModal = document.getElementById('perkModal');
        const container = document.getElementById('perkCardsContainer');
        perkModal.classList.remove('hidden');

        const perks = PerkManager.getRandomPerks(3);
        let html = '';
        perks.forEach((p, idx) => {
            html += `
                <div class="perk-card" data-idx="${idx}">
                    <div class="perk-icon">${p.icon}</div>
                    <div class="perk-name">${p.name}</div>
                    <div class="perk-desc">${p.desc}</div>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.perk-card').forEach((card, i) => {
            card.addEventListener('click', () => {
                PerkManager.applyPerk(player, perks[i]);
                perkModal.classList.add('hidden');
                if (onSelectCallback) onSelectCallback();
            });
        });
    }
}

export const uiManager = new UIManager();
