/**
 * DEAD SHIFT - Random Mid-Mission Events Engine
 */
import { particleManager } from './particles.js';
import { audioManager } from './audio.js';

export class EventManager {
    constructor() {
        this.activeEvent = null;
        this.eventTimer = 0;
        this.nextEventCooldown = 30; // Event every 30s
    }

    update(dt, player, enemies = []) {
        if (this.activeEvent) {
            this.eventTimer -= dt;
            if (this.eventTimer <= 0) {
                this.activeEvent = null;
            } else {
                // Active Event Effects
                if (this.activeEvent.id === 'meteor_shower') {
                    if (Math.random() < 0.05) {
                        const mx = player.x + (Math.random() - 0.5) * 600;
                        const my = player.y + (Math.random() - 0.5) * 600;
                        particleManager.spawnExplosion(mx, my, 70);
                    }
                }
            }
        } else {
            this.nextEventCooldown -= dt;
            if (this.nextEventCooldown <= 0) {
                this.triggerRandomEvent();
                this.nextEventCooldown = 60;
            }
        }
    }

    triggerRandomEvent() {
        const events = [
            { id: 'blood_moon', title: 'BLOOD MOON ACTIVE', icon: '🩸', duration: 20 },
            { id: 'acid_storm', title: 'ACID STORM WARNING', icon: '☣️', duration: 15 },
            { id: 'meteor_shower', title: 'METEOR SHOWER INCOMING', icon: '☄️', duration: 15 },
            { id: 'loot_rain', title: 'GOLDEN LOOT RAIN', icon: '🪙', duration: 25 }
        ];

        this.activeEvent = events[Math.floor(Math.random() * events.length)];
        this.eventTimer = this.activeEvent.duration;
        audioManager.playExplosion();
        particleManager.addScreenShake(15, 0.4);
    }
}
