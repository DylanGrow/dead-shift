/**
 * DEAD SHIFT - 30 Enemy Types & Advanced AI Engine
 */
import { Vec2 } from './physics.js';
import { SpriteRenderer } from './sprites.js';
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';
import { saveManager } from './save.js';

export class Enemy {
    constructor(def, x, y, isElite = false) {
        this.id = def.id;
        this.name = def.name;
        this.x = x;
        this.y = y;
        this.radius = isElite ? (def.radius || 18) * 1.4 : (def.radius || 18);
        this.rotation = 0;

        const hpMult = isElite ? 3.5 : 1.0;
        this.maxHealth = Math.round((def.health || 50) * hpMult);
        this.health = this.maxHealth;
        this.speed = (def.speed || 2.0) * (isElite ? 1.1 : 1.0);
        this.damage = Math.round((def.damage || 10) * (isElite ? 1.5 : 1.0));
        this.xpValue = Math.round((def.xpValue || 15) * (isElite ? 4 : 1));
        this.coinDropChance = def.coinDropChance || 0.3;
        this.color = isElite ? '#f59e0b' : (def.color || '#991b1b');
        this.isElite = isElite;
        this.isFlying = def.isFlying || false;
        this.isBomber = def.isBomber || false;
        this.isSpitter = def.isSpitter || false;

        this.hitFlashTimer = 0;
        this.attackCooldown = 0;

        this.burnTimer = 0;
        this.freezeTimer = 0;
        this.poisonTimer = 0;
        this.bleedTimer = 0;
    }

    takeDamage(amount, knockbackAngle = 0, knockbackForce = 0, element = null) {
        this.health -= amount;
        this.hitFlashTimer = 0.1;

        if (knockbackForce > 0) {
            this.x += Math.cos(knockbackAngle) * knockbackForce * 4;
            this.y += Math.sin(knockbackAngle) * knockbackForce * 4;
        }

        if (element === 'burn') this.burnTimer = 3.0;
        if (element === 'freeze') this.freezeTimer = 2.0;
        if (element === 'poison') this.poisonTimer = 4.0;
        if (element === 'bleed') this.bleedTimer = 3.0;
    }

    update(dt, player, spatialGrid, spawnEnemyProjectileCallback) {
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.health -= 15 * dt;
            if (Math.random() < 0.2) particleManager.spawn(this.x, this.y, 0, -1, 3, '#ef4444', 0.3, 'spark');
        }
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
        }
        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.health -= 10 * dt;
            if (Math.random() < 0.2) particleManager.spawn(this.x, this.y, 0, -1, 3, '#22c55e', 0.3, 'spark');
        }

        const speedMult = this.freezeTimer > 0 ? 0.5 : 1.0;
        const currentSpeed = this.speed * speedMult;

        this.rotation = Vec2.angle(this.x, this.y, player.x, player.y);
        this.x += Math.cos(this.rotation) * currentSpeed * dt * 60;
        this.y += Math.sin(this.rotation) * currentSpeed * dt * 60;

        if (spatialGrid) {
            const nearby = spatialGrid.getNearby(this.x, this.y, this.radius * 2);
            for (let i = 0; i < nearby.length; i++) {
                const other = nearby[i];
                if (other !== this) {
                    const dist = Vec2.dist(this.x, this.y, other.x, other.y);
                    const minDist = this.radius + other.radius;
                    if (dist < minDist && dist > 0) {
                        const overlap = (minDist - dist) * 0.5;
                        const nx = (this.x - other.x) / dist;
                        const ny = (this.y - other.y) / dist;
                        this.x += nx * overlap;
                        this.y += ny * overlap;
                    }
                }
            }
        }

        // Ranged Acid Spitter AI
        if (this.isSpitter) {
            if (this.attackCooldown > 0) {
                this.attackCooldown -= dt;
            } else {
                const dist = Vec2.dist(this.x, this.y, player.x, player.y);
                if (dist < 400 && spawnEnemyProjectileCallback) {
                    spawnEnemyProjectileCallback(this.x, this.y, this.rotation, 7, this.damage, '#22c55e');
                    this.attackCooldown = 3.0; // 3s firing cooldown
                }
            }
        } else {
            // Melee Attack Collision
            if (this.attackCooldown > 0) {
                this.attackCooldown -= dt;
            } else {
                const d = Vec2.dist(this.x, this.y, player.x, player.y);
                if (d < (this.radius + player.radius)) {
                    if (this.isBomber) {
                        player.takeDamage(this.damage * 2);
                        particleManager.spawnExplosion(this.x, this.y, 60);
                        this.health = 0;
                    } else {
                        player.takeDamage(this.damage);
                        this.attackCooldown = 1.0;
                    }
                }
            }
        }
    }

    draw(ctx) {
        const s = saveManager.data.settings;
        SpriteRenderer.drawEnemy(ctx, this, s.highContrast);
    }
}

