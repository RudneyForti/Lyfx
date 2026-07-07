/**
 * Orthogonal edge routing with obstacle avoidance — A* over a visibility grid.
 *
 * Powers the Studio ERD relationship lines (Power BI model-view behavior):
 * lines travel in axis-aligned segments, never cross table boxes, and stay
 * inside the canvas bounds. Pure module — no React, no DOM — so the routing
 * behavior is unit-testable in isolation.
 *
 * Algorithm: the candidate coordinates are the inflated obstacle edges, the
 * bounds edges, the start/end coordinates, and the centers of wide gaps
 * (aesthetic lanes). A* runs over the (x, y) grid of those coordinates with a
 * bend penalty, so paths prefer few turns — the visual signature of Power BI
 * routing. If no path exists at the requested clearance, the caller retries
 * with smaller margins before falling back to a direct route.
 */

export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Side = "left" | "right";

/** Cost equivalent (in px) added for every 90° turn — fewer bends win. */
const BEND_PENALTY = 32;
/** Coordinates closer than this are merged into a single grid lane. */
const EPS = 0.5;
/** Gaps wider than this get a center lane so lines don't hug box borders. */
const MID_LANE_MIN_GAP = 24;

export function inflate(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

/** Strict containment — points on the border are considered outside. */
export function rectContainsStrict(r: Rect, p: Pt): boolean {
  return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
}

/**
 * Does an axis-aligned segment cross the interior of a rect?
 * Touching the border does not count (strict inequalities) so paths may run
 * exactly along an inflated obstacle edge.
 */
export function segmentIntersectsRect(a: Pt, b: Pt, r: Rect): boolean {
  if (a.y === b.y) {
    const [x0, x1] = a.x <= b.x ? [a.x, b.x] : [b.x, a.x];
    return a.y > r.y && a.y < r.y + r.h && x1 > r.x && x0 < r.x + r.w;
  }
  if (a.x === b.x) {
    const [y0, y1] = a.y <= b.y ? [a.y, b.y] : [b.y, a.y];
    return a.x > r.x && a.x < r.x + r.w && y1 > r.y && y0 < r.y + r.h;
  }
  // Non-axis-aligned segments are not produced by this router.
  throw new Error("segmentIntersectsRect: segment must be axis-aligned");
}

function hBlocked(y: number, x0: number, x1: number, obs: Rect[]): boolean {
  const [lo, hi] = x0 <= x1 ? [x0, x1] : [x1, x0];
  for (const r of obs) {
    if (y > r.y && y < r.y + r.h && hi > r.x && lo < r.x + r.w) return true;
  }
  return false;
}

function vBlocked(x: number, y0: number, y1: number, obs: Rect[]): boolean {
  const [lo, hi] = y0 <= y1 ? [y0, y1] : [y1, y0];
  for (const r of obs) {
    if (x > r.x && x < r.x + r.w && hi > r.y && lo < r.y + r.h) return true;
  }
  return false;
}

function buildAxis(values: number[], lo: number, hi: number): number[] {
  const clamped = values
    .map((v) => Math.min(Math.max(v, lo), hi))
    .sort((a, b) => a - b);
  const uniq: number[] = [];
  for (const v of clamped) {
    if (!uniq.length || v - uniq[uniq.length - 1] > EPS) uniq.push(v);
  }
  // Center lanes inside wide gaps — lines prefer open space over box borders.
  const withMid: number[] = [];
  for (let i = 0; i < uniq.length; i++) {
    withMid.push(uniq[i]);
    if (i + 1 < uniq.length && uniq[i + 1] - uniq[i] > MID_LANE_MIN_GAP) {
      withMid.push((uniq[i] + uniq[i + 1]) / 2);
    }
  }
  return withMid;
}

/** Direction indices: 0=+x, 1=-x, 2=+y, 3=-y. */
const DX = [1, -1, 0, 0];
const DY = [0, 0, 1, -1];

export interface RouteOptions {
  start: Pt;
  /** Side of the source box the line exits from — first move must go this way. */
  startSide: Side;
  end: Pt;
  /** Side of the target box the anchor sits on — last move must arrive from it. */
  endSide: Side;
  /** Obstacles, already inflated by the desired clearance. */
  obstacles: Rect[];
  /** The routing area — the path never leaves it. */
  bounds: Rect;
}

/**
 * A* orthogonal route from start to end. Returns the simplified polyline
 * (including start and end) or null when no route exists at this clearance.
 */
export function routeOrthogonal(opts: RouteOptions): Pt[] | null {
  const { start, startSide, end, endSide, bounds } = opts;
  // An obstacle that swallows an endpoint would make the route impossible —
  // happens mid-drag when boxes overlap. Ignore those rects for this edge.
  const obs = opts.obstacles.filter(
    (r) => !rectContainsStrict(r, start) && !rectContainsStrict(r, end)
  );

  const xs = buildAxis(
    [bounds.x, bounds.x + bounds.w, start.x, end.x, ...obs.flatMap((r) => [r.x, r.x + r.w])],
    bounds.x,
    bounds.x + bounds.w
  );
  const ys = buildAxis(
    [bounds.y, bounds.y + bounds.h, start.y, end.y, ...obs.flatMap((r) => [r.y, r.y + r.h])],
    bounds.y,
    bounds.y + bounds.h
  );

  const xi = (v: number) => xs.findIndex((x) => Math.abs(x - v) <= EPS);
  const yi = (v: number) => ys.findIndex((y) => Math.abs(y - v) <= EPS);
  const sx = xi(start.x), sy = yi(start.y), ex = xi(end.x), ey = yi(end.y);
  if (sx < 0 || sy < 0 || ex < 0 || ey < 0) return null;

  const W = xs.length, H = ys.length;
  // State = grid node × arrival direction (bends are direction changes).
  const stateId = (x: number, y: number, dir: number) => (y * W + x) * 4 + dir;
  const gScore = new Map<number, number>();
  const parent = new Map<number, number>();
  const heuristic = (x: number, y: number) =>
    Math.abs(xs[x] - xs[ex]) + Math.abs(ys[y] - ys[ey]);

  // Binary min-heap of [f, g, x, y, dir]
  type HeapNode = [number, number, number, number, number];
  const heap: HeapNode[] = [];
  const push = (n: HeapNode) => {
    heap.push(n);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): HeapNode | undefined => {
    if (!heap.length) return undefined;
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  // The first move must exit through startSide.
  const startDir = startSide === "right" ? 0 : 1;
  // The last move must arrive from endSide (anchor on left edge ⇒ moving +x).
  const requiredEndDir = endSide === "left" ? 0 : 1;

  {
    const nx = sx + DX[startDir];
    if (nx >= 0 && nx < W && !hBlocked(ys[sy], xs[sx], xs[nx], obs)) {
      const g = Math.abs(xs[nx] - xs[sx]);
      const id = stateId(nx, sy, startDir);
      gScore.set(id, g);
      parent.set(id, -1);
      push([g + heuristic(nx, sy), g, nx, sy, startDir]);
    }
  }

  let endState = -1;
  while (heap.length) {
    const [, g, cx, cy, cdir] = pop()!;
    const cid = stateId(cx, cy, cdir);
    if (g > (gScore.get(cid) ?? Infinity)) continue; // stale heap entry
    if (cx === ex && cy === ey) {
      if (cdir === requiredEndDir) { endState = cid; break; }
      continue;
    }
    for (let dir = 0; dir < 4; dir++) {
      // No U-turns — reversing direction never belongs to an optimal path.
      // With DX/DY ordered [+x, -x, +y, -y], the opposite of dir is dir ^ 1.
      if ((dir ^ 1) === cdir) continue;
      const nx = cx + DX[dir], ny = cy + DY[dir];
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const blocked = dir < 2
        ? hBlocked(ys[cy], xs[cx], xs[nx], obs)
        : vBlocked(xs[cx], ys[cy], ys[ny], obs);
      if (blocked) continue;
      const stepCost = dir < 2 ? Math.abs(xs[nx] - xs[cx]) : Math.abs(ys[ny] - ys[cy]);
      const ng = g + stepCost + (dir === cdir ? 0 : BEND_PENALTY);
      const nid = stateId(nx, ny, dir);
      if (ng < (gScore.get(nid) ?? Infinity)) {
        gScore.set(nid, ng);
        parent.set(nid, cid);
        push([ng + heuristic(nx, ny), ng, nx, ny, dir]);
      }
    }
  }
  if (endState === -1) return null;

  // Reconstruct, then merge collinear points.
  const rev: Pt[] = [];
  for (let id = endState; id !== -1; id = parent.get(id)!) {
    const node = Math.floor(id / 4);
    rev.push({ x: xs[node % W], y: ys[Math.floor(node / W)] });
  }
  rev.push({ x: xs[sx], y: ys[sy] });
  rev.reverse();
  return simplifyCollinear(rev);
}

export function simplifyCollinear(pts: Pt[]): Pt[] {
  if (pts.length <= 2) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const collinear = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!collinear) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * High-level entry: route between two box anchors with progressively relaxed
 * clearance. Never returns null — the last resort is the direct 3-segment
 * route (which may overlap boxes, but only when the layout is unroutable,
 * e.g. mid-drag with boxes stacked on top of each other).
 */
export function routeEdge(
  start: Pt,
  startSide: Side,
  end: Pt,
  endSide: Side,
  obstacles: Rect[],
  bounds: Rect,
  clearances: number[] = [8, 4, 1]
): Pt[] {
  for (const m of clearances) {
    const path = routeOrthogonal({
      start, startSide, end, endSide,
      obstacles: obstacles.map((r) => inflate(r, m)),
      bounds,
    });
    if (path) return path;
  }
  const midX = (start.x + end.x) / 2;
  return simplifyCollinear([start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]);
}

/** SVG path for an orthogonal polyline with rounded corners. */
export function roundedOrthPath(pts: Pt[], radius = 6): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const parts = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const inLen = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    const outLen = Math.abs(c.x - b.x) + Math.abs(c.y - b.y);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    if (r < 0.75) {
      parts.push(`L ${b.x} ${b.y}`);
      continue;
    }
    const inDx = Math.sign(b.x - a.x), inDy = Math.sign(b.y - a.y);
    const outDx = Math.sign(c.x - b.x), outDy = Math.sign(c.y - b.y);
    parts.push(
      `L ${b.x - inDx * r} ${b.y - inDy * r}`,
      `Q ${b.x} ${b.y} ${b.x + outDx * r} ${b.y + outDy * r}`
    );
  }
  const last = pts[pts.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(" ");
}
