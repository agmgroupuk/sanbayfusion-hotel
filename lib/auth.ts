import { createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const SESSION_COOKIE = "sanbay_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCurrentUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return getCurrentUserFromToken(token);
}

export async function getCurrentUserFromToken(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;

  const session = await prisma.platformSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.platformSession.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function setSessionCookie(
  response: NextResponse,
  userId: string,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  await prisma.platformSession.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.platformSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
