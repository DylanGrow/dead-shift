/**
 * DEAD SHIFT - Procedural Canvas Vector Sprite Engine & Dynamic Lighting
 */

export class SpriteRenderer {
    // --- DRAW DYNAMIC FLASHLIGHT CONE ---
    static drawFlashlightCone(ctx, player) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        const coneAngle = Math.PI / 4; // 45 degree cone
        const coneDistance = 450;

        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, coneDistance);
        grad.addColorStop(0, 'rgba(255, 255, 230, 0.35)');
        grad.addColorStop(0.5, 'rgba(255, 255, 200, 0.15)');
        grad.addColorStop(1, 'rgba(255, 255, 180, 0)');

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, coneDistance, -coneAngle / 2, coneAngle / 2);
        ctx.closePath();

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }

    // --- DRAW PLAYER WITH CHARACTER CLASS SPECIFICS ---
    static drawPlayer(ctx, player, isHighContrast = false) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        // Player Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowOffsetY = 6;
        ctx.shadowBlur = 8;

        // Character Class Color Accents
        let classColor = '#3b82f6';
        if (player.charClass === 'pyro') classColor = '#ef4444';
        if (player.charClass === 'ninja') classColor = '#c084fc';
        if (player.charClass === 'demolitionist') classColor = '#f59e0b';

        // Outer Body Circle
        ctx.beginPath();
        ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = isHighContrast ? '#ffffff' : '#1e293b';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isHighContrast ? '#000000' : classColor;
        ctx.stroke();

        // Inner Tactical Vest Overlay
        ctx.beginPath();
        ctx.arc(0, 0, player.radius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = classColor;
        ctx.fill();

        // Tactical Helmet / Visor
        ctx.beginPath();
        ctx.arc(player.radius * 0.35, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa';
        ctx.fill();

        // Hands
        ctx.fillStyle = classColor;
        ctx.beginPath();
        ctx.arc(player.radius * 0.7, -player.radius * 0.5, 4, 0, Math.PI * 2);
        ctx.arc(player.radius * 0.7, player.radius * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Reload Progress Ring Indicator
        const activeWep = player.getActiveWeapon();
        if (activeWep && activeWep.isReloading) {
            ctx.save();
            ctx.translate(player.x, player.y);
            const progress = 1 - (activeWep.reloadTimer / (activeWep.reloadTime / player.reloadSpeed));
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }

        // Shield Aura
        if (player.shield > 0) {
            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.restore();
        }
    }

    // --- DRAW WEAPON ON PLAYER ---
    static drawWeapon(ctx, player, weapon) {
        if (!weapon) return;

        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation + (weapon.recoilAngle || 0));

        let rarityColor = '#94a3b8';
        if (weapon.rarity === 'Uncommon') rarityColor = '#22c55e';
        if (weapon.rarity === 'Rare') rarityColor = '#3b82f6';
        if (weapon.rarity === 'Epic') rarityColor = '#a855f7';
        if (weapon.rarity === 'Legendary') rarityColor = '#f59e0b';
        if (weapon.rarity === 'Mythic') rarityColor = '#f97316';

        ctx.shadowColor = rarityColor;
        ctx.shadowBlur = 10;

        // Weapon Body
        ctx.fillStyle = rarityColor;
        const offset = weapon.recoilOffset || 0;
        ctx.fillRect(player.radius * 0.6 - offset, -3, weapon.length || 18, weapon.width || 6);

        // Muzzle Sight Tip
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.radius * 0.6 + (weapon.length || 18) - 2 - offset, -2, 3, 4);

        ctx.restore();
    }

    // --- DRAW ZOMBIE / ENEMY ---
    static drawEnemy(ctx, enemy, isHighContrast = false) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);

        const isHit = enemy.hitFlashTimer > 0;

        ctx.shadowColor = enemy.color || '#ef4444';
        ctx.shadowBlur = enemy.isElite ? 16 : 6;

        // Enemy Circle Body
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = isHit ? '#ffffff' : (isHighContrast ? '#ffff00' : (enemy.color || '#991b1b'));
        ctx.fill();
        ctx.lineWidth = enemy.isElite ? 4 : 2;
        ctx.strokeStyle = enemy.isElite ? '#f59e0b' : '#450a0a';
        ctx.stroke();

        // Arms Outstretched
        ctx.fillStyle = isHit ? '#ffffff' : (enemy.color || '#7f1d1d');
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.85, -enemy.radius * 0.5, 4.5, 0, Math.PI * 2);
        ctx.arc(enemy.radius * 0.85, enemy.radius * 0.5, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Eyes
        ctx.fillStyle = isHit ? '#ff0000' : '#fef08a';
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.4, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(enemy.radius * 0.4, 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // --- DRAW BOSS ---
    static drawBoss(ctx, boss) {
        ctx.save();
        ctx.translate(boss.x, boss.y);
        ctx.rotate(boss.rotation);

        ctx.shadowColor = boss.phaseColor || '#ef4444';
        ctx.shadowBlur = 24;

        ctx.beginPath();
        ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
        ctx.fillStyle = boss.hitFlashTimer > 0 ? '#ffffff' : (boss.color || '#450a0a');
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = boss.phaseColor || '#f59e0b';
        ctx.stroke();

        // Spikes around body
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(boss.radius, 0);
            ctx.lineTo(boss.radius + 14, -6);
            ctx.lineTo(boss.radius + 14, 6);
            ctx.closePath();
            ctx.fillStyle = boss.phaseColor || '#ef4444';
            ctx.fill();
            ctx.restore();
        }

        // Center Glowing Core
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
