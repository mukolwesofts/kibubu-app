import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "kibubu_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, seconds

export interface SessionPayload {
  sub: string; // user id
  hid: string; // household id
}

function secret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET!);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string" || typeof payload.hid !== "string") {
      return null;
    }
    return { sub: payload.sub, hid: payload.hid };
  } catch {
    return null;
  }
}
