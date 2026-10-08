import { describe, expect, it } from "vitest";
import { fixMojibake } from "@/lib/text";

describe("fixMojibake", () => {
  it("fixes 'Agüero' encoded as Latin-1 mojibake", () => {
    const mojibaked = "AgÃ¼ero";
    expect(fixMojibake(mojibaked)).toBe("Agüero");
  });

  it("fixes 'Núñez' encoded as Latin-1 mojibake", () => {
    const mojibaked = "NÃºÃ±ez";
    expect(fixMojibake(mojibaked)).toBe("Núñez");
  });

  it("fixes 'José' encoded as Latin-1 mojibake", () => {
    const mojibaked = "JosÃ©";
    expect(fixMojibake(mojibaked)).toBe("José");
  });

  it("fixes full name 'Emmanuel Agüero Rojas'", () => {
    const mojibaked = "Emmanuel AgÃ¼ero Rojas";
    expect(fixMojibake(mojibaked)).toBe("Emmanuel Agüero Rojas");
  });

  it("handles already correct UTF-8 text", () => {
    expect(fixMojibake("Emmanuel Agüero Rojas")).toBe("Emmanuel Agüero Rojas");
    expect(fixMojibake("José Núñez")).toBe("José Núñez");
    expect(fixMojibake("María García")).toBe("María García");
  });

  it("handles plain ASCII text", () => {
    expect(fixMojibake("John Smith")).toBe("John Smith");
    expect(fixMojibake("hello world")).toBe("hello world");
  });

  it("handles null/undefined/empty values", () => {
    expect(fixMojibake(null)).toBe("");
    expect(fixMojibake(undefined)).toBe("");
    expect(fixMojibake("")).toBe("");
  });

  it("handles edge cases with various Spanish accented characters", () => {
    const cases = [
      { mojibaked: "CafÃ©", expected: "Café" },
      { mojibaked: "EspaÃ±ol", expected: "Español" },
      { mojibaked: "niÃ±o", expected: "niño" },
      { mojibaked: "SeÃ±or", expected: "Señor" },
      { mojibaked: "corazÃ³n", expected: "corazón" },
    ];

    for (const { mojibaked, expected } of cases) {
      expect(fixMojibake(mojibaked)).toBe(expected);
    }
  });

  it("preserves strings that are already valid UTF-8 with accents", () => {
    const validStrings = [
      "Óscar García",
      "Ángel Martínez",
      "Úrsula López",
      "El señor está aquí",
      "¡Feliz cumpleaños!",
      "¿Cómo estás?",
    ];

    for (const s of validStrings) {
      expect(fixMojibake(s)).toBe(s);
    }
  });

  it("handles text with emojis (should not modify)", () => {
    const withEmoji = "Hello 👋 World 🌍";
    expect(fixMojibake(withEmoji)).toBe(withEmoji);
  });
});