// --- COMPLETE 30 ENEMY TYPES REGISTRY ---
export const ENEMY_REGISTRY = [
    { id: 'walker_std', name: 'Shambling Walker', health: 40, speed: 1.6, damage: 8, xpValue: 10, color: '#7f1d1d' },
    { id: 'runner_fast', name: 'Frenzied Runner', health: 25, speed: 3.5, damage: 12, xpValue: 15, color: '#dc2626' },
    { id: 'crawler', name: 'Low Crawler', health: 20, speed: 1.2, damage: 6, xpValue: 8, radius: 12, color: '#991b1b' },
    { id: 'tank_hulk', name: 'Armored Tank', health: 220, speed: 1.1, damage: 25, xpValue: 50, radius: 26, color: '#450a0a' },
    { id: 'bomber_suicide', name: 'Volatile Bomber', health: 35, speed: 2.8, damage: 40, xpValue: 30, isBomber: true, color: '#f59e0b' },
    { id: 'acid_spitter', name: 'Acid Spitter', health: 50, speed: 1.8, damage: 15, xpValue: 25, isSpitter: true, color: '#22c55e' },
    { id: 'screamer', name: 'Banshee Screamer', health: 45, speed: 2.2, damage: 10, xpValue: 20, color: '#c084fc' },
    { id: 'flying_spectre', name: 'Flying Spectre', health: 30, speed: 3.2, damage: 14, xpValue: 22, isFlying: true, color: '#38bdf8' },
    { id: 'military_heavy', name: 'Infected Soldier', health: 120, speed: 1.7, damage: 18, xpValue: 40, color: '#16a34a' },
    { id: 'mutant_beast', name: 'Mutant Abomination', health: 300, speed: 1.4, damage: 32, xpValue: 80, radius: 30, color: '#b91c1c' },
    { id: 'toxic_ghoul', name: 'Toxic Ghoul', health: 60, speed: 2.0, damage: 14, xpValue: 28, isSpitter: true, color: '#10b981' },
    { id: 'stalker_shadow', name: 'Shadow Stalker', health: 40, speed: 3.8, damage: 16, xpValue: 35, color: '#4c1d95' },
    { id: 'plague_bearer', name: 'Plague Bearer', health: 150, speed: 1.3, damage: 22, xpValue: 60, radius: 24, color: '#047857' },
    { id: 'armored_officer', name: 'Riot Cop Zombie', health: 180, speed: 1.5, damage: 20, xpValue: 55, radius: 22, color: '#1e3a8a' },
    { id: 'berserker_brute', name: 'Berserker Brute', health: 250, speed: 2.4, damage: 28, xpValue: 75, radius: 28, color: '#9f1239' },
    { id: 'feral_hound', name: 'Feral Undead Dog', health: 20, speed: 4.2, damage: 10, xpValue: 18, radius: 10, color: '#b45309' },
    { id: 'bio_hazard_zombie', name: 'Hazmat Zombie', health: 80, speed: 1.6, damage: 12, xpValue: 32, isSpitter: true, color: '#84cc16' },
    { id: 'hulk_crusher', name: 'Hulk Crusher', health: 350, speed: 1.0, damage: 35, xpValue: 90, radius: 32, color: '#3f6212' },
    { id: 'cyborg_zombie', name: 'Cybernetic Corpse', health: 140, speed: 2.1, damage: 22, xpValue: 50, color: '#0284c7' },
    { id: 'crawler_nest', name: 'Crawler Broodling', health: 15, speed: 2.5, damage: 5, xpValue: 6, radius: 8, color: '#78350f' },
    { id: 'spore_flayer', name: 'Spore Flayer', health: 90, speed: 2.0, damage: 15, xpValue: 38, isSpitter: true, color: '#a855f7' },
    { id: 'spectral_wraith', name: 'Spectral Wraith', health: 35, speed: 3.4, damage: 18, xpValue: 30, isFlying: true, color: '#06b6d4' },
    { id: 'fire_demon', name: 'Charred Abomination', health: 110, speed: 2.2, damage: 20, xpValue: 45, isBomber: true, color: '#ea580c' },
    { id: 'frost_zombie', name: 'Cryo Zombie', health: 95, speed: 1.5, damage: 14, xpValue: 36, color: '#38bdf8' },
    { id: 'venom_stalker', name: 'Venom Stalker', health: 70, speed: 3.0, damage: 16, xpValue: 34, isSpitter: true, color: '#15803d' },
    { id: 'swat_zombie', name: 'SWAT Specialist', health: 210, speed: 1.8, damage: 24, xpValue: 65, radius: 22, color: '#1e293b' },
    { id: 'dread_lord', name: 'Dread Commander', health: 400, speed: 1.2, damage: 40, xpValue: 120, radius: 34, color: '#581c87' },
    { id: 'acid_fiend', name: 'Acid Fiend', health: 130, speed: 2.3, damage: 18, xpValue: 48, isSpitter: true, color: '#22c55e' },
    { id: 'infernal_crawler', name: 'Infernal Crawler', health: 30, speed: 2.8, damage: 12, xpValue: 16, radius: 10, color: '#b91c1c' },
    { id: 'void_walker', name: 'Void Walker', health: 160, speed: 2.6, damage: 26, xpValue: 70, isFlying: true, color: '#6b21a8' }
];
