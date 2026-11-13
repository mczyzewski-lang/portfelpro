import { describe, expect, it } from "vitest";
import { achievementsFor, levelFor, newSince } from "@/lib/gamification";

const zero = { clicks: 0, leads: 0, clients: 0, paid: 0, servicesShared: 0, stagesUsed: 0, handoffs: 0, starterConfirmed: false, hasPhoto: false };

describe("poziomy", () => {
  it("startuje od poziomu Start i liczy brakujących klientów", () => {
    expect(levelFor(0)).toMatchObject({ index: 0, missing: 1, progress: 0 });
    expect(levelFor(0).current.name).toBe("Start");
  });
  it("progi: 1, 3, 10, 25 potwierdzonych klientów", () => {
    expect(levelFor(1).current.name).toBe("Brązowy");
    expect(levelFor(2)).toMatchObject({ missing: 1, progress: 0.5 });
    expect(levelFor(3).current.name).toBe("Srebrny");
    expect(levelFor(10).current.name).toBe("Złoty");
    expect(levelFor(40)).toMatchObject({ next: null, progress: 1, missing: 0 });
  });
});

describe("osiągnięcia", () => {
  it("nic nie jest odblokowane bez danych", () => {
    expect(achievementsFor(zero).every((a) => !a.done)).toBe(true);
  });
  it("odblokowuje się wyłącznie na podstawie faktycznych liczb", () => {
    const list = achievementsFor({ ...zero, clicks: 4, leads: 2, clients: 1, stagesUsed: 2, handoffs: 1 });
    const done = list.filter((a) => a.done).map((a) => a.id);
    expect(done).toEqual(["first-click", "first-lead", "first-client", "handoff"]);
    expect(list.find((a) => a.id === "ten-leads")).toMatchObject({ current: 2, target: 10, done: false });
  });
});

describe("nowości w poziomach", () => {
  it("brak nowości bez żadnych osiągnięć", () => expect(newSince(null, zero).any).toBe(false));
  it("pakiet startowy i nowy poziom są nowością, dopóki partner ich nie zobaczy", () => {
    const stats = { ...zero, starterConfirmed: true, clients: 1, leads: 1 };
    const fresh = newSince({ level: 0, achievements: [] }, stats);
    expect(fresh).toMatchObject({ any: true, levelUp: true });
    expect(fresh.newAchievements).toContain("starter-pack");
    expect(newSince({ level: fresh.level, achievements: fresh.done }, stats).any).toBe(false);
  });
});
