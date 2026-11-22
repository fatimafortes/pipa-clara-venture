import { describe, expect, it } from "vitest";
import { collectionShares, type ShareState } from "./collection";
import { buildProgressMessage } from "./progress";

const labels = ["Depto 1", "Depto 2", "Depto 3", "Doña Rosa", "Depto 5", "Depto 6"];
const states: ShareState[] = ["received", "received", "received", "promised", "received", "received"];
const shares = collectionShares(1_500, 10, labels).map((s, i) => ({ ...s, state: states[i], promisedFor: i === 3 ? "2026-11-27" : null }));

describe("buildProgressMessage", () => {
  it("matches the packet's message", () => {
    expect(buildProgressMessage({ shares, agreedDate: "2026-11-27" })).toBe(
      "Pipa Clara · Juntando para la pipa: 5 de 6 ya dieron su parte. Fecha que acordó el grupo: viernes, 27 de noviembre. Cuando estemos todos, se pide.",
    );
  });

  it("counts only: never a label, an amount or a promise date", () => {
    const text = buildProgressMessage({ shares, agreedDate: null });
    for (const label of labels) expect(text).not.toContain(label);
    expect(text).not.toMatch(/\$/);
    expect(text).not.toContain("promet");
  });

  it("the agreed date is optional", () => {
    expect(buildProgressMessage({ shares })).toBe(
      "Pipa Clara · Juntando para la pipa: 5 de 6 ya dieron su parte. Cuando estemos todos, se pide.",
    );
  });

  it("at 100% says the pipa is ordered", () => {
    const all = shares.map((s) => ({ ...s, state: "received" as const }));
    expect(buildProgressMessage({ shares: all })).toContain("6 de 6 ya dieron su parte. Ya estamos todos: se pide la pipa.");
  });
});
