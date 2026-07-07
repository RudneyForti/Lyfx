import { describe, it, expect } from "vitest";
import {
  routeOrthogonal,
  routeEdge,
  segmentIntersectsRect,
  simplifyCollinear,
  roundedOrthPath,
  inflate,
  type Pt,
  type Rect,
} from "@/lib/erd-router";

const BOUNDS: Rect = { x: 0, y: 0, w: 1000, h: 600 };

/** Asserts that no segment of the path crosses any of the given rects. */
function expectPathAvoids(path: Pt[], rects: Rect[]) {
  for (let i = 0; i < path.length - 1; i++) {
    for (const r of rects) {
      expect(
        segmentIntersectsRect(path[i], path[i + 1], r),
        `segment ${JSON.stringify(path[i])}→${JSON.stringify(path[i + 1])} crosses ${JSON.stringify(r)}`
      ).toBe(false);
    }
  }
}

function expectPathInBounds(path: Pt[], b: Rect) {
  for (const p of path) {
    expect(p.x).toBeGreaterThanOrEqual(b.x);
    expect(p.x).toBeLessThanOrEqual(b.x + b.w);
    expect(p.y).toBeGreaterThanOrEqual(b.y);
    expect(p.y).toBeLessThanOrEqual(b.y + b.h);
  }
}

function expectOrthogonal(path: Pt[]) {
  for (let i = 0; i < path.length - 1; i++) {
    const sameX = path[i].x === path[i + 1].x;
    const sameY = path[i].y === path[i + 1].y;
    expect(sameX || sameY).toBe(true);
  }
}

describe("segmentIntersectsRect", () => {
  const r: Rect = { x: 10, y: 10, w: 20, h: 20 };

  it("detects a horizontal segment crossing the rect", () => {
    expect(segmentIntersectsRect({ x: 0, y: 20 }, { x: 40, y: 20 }, r)).toBe(true);
  });

  it("detects a vertical segment crossing the rect", () => {
    expect(segmentIntersectsRect({ x: 20, y: 0 }, { x: 20, y: 40 }, r)).toBe(true);
  });

  it("does not flag a segment running along the border", () => {
    expect(segmentIntersectsRect({ x: 0, y: 10 }, { x: 40, y: 10 }, r)).toBe(false);
    expect(segmentIntersectsRect({ x: 30, y: 0 }, { x: 30, y: 40 }, r)).toBe(false);
  });

  it("does not flag a segment fully outside", () => {
    expect(segmentIntersectsRect({ x: 0, y: 50 }, { x: 100, y: 50 }, r)).toBe(false);
  });

  it("rejects diagonal segments", () => {
    expect(() => segmentIntersectsRect({ x: 0, y: 0 }, { x: 5, y: 5 }, r)).toThrow();
  });
});

