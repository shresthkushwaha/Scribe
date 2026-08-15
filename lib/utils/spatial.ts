/**
 * lib/utils/spatial.ts
 * Spatial Intelligence utilities for Node placement and collision avoidance.
 */

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculates radial points on a circle.
 */
export function calculateRadialPoints(center: Point, count: number, radius: number): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const theta = (2 * Math.PI * i) / count;
    return {
      x: center.x + radius * Math.cos(theta),
      y: center.y + radius * Math.sin(theta)
    };
  });
}

/**
 * Returns the bounding box for a set of nodes.
 */
export function calculateBoundingBox(nodes: { x: number; y: number; r: number }[]): BoundingBox {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  
  return nodes.reduce(
    (bb, n) => ({
      minX: Math.min(bb.minX, n.x - n.r),
      minY: Math.min(bb.minY, n.y - n.r),
      maxX: Math.max(bb.maxX, n.x + n.r),
      maxY: Math.max(bb.maxY, n.y + n.r)
    }),
    { minX: nodes[0].x, minY: nodes[0].y, maxX: nodes[0].x, maxY: nodes[0].y }
  );
}

/**
 * Finds a void space for a new cluster.
 * Searches in a spiraling pattern until a suitable gap is found.
 */
export function findVoidSpace(
  occupiedNodes: { x: number; y: number; r: number }[],
  dimensions: { width: number; height: number },
  minDistance: number = 300,
  startPos: Point = { x: 0, y: 0 }
): Point {
  const isSafe = (pos: Point) => {
    return occupiedNodes.every(node => {
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist > (node.r + minDistance);
    });
  };

  // Spiral search
  let angle = 0;
  let radius = 0;
  const stepRadius = 50;
  const stepAngle = Math.PI / 4;

  while (radius < 2000) { // Safety limit
    const candidate = {
      x: startPos.x + radius * Math.cos(angle),
      y: startPos.y + radius * Math.sin(angle)
    };

    if (isSafe(candidate)) {
      return candidate;
    }

    angle += stepAngle;
    if (angle >= 2 * Math.PI) {
      angle = 0;
      radius += stepRadius;
    }
  }

  return startPos; // Fallback
}
