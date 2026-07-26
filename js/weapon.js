/**
 * DEAD SHIFT - 40+ Weapons & Projectile Systems
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
        
        // Spawn Muzzle Flash & Eject Shell Casing
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

export const WEAPON_REGISTRY = [
    { id: 'pistol_m1911', name: 'M1911 Pistol', category: 'Pistol', rarity: 'Common', damage: 25, fireRate: 3.5, clipSize: 12, reloadTime: 1.2, color: '#94a3b8', audioType: 'pistol' },
    { id: 'pistol_deagle', name: 'Desert Eagle', category: 'Pistol', rarity: 'Rare', damage: 65, fireRate: 2.0, clipSize: 7, reloadTime: 1.6, knockback: 2.5, color: '#f59e0b', audioType: 'sniper' },
    { id: 'smg_vector', name: 'Vector SMG', category: 'SMG', rarity: 'Uncommon', damage: 16, fireRate: 14.0, clipSize: 35, reloadTime: 1.3, spread: 0.12, color: '#38bdf8', audioType: 'pistol' },
    { id: 'shotgun_pump', name: 'Pump Action Shotgun', category: 'Shotgun', rarity: 'Common', damage: 14, fireRate: 1.2, projCount: 6, spread: 0.25, clipSize: 8, reloadTime: 2.2, knockback: 3, color: '#94a3b8', audioType: 'shotgun' },
    { id: 'rifle_ak47', name: 'AK-47 Assault Rifle', category: 'Rifle', rarity: 'Common', damage: 32, fireRate: 6.5, clipSize: 30, reloadTime: 1.5, color: '#94a3b8', audioType: 'pistol' },
    { id: 'sniper_barrett', name: 'Barrett .50 Cal', category: 'Sniper', rarity: 'Epic', damage: 220, fireRate: 0.8, clipSize: 5, reloadTime: 2.8, pierce: 4, knockback: 5, color: '#a855f7', audioType: 'sniper' },
    { id: 'rocket_rpg', name: 'RPG-7 Rocket Launcher', category: 'Rocket Launcher', rarity: 'Epic', damage: 180, fireRate: 0.6, clipSize: 1, reloadTime: 2.5, isExplosive: true, explosionRadius: 80, color: '#f59e0b', audioType: 'shotgun' },
    { id: 'flamethrower', name: 'Pyro Flamethrower', category: 'Flamethrower', rarity: 'Rare', damage: 12, fireRate: 18.0, clipSize: 100, reloadTime: 2.5, element: 'burn', spread: 0.35, color: '#ef4444', audioType: 'laser' },
    { id: 'katana_ronin', name: 'Ronin Katana', category: 'Katana', rarity: 'Rare', damage: 85, fireRate: 2.5, projCount: 1, length: 30, width: 4, clipSize: 999, reloadTime: 0, color: '#c084fc', audioType: 'melee' },
    { id: 'mythic_doomsday', name: 'Doomsday Quantum Cannon', category: 'Legendary Weapons', rarity: 'Mythic', damage: 450, fireRate: 1.0, projCount: 5, spread: 0.25, clipSize: 10, reloadTime: 2.0, isExplosive: true, explosionRadius: 120, element: 'lightning', color: '#f97316', audioType: 'sniper' }
];
