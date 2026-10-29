/** QA-only auth bypass. Never enable without an explicit env flag. */

export const QA_PERSONA_COOKIE = "qmt_qa_persona";

export type QaPersona = "host" | "guest" | "off";

export type QaUser = {
  id: string;
  name: string;
  email: string;
  image: null;
};

export const QA_USERS: Record<Exclude<QaPersona, "off">, QaUser> = {
  host: {
    id: "qa-host",
    name: "QA Host",
    email: "qa-host@example.invalid",
    image: null,
  },
  guest: {
    id: "qa-guest",
    name: "QA Guest",
    email: "qa-guest@example.invalid",
    image: null,
  },
};

/** Server: honor bypass only with explicit QA_AUTH_BYPASS=1 */
export function qaAuthBypassServerEnabled(): boolean {
  return process.env.QA_AUTH_BYPASS === "1";
}

/** Client bundle flag (must match server for UI + API to agree) */
export function qaAuthBypassPublicEnabled(): boolean {
  return process.env.NEXT_PUBLIC_QA_AUTH_BYPASS === "1";
}

export function parseQaPersona(raw: string | undefined | null): QaPersona {
  if (raw === "guest" || raw === "off" || raw === "host") return raw;
  return "host";
}

export function qaUserForPersona(persona: QaPersona): QaUser | null {
  if (persona === "off") return null;
  return QA_USERS[persona];
}
