/**
 * DEAD SHIFT - Player Entity, Character Classes & 21 Stats Engine
 */
import { Vec2 } from './physics.js';
import { SpriteRenderer } from './sprites.js';
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';
import { saveManager } from './save.js';

export const CHARACTER_CLASSES = [
    { id: 'commando', name: 'Commando', desc: 'Balanced combat specialist. Starts with M1911 & Assault Rifle', icon: '🪖', hpMod: 1.2, armorMod: 2, moveMod: 1.0 },
    { id: 'pyro', name: 'Pyro Tech', desc: 'Flame expert. Starts with Flamethrower & Fire damage bonus', icon: '🔥', hpMod: 1.0, armorMod: 0, moveMod: 1.1 },
    { id: 'ninja', name: 'Cyber Ninja', desc: 'Blade assassin. Starts with Ronin Katana & +30% Move Speed', icon: '🥷', hpMod: 0.9, armorMod: 0, moveMod: 1.3 },
    { id: 'demolitionist', name: 'Demolitionist', desc: 'Explosive expert. Starts with RPG-7 & Heavy Armor', icon: '💣', hpMod: 1.4, armorMod: 4, moveMod: 0.9 }
];

export class Player {
    constructor(x, y, charClassId = 'commando') {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.rotation = 0;
        this.charClass = charClassId;

        const charDef = CHARACTER_CLASSES.find(c => c.id === charClassId) || CHARACTER_CLASSES[0];

        // Base 21 Stats
        this.maxHealth = Math.round(100 * charDef.hpMod);
        this.health = this.maxHealth;
        this.armor = charDef.armorMod;
        this.maxShield = 0;
        this.shield = 0;
        this.shieldRegenTimer = 0;

        this.maxStamina = 100;
        this.stamina = 100;
        this.moveSpeed = 4.5 * charDef.moveMod;
        this.dashSpeed = 12;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;

        this.reloadSpeed = 1.0;
        this.fireRate = 1.0;
        this.damage = 1.0;
        this.critChance = 0.05;
        this.critDamage = 1.5;
        this.range = 1.0;
        this.projSpeed = 1.0;
        this.knockback = 1.0;
        this.luck = 1.0;
        this.xpGain = 1.0;
        this.pickupRadius = 80;
        this.coins = 0;
        this.keys = 0;
        this.tokens = 0;
        this.revives = 0;
        this.lifeSteal = 0.0;

        this.level = 1;
        this.xp = 0;
        this.nextLevelXP = 100;

        // Dual Weapon Slots [Primary (0), Secondary (1)]
        this.weapons = [];
        this.activeWeaponIndex = 0;

        this.orbitals = [];
        this.keysPressed = {};
        this.mousePos = { x: 0, y: 0 };
        this.touchMoveVector = { x: 0, y: 0 };
        this.isMouseDown = false;

        this.setupInputListeners();
        this.applyPurchasedPassives();
    }

    applyPurchasedPassives() {
        const pass = saveManager.data.purchasedPassives;
        if (pass.maxHealth) this.maxHealth += pass.maxHealth * 20;
        this.health = this.maxHealth;
        if (pass.armor) this.armor += pass.armor * 2;
        if (pass.moveSpeed) this.moveSpeed += pass.moveSpeed * 0.3;
        if (pass.damage) this.damage += pass.damage * 0.1;
        if (pass.critChance) this.critChance += pass.critChance * 0.03;
        if (pass.pickupRadius) this.pickupRadius += pass.pickupRadius * 20;
        if (pass.xpGain) this.xpGain += pass.xpGain * 0.1;
    }

