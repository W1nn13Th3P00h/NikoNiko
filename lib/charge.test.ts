import { describe, expect, it } from "vitest";
import { computeCharge } from "./charge";

describe("computeCharge", () => {
  it("multiplies planned duration by RPE", () => {
    expect(computeCharge(58, 7)).toBe(406);
  });

  it("rounds to the nearest integer", () => {
    expect(computeCharge(45, 6)).toBe(270);
    expect(computeCharge(33, 5)).toBe(165);
  });
});
