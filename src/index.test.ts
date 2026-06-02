import { describe, expect, it } from "vitest";
import { greet } from "./index.js";

describe("greet", () => {
  it("returns a greeting with the given name", () => {
    expect(greet("world")).toBe("Hello, world!");
  });

  it("includes the name in the output", () => {
    expect(greet("TypeScript")).toContain("TypeScript");
  });
});
