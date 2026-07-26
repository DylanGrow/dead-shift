/**
 * DEAD SHIFT - Loot Drops & Magnetic Pickup Engine
 */
import { Vec2 } from './physics.js';
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';

export class LootItem {
    constructor(x, y, type = 'xp', value = 15, color = '#c084fc') {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp', 'coin', 'ammo', 'health', 'key', 'token', 'magnet'
        this.value = value;
        this.radius = 6;
        this.color = color;
        this.active = true;

        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.friction = 0.92;
        this.isPulled = false;
    }

    update(dt, player) {
        if (!this.active) return;

        // Apply friction after initial scatter spawn
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Magnetic Attraction toward player
        const dist = Vec2.dist(this.x, this.y, player.x, player.y);
        const magnetDist = player.pickupRadius;

        if (dist < magnetDist || this.isPulled) {
            this.isPulled = true;
            const angle = Vec2.angle(this.x, this.y, player.x, player.y);
            const speed = 12;
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
        }

        // Collection Trigger
        if (dist < (this.radius + player.radius)) {
            this.active = false;
            this.applyToPlayer(player);
        }
    }

    applyToPlayer(player) {
        audioManager.playPickup();
        particleManager.spawnBurst(this.x, this.y, this.color, 6, 2, 2);

        if (this.type === 'xp') {
            player.addXP(this.value);
        } else if (this.type === 'coin') {
            player.coins += Math.round(this.value * player.luck);
        } else if (this.type === 'health') {
            player.health = Math.min(player.maxHealth, player.health + this.value);
        } else if (this.type === 'ammo') {
            const wep = player.getActiveWeapon();
            if (wep) wep.ammo = wep.clipSize;
        } else if (this.type === 'key') {
            player.keys += 1;
        } else if (this.type === 'token') {
            player.tokens += 1;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }
}
