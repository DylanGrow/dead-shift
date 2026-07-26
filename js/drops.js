/**
 * DEAD SHIFT - Mid-Mission Supply Drops & Crates Engine
 */
import { Vec2 } from './physics.js';
import { SpriteRenderer } from './sprites.js';
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';

export class SupplyCrate {
    constructor(x, y, type = 'medical') {
        this.x = x;
        this.y = y;
        this.type = type; // 'medical', 'ammo', 'weapon', 'legendary', 'mystery', 'explosive'
        this.size = 28;
        this.active = true;
        this.requiresKey = (type === 'weapon' || type === 'legendary');

        if (type === 'medical') this.color = '#22c55e';
        else if (type === 'ammo') this.color = '#38bdf8';
        else if (type === 'weapon') this.color = '#a855f7';
        else if (type === 'legendary') this.color = '#f59e0b';
        else if (type === 'explosive') this.color = '#ef4444';
        else this.color = '#60a5fa';
    }

    interact(player, openWeaponModalCallback) {
        if (!this.active) return false;

        if (this.requiresKey && player.keys <= 0) {
            return false; // Can't open without key
        }

        if (this.requiresKey) player.keys--;

        this.active = false;
        audioManager.playLevelUp();
        particleManager.spawnBurst(this.x, this.y, this.color, 20, 6, 4, 'spark');

        if (this.type === 'medical') {
            player.health = player.maxHealth;
        } else if (this.type === 'ammo') {
            player.weapons.forEach(w => w.ammo = w.clipSize);
        } else if (this.type === 'explosive') {
            particleManager.spawnExplosion(this.x, this.y, 80);
            player.takeDamage(20);
        } else if (openWeaponModalCallback) {
            openWeaponModalCallback(this.type);
        }

        return true;
    }

    draw(ctx) {
        if (!this.active) return;
        SpriteRenderer.drawCrate(ctx, this);
    }
}

export class SupplyDropManager {
    constructor() {
        this.crates = [];
        this.timer = 0;
        this.dropInterval = 45; // Helicopter drop every 45s
    }

    update(dt, player, mapBounds) {
        this.timer += dt;
        if (this.timer >= this.dropInterval) {
            this.timer = 0;
            const rx = player.x + (Math.random() - 0.5) * 400;
            const ry = player.y + (Math.random() - 0.5) * 400;
            const types = ['medical', 'ammo', 'weapon', 'legendary', 'mystery'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.crates.push(new SupplyCrate(rx, ry, type));
            audioManager.playExplosion();
        }

        // Check player interaction range
        this.crates.forEach(crate => {
            const d = Vec2.dist(player.x, player.y, crate.x, crate.y);
            if (d < (crate.size + player.radius) && crate.active) {
                crate.interact(player);
            }
        });
    }

    draw(ctx) {
        this.crates.forEach(c => c.draw(ctx));
    }
}
