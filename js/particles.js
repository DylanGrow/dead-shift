/**
 * DEAD SHIFT - High-Performance Canvas Particle System, Decals & Post-FX
 */

class Decal {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 2;
        this.color = '#ffffff';
        this.alpha = 1;
        this.life = 1;
        this.maxLife = 1;
        this.shape = 'circle';
    }

    init(x, y, vx, vy, size, color, maxLife, shape = 'circle') {
        this.active = true;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.alpha = 1;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.shape = shape;
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;

        if (this.shape === 'square') {
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else if (this.shape === 'spark') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fill();
        } else if (this.shape === 'casing') {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(this.x, this.y, 4, 2);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

export class ParticleManager {
    constructor(poolSize = 1000) {
        this.pool = Array.from({ length: poolSize }, () => new Particle());
        this.decals = [];
        this.maxDecals = 300;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    spawn(x, y, vx, vy, size, color, maxLife, shape) {
        const p = this.pool.find(item => !item.active);
        if (p) p.init(x, y, vx, vy, size, color, maxLife, shape);
    }

    spawnBurst(x, y, color, count = 12, speed = 4, size = 3, shape = 'circle') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = (Math.random() * 0.7 + 0.3) * speed;
            const vx = Math.cos(angle) * spd;
            const vy = Math.sin(angle) * spd;
            const life = Math.random() * 0.3 + 0.2;
            this.spawn(x, y, vx, vy, size, color, life, shape);
        }
    }

    spawnCasing(x, y, angle) {
        const casingAngle = angle - Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        const spd = Math.random() * 3 + 2;
        const vx = Math.cos(casingAngle) * spd;
        const vy = Math.sin(casingAngle) * spd;
        this.spawn(x, y, vx, vy, 3, '#f59e0b', 0.6, 'casing');
    }

    spawnBlood(x, y, angle, count = 15) {
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 1.2;
            const spd = Math.random() * 6 + 1;
            const vx = Math.cos(angle + spread) * spd;
            const vy = Math.sin(angle + spread) * spd;
            const size = Math.random() * 3.5 + 1.5;
            const color = Math.random() > 0.3 ? '#dc2626' : '#991b1b';
            this.spawn(x, y, vx, vy, size, color, Math.random() * 0.6 + 0.4, 'circle');
        }

        // Add persistent blood decal to floor
        if (this.decals.length >= this.maxDecals) this.decals.shift();
        this.decals.push(new Decal(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, Math.random() * 12 + 6, 'rgba(153, 27, 27, 0.45)'));
    }

    spawnExplosion(x, y, radius = 40) {
        this.spawnBurst(x, y, '#ef4444', 25, 8, 5, 'spark');
        this.spawnBurst(x, y, '#f59e0b', 20, 6, 4, 'spark');
        this.spawnBurst(x, y, '#64748b', 15, 3, 6, 'circle');
        this.addScreenShake(12, 0.4);
    }

    addScreenShake(intensity = 8, duration = 0.3) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = duration;
    }

    update(dt) {
        this.pool.forEach(p => p.update(dt));
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            if (this.shakeTimer <= 0) {
                this.shakeIntensity = 0;
            }
        }
    }

    applyShake(ctx) {
        if (this.shakeTimer > 0 && this.shakeIntensity > 0) {
            const rx = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const ry = (Math.random() - 0.5) * this.shakeIntensity * 2;
            ctx.translate(rx, ry);
        }
    }

    drawDecals(ctx) {
        this.decals.forEach(d => d.draw(ctx));
    }

    draw(ctx) {
        this.pool.forEach(p => p.draw(ctx));
    }
}

export const particleManager = new ParticleManager();
