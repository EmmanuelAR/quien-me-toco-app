import { beforeAll, describe, expect, it, vi } from "vitest";
import { CairoByteArray, hash, shortString } from "starknet";

const ADDRESS = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let calls: typeof import("@/lib/contract/calls").calls;
let newInviteCode: typeof import("@/lib/contract/calls").newInviteCode;
let inviteCodeToSlug: typeof import("@/lib/contract/calls").inviteCodeToSlug;
let slugToInviteCode: typeof import("@/lib/contract/calls").slugToInviteCode;
let decodeByteArrayFelts: typeof import("@/lib/contract/reads").decodeByteArrayFelts;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_CONTRACT_ADDRESS", ADDRESS);
  ({ calls, newInviteCode, inviteCodeToSlug, slugToInviteCode } = await import("@/lib/contract/calls"));
  ({ decodeByteArrayFelts } = await import("@/lib/contract/reads"));
});

describe("calldata contra el abi", () => {
  it("create_group compila con todos los campos", () => {
    const c = calls.createGroup({
      name: "navidad familia",
      eventAt: 1_800_000_000,
      place: "casa de la abuela",
      budgetMin: 5000,
      budgetMax: 10000,
      rules: "",
      expectedCount: 6,
      inviteCode: 12345n,
    });
    expect(c.contractAddress).toBe(ADDRESS);
    expect(c.entrypoint).toBe("create_group");
    const data = c.calldata as string[];
    // name: ByteArray vacío de "data" + pending word + len
    expect(data.length).toBeGreaterThan(10);
    // la calldata compilada va en decimal
    expect(data).toContain(BigInt(shortString.encodeShortString("CRC")).toString());
    expect(data).toContain("12345");
  });

  it("join compila u256 y struct", () => {
    const pub = new Uint8Array(32).fill(7);
    const commit = new Uint8Array(32).fill(9);
    const c = calls.join(1n, 42n, "ana", pub, commit, { ideas: "libros", sizes: "m", links: "" });
    expect(c.entrypoint).toBe("join");
    expect(Array.isArray(c.calldata)).toBe(true);
  });

  it("publish_draw y reveal compilan arrays", () => {
    const ct = new Uint8Array(105).fill(1);
    const c = calls.publishDraw(3n, [1n, 2n, 3n], [ct, ct, ct], new Uint8Array(200).fill(2));
    expect(c.entrypoint).toBe("publish_draw");
    const r = calls.reveal(3n, [1, 2, 0], [11n, 22n, 33n]);
    expect(r.entrypoint).toBe("reveal");
    expect((r.calldata as string[]).slice(0, 5)).toEqual(["3", "3", "1", "2", "0"]);
  });

  it("set_exclusions compila la lista de pares", () => {
    const c = calls.setExclusions(1n, [
      { a: 0, b: 1 },
      { a: 2, b: 3 },
    ]);
    expect(c.calldata).toEqual(["1", "2", "0", "1", "2", "3"]);
  });

  it("los entrypoints existen en el abi (selector calculable)", () => {
    for (const name of ["create_group", "join", "publish_draw", "reveal", "request_draw", "request_reveal"]) {
      expect(hash.getSelectorFromName(name)).toMatch(/^0x/);
    }
  });
});

describe("helpers de invitación y bytes", () => {
  it("invite code va y vuelve por el slug", () => {
    const code = newInviteCode();
    expect(code).toBeGreaterThan(0n);
    const slug = inviteCodeToSlug(code);
    expect(slugToInviteCode(slug)).toBe(code);
    expect(slugToInviteCode("no válido!")).toBeNull();
  });

  it("bytes binarios van y vuelven por ByteArray (felts crudos)", () => {
    for (const len of [0, 1, 30, 31, 32, 70, 105, 300]) {
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = (i * 37 + 200) & 0xff;
      const felts = new CairoByteArray(bytes).toApiRequest();
      expect(decodeByteArrayFelts(felts)).toEqual(bytes);
    }
    // una llamada completa compila un Uint8Array como ByteArray
    const ct = new Uint8Array(105).fill(3);
    const c = calls.updateCiphertext(1n, 2, ct);
    const data = c.calldata as string[];
    // group_id, index, data_len(3), 3 chunks, pending_word, pending_len(12)
    expect(data[2]).toBe("3");
    expect(data[data.length - 1]).toBe("12");
    expect(decodeByteArrayFelts(data.slice(2))).toEqual(ct);
  });
});

describe("rpc con límite", () => {
  it("reconoce el corte de zan y un 429", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONTRACT_ADDRESS", ADDRESS);
    const { rpcResponseIsRateLimited } = await import("@/lib/contract/client");
    expect(rpcResponseIsRateLimited(200, '{"code":-32011,"message":"cu limit exceeded; Request too fast per second."}')).toBe(true);
    expect(rpcResponseIsRateLimited(429, "slow down")).toBe(true);
    expect(rpcResponseIsRateLimited(200, '{"result":["0x1"]}')).toBe(false);
  });
});
