/**
 * DEAD SHIFT - 5 Multi-Phase Bosses & Special Mechanics
 */
import { Vec2 } from './physics.js';
import { SpriteRenderer } from './sprites.js';
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';

export class Boss {
    constructor(bossDef, x, y) {
        this.id = bossDef.id;
        this.name = bossDef.name;
        this.x = x;
        this.y = y;
        this.radius = bossDef.radius || 42;
        this.rotation = 0;

        this.maxHealth = bossDef.health || 2500;
        this.health = this.maxHealth;
        this.speed = bossDef.speed || 1.8;
        this.phase = 1;
        this.phaseColor = '#ef4444';
        this.color = '#450a0a';
        this.hitFlashTimer = 0;

        this.attackTimer = 0;
        this.specialTimer = 0;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlashTimer = 0.1;

        // Phase Transition Trigger at 50% HP
        if (this.phase === 1 && this.health <= this.maxHealth * 0.5) {
            this.phase = 2;
            this.phaseColor = '#f97316';
            audioManager.playExplosion();
            particleManager.spawnExplosion(this.x, this.y, 80);
            particleManager.addScreenShake(20, 0.6);
        }
    }

    update(dt, player, spawnMinionCallback, spawnProjectileCallback) {
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        // Rotate toward player
        this.rotation = Vec2.angle(this.x, this.y, player.x, player.y);

        // Movement Speed increases in Phase 2
        const currentSpeed = this.speed * (this.phase === 2 ? 1.3 : 1.0);
        this.x += Math.cos(this.rotation) * currentSpeed * dt * 60;
        this.y += Math.sin(this.rotation) * currentSpeed * dt * 60;

        // Special Boss Attack Timers
        this.attackTimer += dt;
        if (this.attackTimer >= (this.phase === 2 ? 2.5 : 4.0)) {
            this.attackTimer = 0;
            this.executeSpecialAttack(player, spawnMinionCallback, spawnProjectileCallback);
        }

        // Melee Contact Damage with Player
        const d = Vec2.dist(this.x, this.y, player.x, player.y);
        if (d < (this.radius + player.radius)) {
            player.takeDamage(this.phase === 2 ? 35 : 25);
        }
    }

    executeSpecialAttack(player, spawnMinionCallback, spawnProjectileCallback) {
        audioManager.playExplosion();
        particleManager.addScreenShake(12, 0.3);

        if (this.id === 'boss_abomination') {
            // 360 Degree Spike Ring Attack
            const count = this.phase === 2 ? 16 : 8;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                if (spawnProjectileCallback) {
                    spawnProjectileCallback(this.x, this.y, angle, 8, 20, '#ef4444');
                }
            }
        } else if (this.id === 'boss_mother') {
            // Summon Minions Swarm
            if (spawnMinionCallback) {
                spawnMinionCallback('runner_fast', this.x + 30, this.y + 30);
                spawnMinionCallback('runner_fast', this.x - 30, this.y - 30);
            }
        } else if (this.id === 'boss_cyber_lich') {
            // Laser Grid Barrage
            for (let i = -2; i <= 2; i++) {
                const angle = this.rotation + i * 0.15;
                if (spawnProjectileCallback) {
                    spawnProjectileCallback(this.x, this.y, angle, 12, 15, '#38bdf8');
                }
            }
        } else {
            // Ground Quake Shockwave
            particleManager.spawnBurst(this.x, this.y, '#f59e0b', 30, 8, 5, 'spark');
        }
    }

    draw(ctx) {
        SpriteRenderer.drawBoss(ctx, this);
    }
}

export const BOSS_REGISTRY = [
    { id: 'boss_abomination', name: 'THE ABOMINATION', health: 3000, speed: 1.6, radius: 45 },
    { id: 'boss_mother', name: 'MOTHER OF SWARMS', health: 2600, speed: 1.4, radius: 42 },
    { id: 'boss_cyber_lich', name: 'CYBER-LICH ARCHON', health: 3200, speed: 2.0, radius: 40 },
    { id: 'boss_behemoth', name: 'TITAN BEHEMOTH', health: 4500, speed: 1.2, radius: 52 },
    { id: 'boss_patient_zero', name: 'PATIENT ZERO', health: 6000, speed: 2.2, radius: 48 }
];
