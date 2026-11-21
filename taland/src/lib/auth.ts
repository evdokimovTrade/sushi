import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { ADMIN_COOKIE, USER_COOKIE } from "./http";

function token() {
  return crypto.randomBytes(32).toString("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

export async function createSession(role: "user" | "admin", userId?: string) {
  const value = token();
  const days = role === "admin" ? 7 : 30;
  await prisma.session.create({
    data: {
      token: value,
      role,
      userId: userId ?? null,
      expiresAt: new Date(Date.now() + days * 864e5),
    },
  });
  return value;
}

async function readSession(cookieName: string, role: "user" | "admin") {
  const jar = await cookies();
  const value = jar.get(cookieName)?.value;
  if (!value) return null;
  const session = await prisma.session.findUnique({
    where: { token: value },
    include: { user: true },
  });
  if (!session || session.role !== role || session.expiresAt.getTime() < Date.now()) return null;
  return session;
}

export function getUserSession() {
  return readSession(USER_COOKIE, "user");
}

export function getAdminSession() {
  return readSession(ADMIN_COOKIE, "admin");
}

export async function requireUser() {
  const session = await getUserSession();
  if (!session?.user) return null;
  return session.user;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  return session ? true : null;
}