describe("routeOrthogonal", () => {
  it("routes a straight horizontal line when nothing blocks it", () => {
    const path = routeOrthogonal({
      start: { x: 100, y: 100 },
      startSide: "right",
      end: { x: 400, y: 100 },
      endSide: "left",
      obstacles: [],
      bounds: BOUNDS,
    });
    expect(path).not.toBeNull();
    expect(path).toEqual([
      { x: 100, y: 100 },
      { x: 400, y: 100 },
    ]);
  });

  it("routes around a box sitting between the endpoints", () => {
    const box: Rect = { x: 200, y: 50, w: 100, h: 100 }; // blocks y=100
    const path = routeOrthogonal({
      start: { x: 100, y: 100 },
      startSide: "right",
      end: { x: 400, y: 100 },
      endSide: "left",
      obstacles: [box],
      bounds: BOUNDS,
    })!;
    expect(path).not.toBeNull();
    expectOrthogonal(path);
    expectPathAvoids(path, [box]);
    expectPathInBounds(path, BOUNDS);
  });

  it("respects the exit side (startSide left forces the first move left)", () => {
    const path = routeOrthogonal({
      start: { x: 300, y: 100 },
      startSide: "left",
      end: { x: 500, y: 300 },
      endSide: "right",
      obstacles: [],
      bounds: BOUNDS,
    })!;
    expect(path).not.toBeNull();
    // First segment must go in -x
    expect(path[1].y).toBe(path[0].y);
    expect(path[1].x).toBeLessThan(path[0].x);
    // Last segment must arrive moving -x (anchor on the right side)
    const a = path[path.length - 2], b = path[path.length - 1];
    expect(a.y).toBe(b.y);
    expect(a.x).toBeGreaterThan(b.x);
  });

  it("navigates a slalom of multiple obstacles", () => {
    const obstacles: Rect[] = [
      { x: 150, y: 0, w: 60, h: 250 },
      { x: 300, y: 120, w: 60, h: 480 },
      { x: 450, y: 0, w: 60, h: 250 },
    ];
    const path = routeOrthogonal({
      start: { x: 50, y: 100 },
      startSide: "right",
      end: { x: 700, y: 100 },
      endSide: "left",
      obstacles,
      bounds: BOUNDS,
    })!;
    expect(path).not.toBeNull();
    expectOrthogonal(path);
    expectPathAvoids(path, obstacles);
    expectPathInBounds(path, BOUNDS);
  });

  it("stays inside bounds even when the detour would prefer to leave", () => {
    // Wall almost touching the top edge — path must squeeze or go below.
    const wall: Rect = { x: 200, y: 4, w: 40, h: 560 };
    const path = routeOrthogonal({
      start: { x: 100, y: 300 },
      startSide: "right",
      end: { x: 400, y: 300 },
      endSide: "left",
      obstacles: [wall],
      bounds: BOUNDS,
    })!;
    expect(path).not.toBeNull();
    expectPathAvoids(path, [wall]);
    expectPathInBounds(path, BOUNDS);
  });

  it("returns null when the target is fully walled off", () => {
    // Box completely enclosed by four walls with no gaps.
    const walls: Rect[] = [
      { x: 300, y: 100, w: 200, h: 10 },
      { x: 300, y: 290, w: 200, h: 10 },
      { x: 300, y: 100, w: 10, h: 200 },
      { x: 490, y: 100, w: 10, h: 200 },
    ];
    const path = routeOrthogonal({
      start: { x: 50, y: 50 },
      startSide: "right",
      end: { x: 400, y: 200 },
      endSide: "left",
      obstacles: walls,
      bounds: BOUNDS,
    });
    expect(path).toBeNull();
  });

  it("ignores an obstacle that swallows an endpoint (mid-drag overlap)", () => {
    const swallowing: Rect = { x: 80, y: 80, w: 60, h: 60 }; // contains start
    const path = routeOrthogonal({
      start: { x: 100, y: 100 },
      startSide: "right",
      end: { x: 400, y: 100 },
      endSide: "left",
      obstacles: [swallowing],
      bounds: BOUNDS,
    });
    expect(path).not.toBeNull();
  });

  it("handles U-turn routes (both anchors on the same side)", () => {
    // Two boxes stacked in the same column, both anchors exiting right.
    const boxA: Rect = { x: 100, y: 50, w: 175, h: 60 };
    const boxB: Rect = { x: 100, y: 200, w: 175, h: 60 };
    const path = routeOrthogonal({
      start: { x: 283, y: 80 }, // right of boxA + 8
      startSide: "right",
      end: { x: 283, y: 230 }, // right of boxB + 8
      endSide: "right",
      obstacles: [inflate(boxA, 8), inflate(boxB, 8)],
      bounds: BOUNDS,
    })!;
    expect(path).not.toBeNull();
    expectOrthogonal(path);
    expectPathAvoids(path, [boxA, boxB]);
  });
});

describe("routeEdge (relaxation wrapper)", () => {
  it("returns a clean route at full clearance when space allows", () => {
    const box: Rect = { x: 200, y: 50, w: 100, h: 100 };
    const path = routeEdge(
      { x: 100, y: 100 }, "right",
      { x: 400, y: 100 }, "left",
      [box],
      BOUNDS
    );
    expectPathAvoids(path, [box]);
  });

  it("relaxes clearance in tight corridors instead of failing", () => {
    // Corridor of 6px between two walls — impossible at clearance 8, fine at 1.
    const walls: Rect[] = [
      { x: 200, y: 0, w: 40, h: 297 },
      { x: 200, y: 303, w: 40, h: 297 },
    ];
    const path = routeEdge(
      { x: 100, y: 300 }, "right",
      { x: 400, y: 300 }, "left",
      walls,
      BOUNDS
    );
    expectPathAvoids(path, walls);
  });

  it("falls back to a direct route only when truly unroutable", () => {
    const walls: Rect[] = [
      { x: 300, y: 100, w: 200, h: 10 },
      { x: 300, y: 290, w: 200, h: 10 },
      { x: 300, y: 100, w: 10, h: 200 },
      { x: 490, y: 100, w: 10, h: 200 },
    ];
    const path = routeEdge(
      { x: 50, y: 50 }, "right",
      { x: 400, y: 200 }, "left",
      walls,
      BOUNDS
    );
    // Fallback still returns a connected orthogonal polyline.
    expect(path[0]).toEqual({ x: 50, y: 50 });
    expect(path[path.length - 1]).toEqual({ x: 400, y: 200 });
    expectOrthogonal(path);
  });
});

describe("simplifyCollinear", () => {
  it("merges consecutive collinear points", () => {
    expect(
      simplifyCollinear([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
      ])
    ).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ]);
  });

  it("keeps bends", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(simplifyCollinear(pts)).toEqual(pts);
  });
});

describe("roundedOrthPath", () => {
  it("produces a single line for two points", () => {
    expect(roundedOrthPath([{ x: 0, y: 5 }, { x: 100, y: 5 }])).toBe("M 0 5 L 100 5");
  });

  it("emits a quadratic curve at each bend", () => {
    const d = roundedOrthPath(
      [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }],
      6
    );
    expect(d).toContain("Q 50 0");
  });

  it("shrinks the radius on short segments instead of overshooting", () => {
    const d = roundedOrthPath(
      [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 50 }],
      6
    );
    // Radius is capped at half the 4px segment → curve anchored at x=2.
    expect(d).toContain("L 2 0");
  });
});
