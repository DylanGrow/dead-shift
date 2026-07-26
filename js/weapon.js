/**
 * DEAD SHIFT - 40 Complete Weapons Registry & Projectile Physics
 */
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';
import { Vec2 } from './physics.js';

export class Projectile {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 4;
        this.damage = 10;
        this.isCrit = false;
        this.element = null;
        this.pierce = 0;
        this.ricochet = 0;
        this.knockback = 1;
        this.life = 2.0;
        this.color = '#ffff00';
        this.isExplosive = false;
        this.explosionRadius = 0;
    }

    init(x, y, vx, vy, radius, damage, isCrit, element, pierce, ricochet, knockback, life, color, isExplosive = false, expRadius = 0) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.damage = damage;
        this.isCrit = isCrit;
        this.element = element;
        this.pierce = pierce;
        this.ricochet = ricochet;
        this.knockback = knockback;
        this.life = life;
        this.color = color;
        this.isExplosive = isExplosive;
        this.explosionRadius = expRadius;
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }
}

export class Weapon {
    constructor(def) {
        this.id = def.id;
        this.name = def.name;
        this.category = def.category;
        this.rarity = def.rarity || 'Common';
        this.damage = def.damage || 20;
        this.fireRate = def.fireRate || 4;
        this.clipSize = def.clipSize || 12;
        this.ammo = this.clipSize;
        this.reloadTime = def.reloadTime || 1.5;
        this.isReloading = false;
        this.reloadTimer = 0;

        this.projSpeed = def.projSpeed || 14;
        this.spread = def.spread || 0.05;
        this.projCount = def.projCount || 1;
        this.pierce = def.pierce || 0;
        this.ricochet = def.ricochet || 0;
        this.knockback = def.knockback || 1;
        this.element = def.element || null;
        this.isExplosive = def.isExplosive || false;
        this.explosionRadius = def.explosionRadius || 0;

        this.cooldownTimer = 0;
        this.length = def.length || 18;
        this.width = def.width || 6;
        this.recoilOffset = 0;
        this.recoilAngle = 0;
        this.color = def.color || '#3b82f6';
        this.audioType = def.audioType || 'pistol';
    }

    canFire() {
        return !this.isReloading && this.cooldownTimer <= 0 && this.ammo > 0;
    }

    fire(player) {
        if (!this.canFire()) {
            if (this.ammo <= 0 && !this.isReloading) {
                this.reload(player);
            }
            return [];
        }

        this.ammo--;
        this.cooldownTimer = 1 / (this.fireRate * player.fireRate);
        this.recoilOffset = 8;

        audioManager.playShot(this.audioType);
        particleManager.addScreenShake(this.isExplosive ? 10 : 3, 0.1);

        const barrelX = player.x + Math.cos(player.rotation) * (player.radius + this.length);
        const barrelY = player.y + Math.sin(player.rotation) * (player.radius + this.length);
        
        particleManager.spawnBurst(barrelX, barrelY, '#fef08a', 5, 3, 2, 'spark');
        particleManager.spawnCasing(player.x, player.y, player.rotation);

        const projectiles = [];
        for (let i = 0; i < this.projCount; i++) {
            const isCrit = Math.random() < player.critChance;
            const finalDamage = Math.round(this.damage * player.damage * (isCrit ? player.critDamage : 1.0));
            const angle = player.rotation + (Math.random() - 0.5) * this.spread;
            const spd = this.projSpeed * player.projSpeed;

            const proj = new Projectile();
            proj.init(
                barrelX,
                barrelY,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                this.isExplosive ? 6 : 4,
                finalDamage,
                isCrit,
                this.element,
                this.pierce,
                this.ricochet,
                this.knockback * player.knockback,
                2.5,
                this.color,
                this.isExplosive,
                this.explosionRadius
            );
            projectiles.push(proj);
        }

        if (this.ammo <= 0) {
            this.reload(player);
        }

        return projectiles;
    }

    reload(player) {
        if (this.isReloading) return;
        this.isReloading = true;
        this.reloadTimer = this.reloadTime / player.reloadSpeed;
    }

    update(dt, player) {
        if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
        if (this.recoilOffset > 0) this.recoilOffset = Math.max(0, this.recoilOffset - dt * 30);

        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.ammo = this.clipSize;
                this.isReloading = false;
            }
        }
    }
}

