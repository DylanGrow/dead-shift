/**
 * DEAD SHIFT - UI, HUD & Screen Manager
 */
import { saveManager } from './save.js';
import { PerkManager } from './perks.js';
import { CHARACTER_CLASSES } from './player.js';

export class UIManager {
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

    static showBossIntro(bossName) {
        const banner = document.getElementById('bossIntroBanner');
        document.getElementById('bossIntroTitle').innerText = `${bossName} HAS AWAKENED`;
        banner.classList.remove('hidden');

        setTimeout(() => {
            banner.classList.add('hidden');
        }, 3000);
    }

    static renderCharacterSelect(onSelectCallback) {
        const grid = document.getElementById('characterCardsGrid');
        let html = '';
        CHARACTER_CLASSES.forEach(c => {
            html += `
                <div class="character-card" data-char="${c.id}">
                    <div class="char-icon">${c.icon}</div>
                    <div class="char-title">${c.name}</div>
                    <div class="char-desc">${c.desc}</div>
                </div>
            `;
        });
        grid.innerHTML = html;

        grid.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const charId = e.currentTarget.getAttribute('data-char');
                if (onSelectCallback) onSelectCallback(charId);
            });
        });
    }

    updateHUD(player, wave, waveTimer, fps, dps, activeEvent = null, boss = null) {
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

        const stBar = document.getElementById('hudStaminaBar');
        stBar.style.width = `${(player.stamina / player.maxStamina) * 100}%`;

        const xpFill = document.getElementById('hudXPFill');
        const lvlBadge = document.getElementById('hudLevelBadge');
        xpFill.style.width = `${(player.xp / player.nextLevelXP) * 100}%`;
        lvlBadge.innerText = `LVL ${player.level}`;

        document.getElementById('hudWaveTitle').innerText = `WAVE ${wave}`;
        const mins = Math.floor(waveTimer / 60).toString().padStart(2, '0');
        const secs = Math.floor(waveTimer % 60).toString().padStart(2, '0');
        document.getElementById('hudWaveTimer').innerText = `${mins}:${secs}`;

        document.getElementById('hudCoins').innerText = player.coins;
        document.getElementById('hudKeys').innerText = player.keys;
        document.getElementById('hudTokens').innerText = player.tokens;
        document.getElementById('hudFPS').innerText = `${Math.round(fps)} FPS`;
        document.getElementById('hudDPS').innerText = `${Math.round(dps)} DPS`;

        // Update Dual Weapon Cards
        const wep1 = player.weapons[0];
        const wep2 = player.weapons[1];
        const card1 = document.getElementById('hudWeaponPrimary');
        const card2 = document.getElementById('hudWeaponSecondary');

        if (player.activeWeaponIndex === 0) {
            card1.className = 'weapon-card active-wep';
            card2.className = 'weapon-card inactive-wep';
        } else {
            card1.className = 'weapon-card inactive-wep';
            card2.className = 'weapon-card active-wep';
        }

        if (wep1) {
            document.getElementById('hudWep1Name').innerText = wep1.name;
            document.getElementById('hudWep1Rarity').innerText = wep1.rarity.toUpperCase();
            document.getElementById('hudWep1Ammo').innerText = wep1.isReloading ? 'RELOAD' : wep1.ammo;
            document.getElementById('hudWep1Max').innerText = wep1.clipSize;
        }

        if (wep2) {
            document.getElementById('hudWep2Name').innerText = wep2.name;
            document.getElementById('hudWep2Rarity').innerText = wep2.rarity.toUpperCase();
            document.getElementById('hudWep2Ammo').innerText = wep2.isReloading ? 'RELOAD' : wep2.ammo;
            document.getElementById('hudWep2Max').innerText = wep2.clipSize;
        } else {
            document.getElementById('hudWep2Name').innerText = 'NONE';
            document.getElementById('hudWep2Rarity').innerText = 'EMPTY';
            document.getElementById('hudWep2Ammo').innerText = '0';
            document.getElementById('hudWep2Max').innerText = '0';
        }

        const eventBanner = document.getElementById('hudEventBanner');
        if (activeEvent) {
            eventBanner.classList.remove('hidden');
            document.getElementById('hudEventIcon').innerText = activeEvent.icon;
            document.getElementById('hudEventTitle').innerText = activeEvent.title;
        } else {
            eventBanner.classList.add('hidden');
        }

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
