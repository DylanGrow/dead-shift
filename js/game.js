/**
 * DEAD SHIFT - Main Game Loop & Core Engine State Machine
 */
import { Player } from './player.js';
import { Weapon, WEAPON_REGISTRY } from './weapon.js';
import { Enemy, ENEMY_REGISTRY } from './enemy.js';
import { Boss, BOSS_REGISTRY } from './boss.js';
import { LootItem } from './loot.js';
import { SupplyDropManager } from './drops.js';
import { MapEnvironment, MAPS_REGISTRY } from './maps.js';
import { EventManager } from './events.js';
import { SpatialGrid, Vec2 } from './physics.js';
import { Collision } from './collision.js';
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';
import { saveManager } from './save.js';
import { uiManager } from './ui.js';
import { ShopManager } from './shop.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.fxCanvas = document.getElementById('fxCanvas');
        this.fxCtx = this.fxCanvas.getContext('2d');

        this.state = 'MAIN_MENU'; // 'MAIN_MENU', 'PLAYING', 'PAUSED', 'PERK_MODAL', 'GAME_OVER'
        this.lastTime = 0;
        this.fps = 60;
        this.dps = 0;
        this.totalDamageDealt = 0;
        this.dpsTimer = 0;

        this.camera = { x: 0, y: 0 };
        this.player = null;
        this.map = null;
        this.spatialGrid = null;
        this.supplyDropManager = null;
        this.eventManager = null;

        this.enemies = [];
        this.projectiles = [];
        this.lootItems = [];
        this.boss = null;

        this.wave = 1;
        this.waveTimer = 120; // 2 minutes per wave
        this.enemySpawnTimer = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupUIEvents();
        this.registerServiceWorker();

        // Start Loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.fxCanvas.width = window.innerWidth;
        this.fxCanvas.height = window.innerHeight;
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js').catch(err => {
                console.log('Service Worker registration skipped:', err);
            });
        }
    }

    setupUIEvents() {
        document.getElementById('btnPlay').addEventListener('click', () => this.startNewRun());
        document.getElementById('btnShop').addEventListener('click', () => {
            this.state = 'SHOP';
            document.querySelectorAll('.ui-screen').forEach(s => s.classList.remove('active'));
            document.getElementById('shopScreen').classList.add('active');
            ShopManager.renderShop(document.getElementById('shopContentArea'));
        });
        document.getElementById('btnShopBack').addEventListener('click', () => this.showMenu());
        document.getElementById('btnSettings').addEventListener('click', () => {
            document.querySelectorAll('.ui-screen').forEach(s => s.classList.remove('active'));
            document.getElementById('settingsScreen').classList.add('active');
        });
        document.getElementById('btnSettingsBack').addEventListener('click', () => this.showMenu());
        document.getElementById('btnRetryRun').addEventListener('click', () => this.startNewRun());
        document.getElementById('btnReturnMenu').addEventListener('click', () => this.showMenu());
        document.getElementById('btnResume').addEventListener('click', () => this.resumeGame());

        // Keyboard Pause Event
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.state === 'PLAYING') {
                this.pauseGame();
            }
        });
    }

    showMenu() {
        this.state = 'MAIN_MENU';
        audioManager.stopMusic();
        document.querySelectorAll('.ui-screen').forEach(s => s.classList.remove('active'));
        document.getElementById('mainMenu').classList.add('active');
    }

    startNewRun() {
        document.querySelectorAll('.ui-screen').forEach(s => s.classList.remove('active'));
        document.getElementById('hud').classList.add('active');

        this.map = new MapEnvironment(MAPS_REGISTRY[0]);
        this.spatialGrid = new SpatialGrid(this.map.width, this.map.height, 128);

        this.player = new Player(this.map.width / 2, this.map.height / 2);
        
        // Give starting M1911 Pistol
        const startingWep = new Weapon(WEAPON_REGISTRY[0]);
        this.player.weapons.push(startingWep);

        this.enemies = [];
        this.projectiles = [];
        this.lootItems = [];
        this.boss = null;
        this.wave = 1;
        this.waveTimer = 120;
        this.totalDamageDealt = 0;

        this.supplyDropManager = new SupplyDropManager();
        this.eventManager = new EventManager();

        this.state = 'PLAYING';
        audioManager.startMusic();
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        document.getElementById('pauseModal').classList.remove('hidden');
    }

    resumeGame() {
        this.state = 'PLAYING';
        document.getElementById('pauseModal').classList.add('hidden');
    }

    triggerLevelUpModal() {
        this.state = 'PERK_MODAL';
        uiManager.renderPerkModal(this.player, () => {
            this.state = 'PLAYING';
        });
    }

    triggerGameOver() {
        this.state = 'GAME_OVER';
        audioManager.stopMusic();
        saveManager.addCoins(this.player.coins);
        document.getElementById('gameOverModal').classList.remove('hidden');
        document.getElementById('gameOverSubtitle').innerText = `Survived Wave ${this.wave} | Coins Earned: ${this.player.coins}`;
    }

    spawnWaveEnemies(dt) {
        if (this.boss) return; // Don't spawn normal wave enemies during boss fight

        this.enemySpawnTimer += dt;
        const spawnInterval = Math.max(0.3, 2.0 - (this.wave * 0.15));

        if (this.enemySpawnTimer >= spawnInterval && this.enemies.length < 250) {
            this.enemySpawnTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            const dist = 700;
            const ex = this.player.x + Math.cos(angle) * dist;
            const ey = this.player.y + Math.sin(angle) * dist;

            const isElite = Math.random() < 0.08;
            const randDef = ENEMY_REGISTRY[Math.floor(Math.random() * ENEMY_REGISTRY.length)];
            this.enemies.push(new Enemy(randDef, ex, ey, isElite));
        }
    }

    loop(timestamp) {
        const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000 || 0.016);
        this.fps = 1 / dt;
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Wave Timer Update
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            this.waveTimer = 120;
            this.wave++;
            if (this.wave % 5 === 0) {
                // Spawn Boss on Wave 5, 10, 15
                const bossDef = BOSS_REGISTRY[(this.wave / 5 - 1) % BOSS_REGISTRY.length];
                this.boss = new Boss(bossDef, this.player.x + 300, this.player.y + 300);
            }
        }

        // Camera Follow Player
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        // Populate Spatial Grid
        this.spatialGrid.clear();
        this.enemies.forEach(e => this.spatialGrid.insert(e));

        // Update Player & Weapon Firing
        this.player.update(dt, this.camera, { minX: 0, minY: 0, maxX: this.map.width, maxY: this.map.height }, this.enemies);

        // Spawn Projectiles from Firing
        const activeWep = this.player.getActiveWeapon();
        if (activeWep && activeWep.cooldownTimer <= 0) {
            const newProjs = activeWep.fire(this.player);
            newProjs.forEach(p => this.projectiles.push(p));
        }

        // Update Projectiles & Collision with Enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt);

            if (!p.active) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check Boss Collision
            if (this.boss && Collision.circleCircle(p.x, p.y, p.radius, this.boss.x, this.boss.y, this.boss.radius)) {
                this.boss.takeDamage(p.damage);
                uiManager.constructor.spawnFloatingText(p.x - this.camera.x, p.y - this.camera.y, p.damage, p.isCrit ? '#f59e0b' : '#ffffff', p.isCrit);
                p.active = false;
                if (this.boss.health <= 0) {
                    particleManager.spawnExplosion(this.boss.x, this.boss.y, 100);
                    this.boss = null;
                    this.player.coins += 500;
                }
                continue;
            }

            // Check Enemy Collision via Spatial Grid
            const nearbyEnemies = this.spatialGrid.getNearby(p.x, p.y, 64);
            for (let j = 0; j < nearbyEnemies.length; j++) {
                const enemy = nearbyEnemies[j];
                if (Collision.circleCircle(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
                    enemy.takeDamage(p.damage, Vec2.angle(p.x, p.y, enemy.x, enemy.y), p.knockback, p.element);
                    this.totalDamageDealt += p.damage;
                    uiManager.constructor.spawnFloatingText(enemy.x - this.camera.x, enemy.y - this.camera.y, p.damage, p.isCrit ? '#f59e0b' : '#ffffff', p.isCrit);

                    if (p.pierce > 0) {
                        p.pierce--;
                    } else {
                        p.active = false;
                    }

                    if (p.isExplosive) {
                        particleManager.spawnExplosion(p.x, p.y, p.explosionRadius);
                    }
                    break;
                }
            }
        }

        // Update Enemies & Remove Defeated
        this.spawnWaveEnemies(dt);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.player, this.spatialGrid);

            if (enemy.health <= 0) {
                // Enemy Death
                audioManager.playHit();
                particleManager.spawnBlood(enemy.x, enemy.y, enemy.rotation, 12);
                
                // Spawn XP Drop
                this.lootItems.push(new LootItem(enemy.x, enemy.y, 'xp', enemy.xpValue, '#c084fc'));
                if (Math.random() < enemy.coinDropChance) {
                    this.lootItems.push(new LootItem(enemy.x + 10, enemy.y, 'coin', 10, '#f59e0b'));
                }

                this.enemies.splice(i, 1);
            }
        }

        // Update Boss
        if (this.boss) {
            this.boss.update(dt, this.player, (type, x, y) => {
                this.enemies.push(new Enemy(ENEMY_REGISTRY[1], x, y));
            });
        }

        // Update Loot & Check Collection
        for (let i = this.lootItems.length - 1; i >= 0; i--) {
            const item = this.lootItems[i];
            item.update(dt, this.player);
            if (!item.active) {
                if (item.type === 'xp') {
                    const leveledUp = this.player.addXP(0); // XP already added in item
                    if (leveledUp) this.triggerLevelUpModal();
                }
                this.lootItems.splice(i, 1);
            }
        }

        // Check Player Death
        if (this.player.health <= 0) {
            this.triggerGameOver();
        }

        // Managers Update
        this.supplyDropManager.update(dt, this.player, { width: this.map.width, height: this.map.height });
        this.eventManager.update(dt, this.player, this.enemies);
        particleManager.update(dt);

        // Update DPS Counter
        this.dpsTimer += dt;
        if (this.dpsTimer >= 1.0) {
            this.dps = this.totalDamageDealt;
            this.totalDamageDealt = 0;
            this.dpsTimer = 0;
        }

        uiManager.updateHUD(this.player, this.wave, this.waveTimer, this.fps, this.dps, this.eventManager.activeEvent, this.boss);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'PERK_MODAL') {
            this.ctx.save();
            particleManager.applyShake(this.ctx);

            // Render Map & Grid Background
            this.map.drawBackground(this.ctx, this.camera);

            this.ctx.save();
            this.ctx.translate(-this.camera.x, -this.camera.y);

            // Render Loot Items
            this.lootItems.forEach(item => item.draw(this.ctx));

            // Render Supply Crates
            this.supplyDropManager.draw(this.ctx);

            // Render Particles
            particleManager.draw(this.ctx);

            // Render Projectiles
            this.projectiles.forEach(p => p.draw(this.ctx));

            // Render Enemies
            this.enemies.forEach(e => e.draw(this.ctx));

            // Render Boss
            if (this.boss) this.boss.draw(this.ctx);

            // Render Player
            this.player.draw(this.ctx);

            this.ctx.restore();
            this.ctx.restore();
        }
    }
}

// Instantiate Engine on Load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
