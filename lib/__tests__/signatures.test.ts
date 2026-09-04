import { describe, expect, it } from "vitest";
import { SIGNATURES, describeArgumentCount, signatureFor } from "@/lib/signatures";

describe("describeArgumentCount", () => {
  it("does not count optional arguments as things you must supply", () => {
    // The review finding: XLOOKUP was announced as "takes 4 arguments".
    expect(describeArgumentCount(SIGNATURES.XLOOKUP)).toBe(
      "3 required arguments and 1 optional argument",
    );
  });

  it("stays plain when every argument is required", () => {
    expect(describeArgumentCount(SIGNATURES.SUM)).toBe("1 argument");
    expect(describeArgumentCount(SIGNATURES.COUNTIF)).toBe("2 arguments");
  });

  it("handles IF, which is two required and one optional", () => {
    expect(describeArgumentCount(SIGNATURES.IF)).toBe(
      "2 required arguments and 1 optional argument",
    );
  });

  it("never says a plural argument when there is one", () => {
    for (const signature of Object.values(SIGNATURES)) {
      expect(describeArgumentCount(signature)).not.toMatch(/\b1 [a-z ]*arguments\b/);
    }
  });

  it("is reachable for every function the lessons can hint", () => {
    for (const fn of Object.keys(SIGNATURES)) {
      expect(signatureFor(fn.toLowerCase())).toBeDefined();
    }
  });
});
