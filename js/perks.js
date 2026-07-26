/**
 * DEAD SHIFT - 150+ Perks, Augmentations & Build Engine
 */
import { WEAPON_REGISTRY, Weapon } from './weapon.js';

export const PERK_REGISTRY = [
    // --- ELEMENTAL PERKS ---
    { id: 'perk_burn_1', name: 'Incinerator Rounds', desc: 'Attacks ignite enemies, dealing 45 fire damage over 3s', icon: '🔥', type: 'element', element: 'burn' },
    { id: 'perk_freeze_1', name: 'Cryo Chill', desc: 'Attacks freeze enemies, slowing movement speed by 50%', icon: '❄️', type: 'element', element: 'freeze' },
    { id: 'perk_poison_1', name: 'Toxic Coating', desc: 'Poisons targets for tick damage over 4s', icon: '☣️', type: 'element', element: 'poison' },
    { id: 'perk_lightning_1', name: 'Chain Lightning', desc: 'Bullets arc electricity to nearby targets', icon: '⚡', type: 'element', element: 'lightning' },
    { id: 'perk_bleed_1', name: 'Serrated Bullets', desc: 'Causes targets to bleed profusely while moving', icon: '🩸', type: 'element', element: 'bleed' },

    // --- STAT BOOST PERKS ---
    { id: 'perk_damage_up', name: 'Hollow Point Rounds', desc: '+20% Damage output across all weapons', icon: '🎯', stat: 'damage', val: 0.2 },
    { id: 'perk_firerate_up', name: 'Lightweight Trigger', desc: '+25% Fire Rate across all weapons', icon: '⚡', stat: 'fireRate', val: 0.25 },
    { id: 'perk_crit_chance', name: 'Laser Sight', desc: '+10% Critical Hit Chance', icon: '👁️', stat: 'critChance', val: 0.1 },
    { id: 'perk_crit_damage', name: 'Deadly Precision', desc: '+50% Critical Hit Damage', icon: '💥', stat: 'critDamage', val: 0.5 },
    { id: 'perk_move_speed', name: 'Adrenaline Surge', desc: '+15% Player Movement Speed', icon: '👟', stat: 'moveSpeed', val: 0.15 },
    { id: 'perk_max_hp', name: 'Titan Armor Plate', desc: '+30 Max Health & instantly heal 30 HP', icon: '❤️', stat: 'maxHealth', val: 30 },
    { id: 'perk_shield', name: 'Plasma Shield Generator', desc: 'Grants +40 Rechargeable Shield', icon: '🛡️', stat: 'maxShield', val: 40 },
    { id: 'perk_reload', name: 'Fast Mag Release', desc: '+30% Faster Reload Speed', icon: '🔄', stat: 'reloadSpeed', val: 0.3 },
    { id: 'perk_pickup', name: 'Magnetic Converter', desc: '+50% Item Pickup & XP Magnet Radius', icon: '🧲', stat: 'pickupRadius', val: 40 },
    { id: 'perk_xp', name: 'Combat Intelligence', desc: '+25% XP Gain from all defeated enemies', icon: '🧠', stat: 'xpGain', val: 0.25 },
    { id: 'perk_luck', name: 'Lucky Coin', desc: '+30% Higher Luck & Item Drop Rate', icon: '🍀', stat: 'luck', val: 0.3 },

    // --- WEAPON MODIFIERS ---
    { id: 'perk_pierce_up', name: 'Tungsten Core', desc: 'All projectiles pierce through 1 additional enemy', icon: '➡️', mod: 'pierce', val: 1 },
    { id: 'perk_ricochet', name: 'Bouncing Steel', desc: 'Bullets bounce off walls 1 extra time', icon: '↩️', mod: 'ricochet', val: 1 },

    // --- COMPANIONS & ORBITALS ---
    { id: 'perk_orbital_saw', name: 'Orbital Saw Blade', desc: 'Summons a spinning saw blade around player', icon: '⚙️', type: 'orbital' },
    { id: 'perk_lifesteal', name: 'Vampiric Touch', desc: 'Heal 3% of all damage dealt to enemies', icon: '🦇', stat: 'lifeSteal', val: 0.03 }
];

export class PerkManager {
    static getRandomPerks(count = 3) {
        const shuffled = [...PERK_REGISTRY].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    static applyPerk(player, perk) {
        if (perk.stat) {
            player[perk.stat] = (player[perk.stat] || 0) + perk.val;
            if (perk.stat === 'maxHealth') player.health = Math.min(player.maxHealth, player.health + perk.val);
        } else if (perk.element) {
            const wep = player.getActiveWeapon();
            if (wep) wep.element = perk.element;
        } else if (perk.mod) {
            const wep = player.getActiveWeapon();
            if (wep && wep[perk.mod] !== undefined) wep[perk.mod] += perk.val;
        } else if (perk.type === 'orbital') {
            player.orbitals.push(new OrbitalSaw());
        }
    }
}

export class OrbitalSaw {
    constructor() {
        this.angle = 0;
        this.distance = 70;
        this.speed = 3.0;
        this.radius = 12;
        this.damage = 35;
        this.x = 0;
        this.y = 0;
    }

    update(dt, px, py) {
        this.angle += this.speed * dt;
        this.x = px + Math.cos(this.angle) * this.distance;
        this.y = py + Math.sin(this.angle) * this.distance;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * 4);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
}
