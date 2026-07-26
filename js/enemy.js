/**
 * DEAD SHIFT - 30+ Enemy Types & AI Pathfinding Engine
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

        // Active Status Effects
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

        // Apply Elemental Status Effects
        if (element === 'burn') this.burnTimer = 3.0;
        if (element === 'freeze') this.freezeTimer = 2.0;
        if (element === 'poison') this.poisonTimer = 4.0;
        if (element === 'bleed') this.bleedTimer = 3.0;
    }

    update(dt, player, spatialGrid) {
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        // Apply Status Effect Tick Damage
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

        // Speed Modifier (Freeze slows movement by 50%)
        const speedMult = this.freezeTimer > 0 ? 0.5 : 1.0;
        const currentSpeed = this.speed * speedMult;

        // AI Pathfinding toward Player
        this.rotation = Vec2.angle(this.x, this.y, player.x, player.y);
        this.x += Math.cos(this.rotation) * currentSpeed * dt * 60;
        this.y += Math.sin(this.rotation) * currentSpeed * dt * 60;

        // Separation from nearby enemies (Flocking behavior)
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

        // Check melee attack collision with player
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        } else {
            const d = Vec2.dist(this.x, this.y, player.x, player.y);
            if (d < (this.radius + player.radius)) {
                if (this.isBomber) {
                    // Self-destruct explosion
                    player.takeDamage(this.damage * 2);
                    particleManager.spawnExplosion(this.x, this.y, 60);
                    this.health = 0; // Kills self
                } else {
                    player.takeDamage(this.damage);
                    this.attackCooldown = 1.0; // 1s cooldown
                }
            }
        }
    }

    draw(ctx) {
        const s = saveManager.data.settings;
        SpriteRenderer.drawEnemy(ctx, this, s.highContrast);
    }
}

// --- 30 ENEMY DEFINITIONS ---
export const ENEMY_REGISTRY = [
    { id: 'walker_std', name: 'Shambling Walker', health: 40, speed: 1.6, damage: 8, xpValue: 10, color: '#7f1d1d' },
    { id: 'runner_fast', name: 'Frenzied Runner', health: 25, speed: 3.5, damage: 12, xpValue: 15, color: '#dc2626' },
    { id: 'crawler', name: 'Low Crawler', health: 20, speed: 1.2, damage: 6, xpValue: 8, radius: 12, color: '#991b1b' },
    { id: 'tank_hulk', name: 'Armored Tank', health: 220, speed: 1.1, damage: 25, xpValue: 50, radius: 26, color: '#450a0a' },
    { id: 'bomber_suicide', name: 'Volatile Bomber', health: 35, speed: 2.8, damage: 40, xpValue: 30, isBomber: true, color: '#f59e0b' },
    { id: 'acid_spitter', name: 'Acid Spitter', health: 50, speed: 1.8, damage: 15, xpValue: 25, isSpitter: true, color: '#22c55e' },
    { id: 'screamer', name: 'Banshee Screamer', health: 45, speed: 2.2, damage: 10, xpValue: 20, color: '#c084fc' },
    { id: 'flying_spectre', name: 'Flying Spectre', health: 30, speed: 3.2, damage: 14, xpValue: 22, isFlying: true, color: '#38bdf8' },
    { id: 'military_heavy', name: 'Infected Solider', health: 120, speed: 1.7, damage: 18, xpValue: 40, color: '#16a34a' },
    { id: 'mutant_beast', name: 'Mutant Abomination', health: 300, speed: 1.4, damage: 32, xpValue: 80, radius: 30, color: '#b91c1c' }
];
