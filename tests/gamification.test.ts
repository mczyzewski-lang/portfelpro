import { describe, expect, it } from "vitest";
import { achievementsFor, levelFor } from "@/lib/gamification";

const zero = { clicks: 0, leads: 0, clients: 0, paid: 0, servicesShared: 0, stagesUsed: 0, handoffs: 0 };

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
