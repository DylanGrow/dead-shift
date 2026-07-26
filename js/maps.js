/**
 * DEAD SHIFT - 15 Complete Maps Engine & Interactive Environmental Hazards
 */
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';

export class ExplosiveBarrel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.health = 30;
        this.active = true;
    }

    takeDamage(amount) {
        if (!this.active) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
            particleManager.spawnExplosion(this.x, this.y, 100);
            audioManager.playExplosion();
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', 0, 0);
        ctx.restore();
    }
}

export class MapEnvironment {
    constructor(def) {
        this.id = def.id;
        this.name = def.name;
        this.width = def.width || 3000;
        this.height = def.height || 3000;
        this.bgColor = def.bgColor || '#0f172a';
        this.gridColor = def.gridColor || 'rgba(59, 130, 246, 0.08)';
        this.obstacles = def.obstacles || [];
        this.barrels = [];

        this.spawnBarrels();
    }

    spawnBarrels() {
        for (let i = 0; i < 24; i++) {
            const rx = Math.random() * (this.width - 200) + 100;
            const ry = Math.random() * (this.height - 200) + 100;
            this.barrels.push(new ExplosiveBarrel(rx, ry));
        }
    }

    drawBackground(ctx, camera) {
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        particleManager.drawDecals(ctx);

        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;
        const gridSize = 100;
        for (let x = 0; x < this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        this.obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        });

        this.barrels.forEach(b => b.draw(ctx));

        ctx.restore();
    }
}

// --- COMPLETE 15 MAP DEFINITIONS ---
export const MAPS_REGISTRY = [
    { id: 'downtown', name: 'Downtown Metro', width: 3000, height: 3000, bgColor: '#0b0f19', obstacles: [{ x: 500, y: 500, w: 200, h: 400 }, { x: 1200, y: 800, w: 400, h: 200 }] },
    { id: 'hospital', name: 'Hospital Overrun', width: 3200, height: 3200, bgColor: '#0f172a', obstacles: [{ x: 800, y: 600, w: 300, h: 300 }] },
    { id: 'mall', name: 'Shopping Mall', width: 3500, height: 3500, bgColor: '#111827' },
    { id: 'forest', name: 'Dark Forest', width: 3000, height: 3000, bgColor: '#051d14' },
    { id: 'military', name: 'Military Outpost', width: 4000, height: 4000, bgColor: '#1c1917' },
    { id: 'factory', name: 'Industrial Factory', width: 3400, height: 3400, bgColor: '#18181b' },
    { id: 'airport', name: 'International Airport', width: 4200, height: 4200, bgColor: '#0f172a' },
    { id: 'powerplant', name: 'Power Plant', width: 3600, height: 3600, bgColor: '#172554' },
    { id: 'harbor', name: 'Harbor Docks', width: 3800, height: 3800, bgColor: '#0c4a6e' },
    { id: 'prison', name: 'High-Security Prison', width: 3000, height: 3000, bgColor: '#27272a' },
    { id: 'biolab', name: 'Bio Lab Complex', width: 3200, height: 3200, bgColor: '#022c22' },
    { id: 'subway', name: 'Underground Subway', width: 3000, height: 3000, bgColor: '#090d16' },
    { id: 'school', name: 'Abandoned School', width: 3200, height: 3200, bgColor: '#1e1b4b' },
    { id: 'farm', name: 'Overgrown Farm', width: 3500, height: 3500, bgColor: '#14532d' },
    { id: 'rooftops', name: 'City Rooftops', width: 2800, height: 2800, bgColor: '#030712' }
];
