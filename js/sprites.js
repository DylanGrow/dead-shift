/**
 * DEAD SHIFT - Procedural Canvas Vector Sprite Engine
 * Generates crisp, flat-vector graphics for player, weapons, zombies, bosses, and environmental props.
 */

export class SpriteRenderer {
    // --- DRAW PLAYER ---
    static drawPlayer(ctx, player, isHighContrast = false) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        // Body Glow / Shadow
        ctx.shadowColor = isHighContrast ? '#ffffff' : '#3b82f6';
        ctx.shadowBlur = 12;

        // Player Outer Body Circle
        ctx.beginPath();
        ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = isHighContrast ? '#ffffff' : '#1e293b';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isHighContrast ? '#000000' : '#3b82f6';
        ctx.stroke();

        // Player Armor Vest Overlay
        ctx.beginPath();
        ctx.arc(0, 0, player.radius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();

        // Player Tactical Helmet / Visor
        ctx.beginPath();
        ctx.arc(player.radius * 0.3, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa';
        ctx.fill();

        // Hands holding weapon
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(player.radius * 0.7, -player.radius * 0.5, 4, 0, Math.PI * 2);
        ctx.arc(player.radius * 0.7, player.radius * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Shield Aura (if active)
        if (player.shield > 0) {
            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
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

        // Rarity Color Glow
        let rarityColor = '#94a3b8';
        if (weapon.rarity === 'Uncommon') rarityColor = '#22c55e';
        if (weapon.rarity === 'Rare') rarityColor = '#3b82f6';
        if (weapon.rarity === 'Epic') rarityColor = '#a855f7';
        if (weapon.rarity === 'Legendary') rarityColor = '#f59e0b';
        if (weapon.rarity === 'Mythic') rarityColor = '#f97316';

        ctx.shadowColor = rarityColor;
        ctx.shadowBlur = 8;

        // Weapon Barrel
        ctx.fillStyle = rarityColor;
        const offset = weapon.recoilOffset || 0;
        ctx.fillRect(player.radius * 0.6 - offset, -3, weapon.length || 18, weapon.width || 6);

        // Weapon Sight / Tip
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.radius * 0.6 + (weapon.length || 18) - 2 - offset, -2, 3, 4);

        ctx.restore();
    }

    // --- DRAW ZOMBIE / ENEMY ---
    static drawEnemy(ctx, enemy, isHighContrast = false) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);

        // Flash red on hit
        const isHit = enemy.hitFlashTimer > 0;

        ctx.shadowColor = enemy.color || '#ef4444';
        ctx.shadowBlur = enemy.isElite ? 16 : 6;

        // Enemy Outer Circle
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = isHit ? '#ffffff' : (isHighContrast ? '#ffff00' : (enemy.color || '#991b1b'));
        ctx.fill();
        ctx.lineWidth = enemy.isElite ? 4 : 2;
        ctx.strokeStyle = enemy.isElite ? '#f59e0b' : '#450a0a';
        ctx.stroke();

        // Zombie Arms outstretched
        ctx.fillStyle = isHit ? '#ffffff' : (enemy.color || '#7f1d1d');
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.8, -enemy.radius * 0.6, 5, 0, Math.PI * 2);
        ctx.arc(enemy.radius * 0.8, enemy.radius * 0.6, 5, 0, Math.PI * 2);
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

        // Outer Boss Body
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
        ctx.fillStyle = boss.hitFlashTimer > 0 ? '#ffffff' : (boss.color || '#450a0a');
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = boss.phaseColor || '#f59e0b';
        ctx.stroke();

        // Boss Core spikes / tentacles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(boss.radius, 0);
            ctx.lineTo(boss.radius + 12, -6);
            ctx.lineTo(boss.radius + 12, 6);
            ctx.closePath();
            ctx.fillStyle = boss.phaseColor || '#ef4444';
            ctx.fill();
            ctx.restore();
        }

        // Center Eye / Core
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

    // --- DRAW SUPPLY CRATE ---
    static drawCrate(ctx, crate) {
        ctx.save();
        ctx.translate(crate.x, crate.y);

        ctx.shadowColor = crate.color || '#3b82f6';
        ctx.shadowBlur = 12;

        ctx.fillStyle = crate.color || '#1e293b';
        ctx.fillRect(-crate.size / 2, -crate.size / 2, crate.size, crate.size);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(-crate.size / 2, -crate.size / 2, crate.size, crate.size);

        // Crate Cross Straps
        ctx.beginPath();
        ctx.moveTo(-crate.size / 2, -crate.size / 2);
        ctx.lineTo(crate.size / 2, crate.size / 2);
        ctx.moveTo(crate.size / 2, -crate.size / 2);
        ctx.lineTo(-crate.size / 2, crate.size / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        ctx.restore();
    }
}
