/**
 * DEAD SHIFT - Zero-XSS Safe UI, Screen Manager & Tactile Audio Feedback
 */
import { saveManager } from './save.js';
import { PerkManager } from './perks.js';
import { CHARACTER_CLASSES } from './player.js';
import { MAPS_REGISTRY } from './maps.js';
import { audioManager } from './audio.js';

export class UIManager {
    static bindHoverSounds() {
        document.querySelectorAll('.btn, .character-card, .map-card, .perk-card, .shop-item-card').forEach(el => {
            el.addEventListener('mouseenter', () => audioManager.playHoverTick());
        });
    }

    static spawnFloatingText(x, y, text, color = '#ffffff', isCrit = false) {
        const s = saveManager.data.settings;
        if (!s.showDamageNumbers) return;

        const el = document.createElement('div');
        el.className = `floating-dmg ${isCrit ? 'crit' : ''}`;
        el.textContent = String(text);
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

        const container = document.getElementById('uiContainer');
        if (container) container.appendChild(el);

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
        const title = document.getElementById('bossIntroTitle');
        if (title) title.textContent = `${bossName} HAS AWAKENED`;
        if (banner) banner.classList.remove('hidden');

        setTimeout(() => {
            if (banner) banner.classList.add('hidden');
        }, 3000);
    }

