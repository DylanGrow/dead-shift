/**
 * DEAD SHIFT - Meta-Progression & Shop System
 */
import { saveManager } from './save.js';
import { audioManager } from './audio.js';

export const PASSIVE_UPGRADES = [
    { id: 'maxHealth', name: 'Vitality Armor', cost: 100, maxLevel: 10, desc: '+20 Max Health per rank' },
    { id: 'armor', name: 'Reinforced Plating', cost: 150, maxLevel: 5, desc: '+2 Flat Damage Reduction per rank' },
    { id: 'moveSpeed', name: 'Combat Boots', cost: 120, maxLevel: 5, desc: '+6% Movement Speed per rank' },
    { id: 'damage', name: 'Ballistic Powder', cost: 200, maxLevel: 10, desc: '+10% Overall Damage per rank' },
    { id: 'critChance', name: 'Optical Scope', cost: 250, maxLevel: 5, desc: '+3% Critical Hit Chance per rank' },
    { id: 'pickupRadius', name: 'Electromagnet', cost: 80, maxLevel: 5, desc: '+20 Pickup Radius per rank' },
    { id: 'xpGain', name: 'Combat Analysis', cost: 180, maxLevel: 5, desc: '+10% XP Gain per rank' }
];

export class ShopManager {
    static renderShop(container) {
        const coins = saveManager.data.coins;
        const passives = saveManager.data.purchasedPassives;

        let html = '<div class="passives-list">';
        PASSIVE_UPGRADES.forEach(upg => {
            const currentLvl = passives[upg.id] || 0;
            const isMax = currentLvl >= upg.maxLevel;
            const cost = upg.cost * (currentLvl + 1);
            const canAfford = coins >= cost && !isMax;

            html += `
                <div class="shop-item-card">
                    <div class="shop-item-header">
                        <span class="shop-item-title">${upg.name}</span>
                        <span class="shop-item-rank">RANK ${currentLvl}/${upg.maxLevel}</span>
                    </div>
                    <p class="shop-item-desc">${upg.desc}</p>
                    <button class="btn ${canAfford ? 'btn-primary' : 'btn-secondary'}" ${!canAfford ? 'disabled' : ''} data-buy="${upg.id}">
                        ${isMax ? 'MAXED' : `UPGRADE (${cost} 🪙)`}
                    </button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        // Bind Buy Buttons
        container.querySelectorAll('button[data-buy]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgId = e.currentTarget.getAttribute('data-buy');
                ShopManager.buyUpgrade(upgId);
                ShopManager.renderShop(container);
            });
        });
    }

    static buyUpgrade(upgId) {
        const upg = PASSIVE_UPGRADES.find(u => u.id === upgId);
        if (!upg) return;

        const currentLvl = saveManager.data.purchasedPassives[upgId] || 0;
        if (currentLvl >= upg.maxLevel) return;

        const cost = upg.cost * (currentLvl + 1);
        if (saveManager.spendCoins(cost)) {
            saveManager.data.purchasedPassives[upgId] = currentLvl + 1;
            saveManager.saveData();
            audioManager.playPickup();
        }
    }
}