// --- 40 WEAPON DEFINITIONS (18 CATEGORIES) ---
export const WEAPON_REGISTRY = [
    // 1. Pistols
    { id: 'pistol_m1911', name: 'M1911 Pistol', category: 'Pistols', rarity: 'Common', damage: 25, fireRate: 3.5, clipSize: 12, reloadTime: 1.2, color: '#94a3b8', audioType: 'pistol' },
    { id: 'pistol_deagle', name: 'Desert Eagle', category: 'Pistols', rarity: 'Rare', damage: 65, fireRate: 2.0, clipSize: 7, reloadTime: 1.6, knockback: 2.5, color: '#f59e0b', audioType: 'sniper' },
    { id: 'pistol_revolver', name: '.44 Revolver', category: 'Pistols', rarity: 'Uncommon', damage: 50, fireRate: 2.2, clipSize: 6, reloadTime: 1.8, pierce: 1, color: '#e2e8f0', audioType: 'pistol' },
    { id: 'pistol_dual_beretta', name: 'Dual Berettas', category: 'Pistols', rarity: 'Rare', damage: 22, fireRate: 7.0, clipSize: 30, projCount: 2, reloadTime: 1.4, color: '#60a5fa', audioType: 'pistol' },

    // 2. SMGs
    { id: 'smg_vector', name: 'Vector SMG', category: 'SMGs', rarity: 'Uncommon', damage: 16, fireRate: 14.0, clipSize: 35, reloadTime: 1.3, spread: 0.12, color: '#38bdf8', audioType: 'pistol' },
    { id: 'smg_mp5', name: 'MP5 Submachine', category: 'SMGs', rarity: 'Common', damage: 18, fireRate: 10.0, clipSize: 30, reloadTime: 1.2, color: '#94a3b8', audioType: 'pistol' },
    { id: 'smg_p90', name: 'P90 Shredder', category: 'SMGs', rarity: 'Rare', damage: 20, fireRate: 12.0, clipSize: 50, reloadTime: 1.5, color: '#a855f7', audioType: 'pistol' },
    { id: 'smg_uzi', name: 'Micro Uzi', category: 'SMGs', rarity: 'Common', damage: 14, fireRate: 16.0, clipSize: 32, reloadTime: 1.1, spread: 0.15, color: '#94a3b8', audioType: 'pistol' },

    // 3. Shotguns
    { id: 'shotgun_pump', name: 'Pump Action Shotgun', category: 'Shotguns', rarity: 'Common', damage: 14, fireRate: 1.2, projCount: 6, spread: 0.25, clipSize: 8, reloadTime: 2.2, knockback: 3, color: '#94a3b8', audioType: 'shotgun' },
    { id: 'shotgun_aa12', name: 'AA-12 Auto Shotgun', category: 'Shotguns', rarity: 'Epic', damage: 18, fireRate: 3.5, projCount: 8, spread: 0.3, clipSize: 20, reloadTime: 2.5, color: '#a855f7', audioType: 'shotgun' },
    { id: 'shotgun_sawed_off', name: 'Sawed-Off Shotgun', category: 'Shotguns', rarity: 'Uncommon', damage: 22, fireRate: 1.0, projCount: 10, spread: 0.4, clipSize: 2, reloadTime: 1.0, knockback: 4, color: '#4ade80', audioType: 'shotgun' },
    { id: 'shotgun_tactical', name: 'Tactical Combat Shotgun', category: 'Shotguns', rarity: 'Rare', damage: 16, fireRate: 2.0, projCount: 7, spread: 0.2, clipSize: 10, reloadTime: 1.8, color: '#3b82f6', audioType: 'shotgun' },

    // 4. Rifles
    { id: 'rifle_ak47', name: 'AK-47 Assault Rifle', category: 'Rifles', rarity: 'Common', damage: 32, fireRate: 6.5, clipSize: 30, reloadTime: 1.5, color: '#94a3b8', audioType: 'pistol' },
    { id: 'rifle_m4a1', name: 'M4A1 Carbine', category: 'Rifles', rarity: 'Uncommon', damage: 28, fireRate: 8.0, clipSize: 30, reloadTime: 1.4, spread: 0.04, color: '#4ade80', audioType: 'pistol' },
    { id: 'rifle_assault', name: 'Heavy Assault Rifle', category: 'Rifles', rarity: 'Rare', damage: 38, fireRate: 5.5, clipSize: 25, reloadTime: 1.6, pierce: 1, color: '#3b82f6', audioType: 'pistol' },
    { id: 'rifle_burst', name: 'Burst Carbine', category: 'Rifles', rarity: 'Uncommon', damage: 26, fireRate: 7.5, clipSize: 36, reloadTime: 1.3, projCount: 3, spread: 0.03, color: '#4ade80', audioType: 'pistol' },

    // 5. Snipers
    { id: 'sniper_barrett', name: 'Barrett .50 Cal', category: 'Snipers', rarity: 'Epic', damage: 220, fireRate: 0.8, clipSize: 5, reloadTime: 2.8, pierce: 4, knockback: 5, color: '#a855f7', audioType: 'sniper' },
    { id: 'sniper_dmr', name: 'Semi-Auto DMR', category: 'Snipers', rarity: 'Rare', damage: 90, fireRate: 2.5, clipSize: 10, reloadTime: 1.8, pierce: 2, color: '#3b82f6', audioType: 'sniper' },
    { id: 'sniper_anti_material', name: 'Anti-Material Rifle', category: 'Snipers', rarity: 'Legendary', damage: 350, fireRate: 0.5, clipSize: 4, reloadTime: 3.2, pierce: 6, knockback: 6, color: '#f59e0b', audioType: 'sniper' },
    { id: 'sniper_bolt', name: 'Hunting Bolt-Action', category: 'Snipers', rarity: 'Common', damage: 110, fireRate: 1.2, clipSize: 5, reloadTime: 2.0, pierce: 1, color: '#94a3b8', audioType: 'sniper' },

    // 6. Rocket Launchers
    { id: 'rocket_rpg', name: 'RPG-7 Rocket Launcher', category: 'Rocket Launchers', rarity: 'Epic', damage: 180, fireRate: 0.6, clipSize: 1, reloadTime: 2.5, isExplosive: true, explosionRadius: 80, color: '#f59e0b', audioType: 'shotgun' },
    { id: 'rocket_hydra', name: 'Hydra Multi-Rocket', category: 'Rocket Launchers', rarity: 'Legendary', damage: 120, fireRate: 1.5, projCount: 3, spread: 0.2, clipSize: 4, reloadTime: 3.0, isExplosive: true, explosionRadius: 60, color: '#f97316', audioType: 'shotgun' },
    { id: 'rocket_quad', name: 'Quad Rocket Launcher', category: 'Rocket Launchers', rarity: 'Epic', damage: 140, fireRate: 1.0, projCount: 4, spread: 0.15, clipSize: 4, reloadTime: 3.2, isExplosive: true, explosionRadius: 70, color: '#a855f7', audioType: 'shotgun' },

    // 7. Grenade Launchers
    { id: 'grenade_m32', name: 'M32 MGL Grenade Launcher', category: 'Grenade Launchers', rarity: 'Epic', damage: 130, fireRate: 2.0, clipSize: 6, reloadTime: 2.4, isExplosive: true, explosionRadius: 65, color: '#a855f7', audioType: 'shotgun' },
    { id: 'grenade_cluster', name: 'Cluster Bomb Launcher', category: 'Grenade Launchers', rarity: 'Legendary', damage: 110, fireRate: 1.2, clipSize: 4, reloadTime: 2.8, isExplosive: true, explosionRadius: 90, color: '#f59e0b', audioType: 'shotgun' },

    // 8. Flamethrowers
    { id: 'flamethrower', name: 'Pyro Flamethrower', category: 'Flamethrowers', rarity: 'Rare', damage: 12, fireRate: 18.0, clipSize: 100, reloadTime: 2.5, element: 'burn', spread: 0.35, color: '#ef4444', audioType: 'laser' },
    { id: 'plasma_flame', name: 'Plasma Incinerator', category: 'Flamethrowers', rarity: 'Legendary', damage: 22, fireRate: 20.0, clipSize: 120, reloadTime: 2.2, element: 'burn', spread: 0.4, color: '#f97316', audioType: 'laser' },

    // 9. Crossbows
    { id: 'crossbow_tactical', name: 'Tactical Crossbow', category: 'Crossbows', rarity: 'Uncommon', damage: 75, fireRate: 2.0, clipSize: 5, reloadTime: 1.5, pierce: 2, color: '#4ade80', audioType: 'sniper' },
    { id: 'crossbow_heavy', name: 'Heavy Siege Crossbow', category: 'Crossbows', rarity: 'Rare', damage: 140, fireRate: 1.1, clipSize: 3, reloadTime: 2.0, pierce: 4, knockback: 3, color: '#3b82f6', audioType: 'sniper' },

    // 10. Laser Weapons
    { id: 'laser_rifle', name: 'Continuous Laser Cannon', category: 'Laser Weapons', rarity: 'Epic', damage: 24, fireRate: 20.0, clipSize: 80, reloadTime: 2.0, element: 'lightning', color: '#38bdf8', audioType: 'laser' },
    { id: 'laser_beam', name: 'Heavy Beam Rifle', category: 'Laser Weapons', rarity: 'Legendary', damage: 85, fireRate: 4.0, clipSize: 30, reloadTime: 1.8, pierce: 5, color: '#60a5fa', audioType: 'laser' },

    // 11. Energy Weapons
    { id: 'plasma_blaster', name: 'Plasma Energy Blaster', category: 'Energy Weapons', rarity: 'Rare', damage: 45, fireRate: 4.0, clipSize: 18, reloadTime: 1.6, element: 'poison', color: '#22c55e', audioType: 'laser' },
    { id: 'gauss_cannon', name: 'Gauss Rail Rifle', category: 'Energy Weapons', rarity: 'Legendary', damage: 260, fireRate: 0.7, clipSize: 5, reloadTime: 2.5, pierce: 6, knockback: 5, color: '#38bdf8', audioType: 'sniper' },
    { id: 'pulse_cannon', name: 'Pulse Energy Cannon', category: 'Energy Weapons', rarity: 'Epic', damage: 60, fireRate: 5.0, clipSize: 24, reloadTime: 1.7, element: 'lightning', color: '#c084fc', audioType: 'laser' },

    // 12. Chainsaws
    { id: 'chainsaw_ripper', name: 'Ripper Chainsaw', category: 'Chainsaws', rarity: 'Epic', damage: 30, fireRate: 15.0, projCount: 1, length: 24, width: 10, clipSize: 999, reloadTime: 0, color: '#ef4444', audioType: 'melee' },
    { id: 'chainsaw_cyber', name: 'Cyber Saw', category: 'Chainsaws', rarity: 'Legendary', damage: 50, fireRate: 18.0, projCount: 1, length: 28, width: 12, clipSize: 999, reloadTime: 0, color: '#38bdf8', audioType: 'melee' },

    // 13. Baseball Bats
    { id: 'bat_spike', name: 'Spiked Slugger Bat', category: 'Baseball Bats', rarity: 'Uncommon', damage: 95, fireRate: 1.8, projCount: 1, length: 26, width: 8, clipSize: 999, reloadTime: 0, knockback: 4, color: '#f59e0b', audioType: 'melee' },

    // 14. Katanas
    { id: 'katana_ronin', name: 'Ronin Katana', category: 'Katanas', rarity: 'Rare', damage: 85, fireRate: 2.5, projCount: 1, length: 30, width: 4, clipSize: 999, reloadTime: 0, color: '#c084fc', audioType: 'melee' },
    { id: 'katana_shadow', name: 'Shadow Blade Katana', category: 'Katanas', rarity: 'Legendary', damage: 150, fireRate: 3.2, projCount: 1, length: 34, width: 5, clipSize: 999, reloadTime: 0, element: 'bleed', color: '#a855f7', audioType: 'melee' },

    // 15. Explosive Weapons
    { id: 'c4_launcher', name: 'C4 Launcher', category: 'Explosive Weapons', rarity: 'Epic', damage: 200, fireRate: 0.8, clipSize: 4, reloadTime: 2.6, isExplosive: true, explosionRadius: 85, color: '#ef4444', audioType: 'shotgun' },

    // 16. Drone Weapons
    { id: 'drone_carrier', name: 'Drone Carrier Pod', category: 'Drone Weapons', rarity: 'Legendary', damage: 40, fireRate: 6.0, clipSize: 40, reloadTime: 2.0, color: '#38bdf8', audioType: 'laser' },

    // 17. Orbital Weapons
    { id: 'orbital_satellite', name: 'Satellite Strike Beacon', category: 'Orbital Weapons', rarity: 'Legendary', damage: 300, fireRate: 0.5, clipSize: 2, reloadTime: 3.5, isExplosive: true, explosionRadius: 110, color: '#3b82f6', audioType: 'sniper' },

    // 18. Legendary & Mythic Weapons
    { id: 'mythic_doomsday', name: 'Doomsday Quantum Cannon', category: 'Legendary Weapons', rarity: 'Mythic', damage: 450, fireRate: 1.0, projCount: 5, spread: 0.25, clipSize: 10, reloadTime: 2.0, isExplosive: true, explosionRadius: 120, element: 'lightning', color: '#f97316', audioType: 'sniper' },
    { id: 'mythic_void_ray', name: 'Void Ray Annihilator', category: 'Legendary Weapons', rarity: 'Mythic', damage: 380, fireRate: 1.5, projCount: 3, spread: 0.15, clipSize: 12, reloadTime: 1.8, pierce: 6, element: 'poison', color: '#c084fc', audioType: 'laser' }
];
