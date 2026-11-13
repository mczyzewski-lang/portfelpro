import { describe, expect, it } from "vitest";
import { achievementsFor, levelFor, newSince } from "@/lib/gamification";

const zero = { clicks: 0, leads: 0, clients: 0, paid: 0, servicesShared: 0, stagesUsed: 0, handoffs: 0, starterConfirmed: false, hasPhoto: false };

describe("gwiazdy (poziomy)", () => {
  it("zaczyna od gwiazdy Lodowej i liczy brakujących klientów", () => {
    expect(levelFor(0)).toMatchObject({ index: 0, missing: 1, progress: 0 });
    expect(levelFor(0).current).toMatchObject({ name: "Lodowa", tier: "ice" });
  });
  it("progi: 1, 5, 20 i 50 potwierdzonych klientów", () => {
    expect(levelFor(1).current.name).toBe("Szklana");
    expect(levelFor(3)).toMatchObject({ missing: 2, progress: 0.5 });
    expect(levelFor(5).current.name).toBe("Brązowa");
    expect(levelFor(20).current.name).toBe("Srebrna");
    expect(levelFor(49).current.name).toBe("Srebrna");
    expect(levelFor(50)).toMatchObject({ next: null, progress: 1, missing: 0 });
    expect(levelFor(50).current).toMatchObject({ name: "Złota", tier: "gold" });
  });
});

describe("osiągnięcia", () => {
  it("nic nie jest odblokowane bez danych", () => {
    expect(achievementsFor(zero).every((a) => !a.done)).toBe(true);
  });
  it("odblokowuje się wyłącznie na podstawie faktycznych liczb", () => {
    const list = achievementsFor({ ...zero, clicks: 4, leads: 2, clients: 1, stagesUsed: 2, handoffs: 1 });
    const done = list.filter((a) => a.done).map((a) => a.id);
    expect(done).toEqual(["first-click", "first-lead", "first-client", "two-paths", "handoff"]);
    expect(list.find((a) => a.id === "ten-clients")?.description).toContain("niespodzianka");
    expect(list.find((a) => a.id === "ten-leads")).toMatchObject({ current: 2, target: 10, done: false });
  });
});

describe("dalekie progi", () => {
  it("20, 30 i 45 klientów to zapowiedzi, dopóki nie zostaną zdobyte", () => {
    const list = achievementsFor({ ...zero, clients: 21 });
    expect(list.filter((a) => a.teaser).map((a) => [a.id, a.done])).toEqual([["twenty-clients", true], ["thirty-clients", false], ["forty-five-clients", false]]);
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
