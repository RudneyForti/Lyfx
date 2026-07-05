import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Secondary modules — assets, liabilities, institutions, tags.
 * CRUD round-trips with cross-user isolation on real Postgres.
 */

let currentUserId = "";
vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(async () => {
    if (!currentUserId) throw new Error("Unauthenticated");
    return currentUserId;
  }),
  requireSession: vi.fn(async () => ({ userId: currentUserId, sessionId: "test" })),
  getSessionUserId: vi.fn(async () => currentUserId || null),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/lib/db";
import { getAssets, createAsset, deleteAsset } from "@/app/actions/assets";
import { getLiabilities, createLiability, updateLiability, deleteLiability } from "@/app/actions/liabilities";
import { getInstitutions, createInstitution, deleteInstitution } from "@/app/actions/institutions";
import { getTags, createTag, updateTag, deleteTag } from "@/app/actions/tags";

const EMAILS = ["sec-hugo@test.lyfx", "sec-iris@test.lyfx"];
let hugo = "";
let iris = "";

async function cleanup() {
  const users = await db.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.asset.deleteMany({ where: { userId: { in: ids } } });
    await db.liability.deleteMany({ where: { userId: { in: ids } } });
    await db.institution.deleteMany({ where: { userId: { in: ids } } });
    await db.tag.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}

beforeAll(async () => {
  await cleanup();
  hugo = (await db.user.create({ data: { name: "Hugo", email: EMAILS[0], password: "x" } })).id;
  iris = (await db.user.create({ data: { name: "Iris", email: EMAILS[1], password: "x" } })).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("assets", () => {
  it("creates with local purchase date, lists scoped, deletes scoped", async () => {
    currentUserId = hugo;
    const asset = await createAsset({
      name: "Car", type: "vehicle", purchaseValue: 50000, currentValue: 42000,
      purchaseDate: "2026-03-01",
    });
    expect(asset.purchaseDate!.getMonth()).toBe(2); // March, local — no UTC shift

    expect(await getAssets()).toHaveLength(1);
    currentUserId = iris;
    expect(await getAssets()).toHaveLength(0);

    await deleteAsset(asset.id); // foreign delete — must not remove
    currentUserId = hugo;
    expect(await getAssets()).toHaveLength(1);
    await deleteAsset(asset.id);
    expect(await getAssets()).toHaveLength(0);
  });
});

describe("liabilities", () => {
  it("full CRUD with isolation", async () => {
    currentUserId = hugo;
    const li = await createLiability({
      name: "Card debt", type: "rotativo", currentBalance: 1200,
      interestRate: 12.5, minimumPayment: 100,
    });
    expect(li.currentBalance).toBe(1200);

    await updateLiability(li.id, { currentBalance: 800 });
    expect((await getLiabilities())[0].currentBalance).toBe(800);

    currentUserId = iris;
    expect(await getLiabilities()).toHaveLength(0);

    currentUserId = hugo;
    await deleteLiability(li.id);
    expect(await getLiabilities()).toHaveLength(0);
  });
});

describe("institutions", () => {
  it("validates empty name and isolates per user", async () => {
    currentUserId = hugo;
    expect(await createInstitution({ name: "  ", type: "bank", color: "#fff", icon: "bank" }))
      .toHaveProperty("error");

    const ok = await createInstitution({ name: "Nubank", type: "fintech", color: "#820AD1", icon: "bank" });
    expect(ok).toEqual({ ok: true });

    expect(await getInstitutions()).toHaveLength(1);
    currentUserId = iris;
    expect(await getInstitutions()).toHaveLength(0);

    currentUserId = hugo;
    const [inst] = await getInstitutions();
    await deleteInstitution(inst.id);
    expect(await getInstitutions()).toHaveLength(0);
  });
});

describe("tags", () => {
  it("full CRUD with per-user unique names and isolation", async () => {
    currentUserId = hugo;
    await createTag({ name: "viagem", color: "#22D3EE", icon: "plane" });
    expect(await getTags()).toHaveLength(1);

    // Same name allowed for a DIFFERENT user (unique is [userId, name])
    currentUserId = iris;
    await createTag({ name: "viagem", color: "#F00", icon: "plane" });
    expect(await getTags()).toHaveLength(1);

    currentUserId = hugo;
    const [tag] = await getTags();
    await updateTag(tag.id, { name: "trip" });
    expect((await getTags())[0].name).toBe("trip");

    await deleteTag(tag.id);
    expect(await getTags()).toHaveLength(0);

    currentUserId = iris;
    expect(await getTags()).toHaveLength(1); // Iris's tag untouched
  });
});