    setupInputListeners() {
        window.addEventListener('keydown', (e) => {
            this.keysPressed[e.code] = true;
            if (e.code === 'Space') this.triggerDash();

            // Weapon Swapping Shortcuts
            if (e.code === 'Digit1') this.switchWeapon(0);
            if (e.code === 'Digit2') this.switchWeapon(1);
        });
        window.addEventListener('keyup', (e) => {
            this.keysPressed[e.code] = false;
        });
        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.isMouseDown = true;
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isMouseDown = false;
        });
        window.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) this.switchWeapon(1);
            else if (e.deltaY < 0) this.switchWeapon(0);
        });
    }

    switchWeapon(index) {
        if (this.weapons[index]) {
            this.activeWeaponIndex = index;
            audioManager.playShot('melee');
        }
    }

    triggerDash() {
        if (this.dashCooldown <= 0 && this.stamina >= 30) {
            this.stamina -= 30;
            this.isDashing = true;
            this.dashTimer = 0.25;
            this.dashCooldown = 1.2;
            audioManager.playShot('melee');
            particleManager.spawnBurst(this.x, this.y, '#3b82f6', 10, 4, 3);
        }
    }

    getActiveWeapon() {
        return this.weapons[this.activeWeaponIndex] || null;
    }

    takeDamage(amount) {
        if (this.isDashing) return;

        const s = saveManager.data.settings;
        let actualDamage = Math.max(1, amount - this.armor);

        if (this.shield > 0) {
            if (this.shield >= actualDamage) {
                this.shield -= actualDamage;
                actualDamage = 0;
            } else {
                actualDamage -= this.shield;
                this.shield = 0;
            }
        }

        if (actualDamage > 0) {
            this.health -= actualDamage;
            audioManager.playHit();
            if (s.screenShake) particleManager.addScreenShake(8, 0.2);
            if (s.bloodToggle) particleManager.spawnBlood(this.x, this.y, Math.random() * Math.PI * 2, 8);
        }

        this.shieldRegenTimer = 3.0;
    }

    addXP(amount) {
        this.xp += amount * this.xpGain;
        if (this.xp >= this.nextLevelXP) {
            this.xp -= this.nextLevelXP;
            this.level++;
            this.nextLevelXP = Math.floor(this.nextLevelXP * 1.25);
            audioManager.playLevelUp();
            particleManager.spawnBurst(this.x, this.y, '#c084fc', 20, 6, 4, 'spark');
            return true;
        }
        return false;
    }

    update(dt, camera, mapBounds, enemies = []) {
        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) this.isDashing = false;
        }

        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
        }
        if (this.maxShield > 0 && this.shield < this.maxShield) {
            if (this.shieldRegenTimer > 0) {
                this.shieldRegenTimer -= dt;
            } else {
                this.shield = Math.min(this.maxShield, this.shield + 15 * dt);
            }
        }

        let vx = 0;
        let vy = 0;

        if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) vy -= 1;
        if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) vy += 1;
        if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) vx -= 1;
        if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) vx += 1;

        if (this.touchMoveVector.x !== 0 || this.touchMoveVector.y !== 0) {
            vx = this.touchMoveVector.x;
            vy = this.touchMoveVector.y;
        }

        const len = Math.hypot(vx, vy);
        if (len > 0) {
            const currentSpeed = this.isDashing ? this.dashSpeed : this.moveSpeed;
            this.x += (vx / len) * currentSpeed * dt * 60;
            this.y += (vy / len) * currentSpeed * dt * 60;
        }

        this.x = Vec2.clamp(this.x, this.radius + mapBounds.minX, mapBounds.maxX - this.radius);
        this.y = Vec2.clamp(this.y, this.radius + mapBounds.minY, mapBounds.maxY - this.radius);

        const s = saveManager.data.settings;
        if (s.autoAim && enemies.length > 0) {
            let closestDist = Infinity;
            let targetEnemy = null;
            for (const enemy of enemies) {
                const d = Vec2.dist(this.x, this.y, enemy.x, enemy.y);
                if (d < closestDist) {
                    closestDist = d;
                    targetEnemy = enemy;
                }
            }
            if (targetEnemy) {
                this.rotation = Vec2.angle(this.x, this.y, targetEnemy.x, targetEnemy.y);
            }
        } else {
            const worldMouseX = this.mousePos.x + camera.x;
            const worldMouseY = this.mousePos.y + camera.y;
            this.rotation = Vec2.angle(this.x, this.y, worldMouseX, worldMouseY);
        }

        const activeWep = this.getActiveWeapon();
        if (activeWep) {
            activeWep.update(dt, this);
            if ((this.isMouseDown || s.autoFire) && activeWep.canFire()) {
                activeWep.fire(this);
            }
        }

        this.orbitals.forEach(o => o.update(dt, this.x, this.y));
    }

    draw(ctx) {
        const s = saveManager.data.settings;

        // Render Dynamic Flashlight Cone if enabled
        if (s.settingFlashlight !== false) {
            SpriteRenderer.drawFlashlightCone(ctx, this);
        }

        SpriteRenderer.drawPlayer(ctx, this, s.highContrast);
        const activeWep = this.getActiveWeapon();
        if (activeWep) {
            SpriteRenderer.drawWeapon(ctx, this, activeWep);
        }
        this.orbitals.forEach(o => o.draw(ctx));
    }
}
