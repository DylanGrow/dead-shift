/**
 * DEAD SHIFT - Collision Detection Functions
 */
import { Vec2 } from './physics.js';

export class Collision {
    // Circle vs Circle
    static circleCircle(x1, y1, r1, x2, y2, r2) {
        const d = Vec2.dist(x1, y1, x2, y2);
        return d < (r1 + r2);
    }

    // Circle vs AABB Box (for walls & obstacles)
    static circleAABB(cx, cy, r, bx, by, bw, bh) {
        const closestX = Vec2.clamp(cx, bx, bx + bw);
        const closestY = Vec2.clamp(cy, by, by + bh);
        const d = Vec2.dist(cx, cy, closestX, closestY);
        return d < r;
    }

    // Line Segment vs Circle (for fast bullet raycasting)
    static lineCircle(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len === 0) return Vec2.dist(x1, y1, cx, cy) < r;

        const u = ((cx - x1) * dx + (cy - y1) * dy) / (len * len);
        const clampedU = Vec2.clamp(u, 0, 1);
        const nearestX = x1 + clampedU * dx;
        const nearestY = y1 + clampedU * dy;

        return Vec2.dist(nearestX, nearestY, cx, cy) < r;
    }
}
