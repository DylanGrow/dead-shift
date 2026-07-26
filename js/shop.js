/**
 * DEAD SHIFT - Meta-Progression & Shop System (Zero-XSS Safe)
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
        if (!container) return;
        container.replaceChildren();

        const coins = saveManager.data.coins;
        const passives = saveManager.data.purchasedPassives;

        const shopText = document.getElementById('shopCoinsText');
        if (shopText) shopText.textContent = String(coins);

        const listDiv = document.createElement('div');
        listDiv.className = 'passives-list';

        PASSIVE_UPGRADES.forEach(upg => {
            const currentLvl = passives[upg.id] || 0;
            const isMax = currentLvl >= upg.maxLevel;
            const cost = upg.cost * (currentLvl + 1);
            const canAfford = coins >= cost && !isMax;

            const card = document.createElement('div');
            card.className = 'shop-item-card';

            const header = document.createElement('div');
            header.className = 'shop-item-header';

            const title = document.createElement('span');
            title.className = 'shop-item-title';
            title.textContent = upg.name;

            const rank = document.createElement('span');
            rank.className = 'shop-item-rank';
            rank.textContent = `RANK ${currentLvl}/${upg.maxLevel}`;

            header.appendChild(title);
            header.appendChild(rank);

            const desc = document.createElement('p');
            desc.className = 'shop-item-desc';
            desc.textContent = upg.desc;

            const btn = document.createElement('button');
            btn.className = `btn ${canAfford ? 'btn-primary' : 'btn-secondary'}`;
            if (!canAfford) btn.setAttribute('disabled', 'true');
            btn.textContent = isMax ? 'MAXED' : `UPGRADE (${cost} 🪙)`;

            btn.addEventListener('click', () => {
                ShopManager.buyUpgrade(upg.id);
                ShopManager.renderShop(container);
            });

            card.appendChild(header);
            card.appendChild(desc);
            card.appendChild(btn);

            listDiv.appendChild(card);
        });

        container.appendChild(listDiv);
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
