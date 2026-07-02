import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
    createSession,
    createUser,
    deleteSession,
    findSession,
    findUserByEmail,
    findUserById,
    type StoredUser,
} from "@/lib/services/userStore";

const SESSION_COOKIE = "northstar_session";
const SESSION_DAYS = 14;

function hashPassword(password: string, salt: string) {
    return scryptSync(password, salt, 64).toString("hex");
}

export async function registerUser(name: string, email: string, password: string) {
    const existing = await findUserByEmail(email);
    if (existing) {
        throw new Error("An account with this email already exists.");
    }

    const salt = randomBytes(16).toString("hex");
    const user: StoredUser = {
        id: randomBytes(12).toString("hex"),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password, salt),
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
    };

    await createUser(user);
    await startSession(user.id);
    return { id: user.id, name: user.name, email: user.email };
}

export async function loginUser(email: string, password: string) {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error("Invalid email or password.");
    }

    const candidate = hashPassword(password, user.passwordSalt);
    const valid = timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(user.passwordHash, "hex"));
    if (!valid) {
        throw new Error("Invalid email or password.");
    }

    await startSession(user.id);
    return { id: user.id, name: user.name, email: user.email };
}

async function startSession(userId: string) {
    const sessionId = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await createSession({ id: sessionId, userId, expiresAt });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(expiresAt),
    });
}

export async function logoutUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (sessionId) {
        await deleteSession(sessionId);
    }
    cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) return null;

    const session = await findSession(sessionId);
    if (!session) {
        cookieStore.delete(SESSION_COOKIE);
        return null;
    }

    const user = await findUserById(session.userId);
    if (!user) return null;

    return { id: user.id, name: user.name, email: user.email };
}