    static renderCharacterSelect(onSelectCallback) {
        const grid = document.getElementById('characterCardsGrid');
        if (!grid) return;
        grid.replaceChildren();

        CHARACTER_CLASSES.forEach(c => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.setAttribute('data-char', c.id);
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Select Operative ${c.name}`);

            const iconDiv = document.createElement('div');
            iconDiv.className = 'char-icon';
            iconDiv.textContent = c.icon;

            const titleDiv = document.createElement('div');
            titleDiv.className = 'char-title';
            titleDiv.textContent = c.name;

            const descDiv = document.createElement('div');
            descDiv.className = 'char-desc';
            descDiv.textContent = c.desc;

            card.appendChild(iconDiv);
            card.appendChild(titleDiv);
            card.appendChild(descDiv);

            card.addEventListener('mouseenter', () => audioManager.playHoverTick());
            card.addEventListener('click', () => {
                if (onSelectCallback) onSelectCallback(c.id);
            });

            grid.appendChild(card);
        });
    }

    static renderMapSelect(onSelectCallback) {
        const grid = document.getElementById('mapCardsGrid');
        if (!grid) return;
        grid.replaceChildren();

        MAPS_REGISTRY.forEach(m => {
            const card = document.createElement('div');
            card.className = 'map-card';
            card.setAttribute('data-map', m.id);
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Select Map ${m.name}`);

            const iconDiv = document.createElement('div');
            iconDiv.className = 'char-icon';
            iconDiv.textContent = '🗺️';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'char-title';
            titleDiv.textContent = m.name;

            const descDiv = document.createElement('div');
            descDiv.className = 'char-desc';
            descDiv.textContent = `Area: ${m.width || 3000}x${m.height || 3000}`;

            card.appendChild(iconDiv);
            card.appendChild(titleDiv);
            card.appendChild(descDiv);

            card.addEventListener('mouseenter', () => audioManager.playHoverTick());
            card.addEventListener('click', () => {
                if (onSelectCallback) onSelectCallback(m.id);
            });

            grid.appendChild(card);
        });
    }

    static renderAchievements() {
        const container = document.getElementById('achievementsContainer');
        if (!container) return;
        container.replaceChildren();

        const st = saveManager.data.stats;
        const items = [
            { icon: '💀', title: 'TOTAL KILLS', desc: `${st.totalKills || 0} Defeated Zombies` },
            { icon: '👑', title: 'BOSSES DEFEATED', desc: `${st.bossKills || 0} Defeated Bosses` },
            { icon: '🏆', title: 'HIGH SCORE', desc: `${st.highScore || 0} Points` },
            { icon: '🪙', title: 'COINS EARNED', desc: `${st.totalCoinsEarned || 0} Lifetime Coins` }
        ];

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'achievement-card';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'char-icon';
            iconDiv.textContent = item.icon;

            const titleDiv = document.createElement('div');
            titleDiv.className = 'char-title';
            titleDiv.textContent = item.title;

            const descDiv = document.createElement('div');
            descDiv.className = 'char-desc';
            descDiv.textContent = item.desc;

            card.appendChild(iconDiv);
            card.appendChild(titleDiv);
            card.appendChild(descDiv);

            card.addEventListener('mouseenter', () => audioManager.playHoverTick());
            container.appendChild(card);
        });
    }

    updateHUD(player, wave, waveTimer, fps, dps, activeEvent = null, boss = null) {
        const hpBar = document.getElementById('hudHealthBar');
        const shBar = document.getElementById('hudShieldBar');
        const hpText = document.getElementById('hudHealthText');
        const hpContainer = document.getElementById('hudHealthContainer');

        const hpPct = Math.max(0, (player.health / player.maxHealth) * 100);
        if (hpBar) hpBar.style.width = `${hpPct}%`;

        // Low Health Emergency Pulse Trigger
        if (hpContainer) {
            if (hpPct <= 30) hpContainer.classList.add('low-hp');
            else hpContainer.classList.remove('low-hp');
        }

        if (player.maxShield > 0) {
            const shPct = Math.max(0, (player.shield / player.maxShield) * 100);
            if (shBar) shBar.style.width = `${shPct}%`;
        } else {
            if (shBar) shBar.style.width = '0%';
        }
        if (hpText) hpText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

        const stBar = document.getElementById('hudStaminaBar');
        if (stBar) stBar.style.width = `${(player.stamina / player.maxStamina) * 100}%`;

        const xpFill = document.getElementById('hudXPFill');
        const lvlBadge = document.getElementById('hudLevelBadge');
        if (xpFill) xpFill.style.width = `${(player.xp / player.nextLevelXP) * 100}%`;
        if (lvlBadge) lvlBadge.textContent = `LVL ${player.level}`;

        const waveTitle = document.getElementById('hudWaveTitle');
        if (waveTitle) waveTitle.textContent = `WAVE ${wave}`;

        const mins = Math.floor(waveTimer / 60).toString().padStart(2, '0');
        const secs = Math.floor(waveTimer % 60).toString().padStart(2, '0');
        const timerText = document.getElementById('hudWaveTimer');
        if (timerText) timerText.textContent = `${mins}:${secs}`;

        const coinsEl = document.getElementById('hudCoins');
        const keysEl = document.getElementById('hudKeys');
        const tokensEl = document.getElementById('hudTokens');
        const fpsEl = document.getElementById('hudFPS');
        const dpsEl = document.getElementById('hudDPS');

        if (coinsEl) coinsEl.textContent = String(player.coins);
        if (keysEl) keysEl.textContent = String(player.keys);
        if (tokensEl) tokensEl.textContent = String(player.tokens);
        if (fpsEl) fpsEl.textContent = `${Math.round(fps)} FPS`;
        if (dpsEl) dpsEl.textContent = `${Math.round(dps)} DPS`;

        const wep1 = player.weapons[0];
        const wep2 = player.weapons[1];
        const card1 = document.getElementById('hudWeaponPrimary');
        const card2 = document.getElementById('hudWeaponSecondary');

        if (card1 && card2) {
            if (player.activeWeaponIndex === 0) {
                card1.className = 'weapon-card active-wep';
                card2.className = 'weapon-card inactive-wep';
            } else {
                card1.className = 'weapon-card inactive-wep';
                card2.className = 'weapon-card active-wep';
            }
        }

        if (wep1) {
            const n = document.getElementById('hudWep1Name');
            const r = document.getElementById('hudWep1Rarity');
            const a = document.getElementById('hudWep1Ammo');
            const m = document.getElementById('hudWep1Max');
            if (n) n.textContent = wep1.name;
            if (r) r.textContent = wep1.rarity.toUpperCase();
            if (a) a.textContent = wep1.isReloading ? 'RELOAD' : String(wep1.ammo);
            if (m) m.textContent = String(wep1.clipSize);
        }

        if (wep2) {
            const n = document.getElementById('hudWep2Name');
            const r = document.getElementById('hudWep2Rarity');
            const a = document.getElementById('hudWep2Ammo');
            const m = document.getElementById('hudWep2Max');
            if (n) n.textContent = wep2.name;
            if (r) r.textContent = wep2.rarity.toUpperCase();
            if (a) a.textContent = wep2.isReloading ? 'RELOAD' : String(wep2.ammo);
            if (m) m.textContent = String(wep2.clipSize);
        }

        const eventBanner = document.getElementById('hudEventBanner');
        if (eventBanner) {
            if (activeEvent) {
                eventBanner.classList.remove('hidden');
                const i = document.getElementById('hudEventIcon');
                const t = document.getElementById('hudEventTitle');
                if (i) i.textContent = activeEvent.icon;
                if (t) t.textContent = activeEvent.title;
            } else {
                eventBanner.classList.add('hidden');
            }
        }

        const bossContainer = document.getElementById('hudBossContainer');
        if (bossContainer) {
            if (boss && boss.health > 0) {
                bossContainer.classList.remove('hidden');
                const bn = document.getElementById('hudBossName');
                const bh = document.getElementById('hudBossHealthBar');
                if (bn) bn.textContent = boss.name;
                if (bh) bh.style.width = `${Math.max(0, (boss.health / boss.maxHealth) * 100)}%`;
            } else {
                bossContainer.classList.add('hidden');
            }
        }
    }

    static renderPerkModal(player, onSelectCallback) {
        const perkModal = document.getElementById('perkModal');
        const container = document.getElementById('perkCardsContainer');
        if (!perkModal || !container) return;
        perkModal.classList.remove('hidden');

        const populate = () => {
            container.replaceChildren();
            const perks = PerkManager.getRandomPerks(3);

            perks.forEach((p, idx) => {
                const card = document.createElement('div');
                card.className = 'perk-card';
                card.setAttribute('data-idx', String(idx));
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `Select Perk ${p.name}`);

                const iconDiv = document.createElement('div');
                iconDiv.className = 'perk-icon';
                iconDiv.textContent = p.icon;

                const nameDiv = document.createElement('div');
                nameDiv.className = 'perk-name';
                nameDiv.textContent = p.name;

                const descDiv = document.createElement('div');
                descDiv.className = 'perk-desc';
                descDiv.textContent = p.desc;

                card.appendChild(iconDiv);
                card.appendChild(nameDiv);
                card.appendChild(descDiv);

                card.addEventListener('mouseenter', () => audioManager.playHoverTick());
                card.addEventListener('click', () => {
                    PerkManager.applyPerk(player, p);
                    perkModal.classList.add('hidden');
                    if (onSelectCallback) onSelectCallback();
                });

                container.appendChild(card);
            });
        };

        populate();

        const btnReroll = document.getElementById('btnRerollPerks');
        const btnSkip = document.getElementById('btnSkipPerks');

        if (btnReroll) btnReroll.onclick = () => populate();
        if (btnSkip) {
            btnSkip.onclick = () => {
                player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.2);
                perkModal.classList.add('hidden');
                if (onSelectCallback) onSelectCallback();
            };
        }
    }
}

// Bind hover audio feedback on DOM load
window.addEventListener('DOMContentLoaded', () => {
    UIManager.bindHoverSounds();
});

export const uiManager = new UIManager();
