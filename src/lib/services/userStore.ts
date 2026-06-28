import { promises as fs } from "fs";
import path from "path";
import type { UserPortfolio } from "@/types/portfolio";

export interface StoredUser {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt: string;
}

export interface StoredSession {
    id: string;
    userId: string;
    expiresAt: string;
}

interface StoreData {
    users: StoredUser[];
    sessions: StoredSession[];
    portfolios: Record<string, UserPortfolio>;
}

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

async function ensureStore(): Promise<StoreData> {
    try {
        const raw = await fs.readFile(STORE_PATH, "utf8");
        return JSON.parse(raw) as StoreData;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            console.error(error);
        }
        const empty: StoreData = { users: [], sessions: [], portfolios: {} };
        await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
        await fs.writeFile(STORE_PATH, JSON.stringify(empty, null, 2));
        return empty;
    }
}

async function writeStore(data: StoreData) {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2));
}

export async function readStore() {
    return ensureStore();
}

export async function saveStore(data: StoreData) {
    await writeStore(data);
}

export async function findUserByEmail(email: string) {
    const store = await ensureStore();
    return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
    const store = await ensureStore();
    return store.users.find((user) => user.id === id) ?? null;
}

export async function createUser(user: StoredUser) {
    const store = await ensureStore();
    store.users.push(user);
    store.portfolios[user.id] = {
        userId: user.id,
        featuredSymbol: null,
        holdings: [],
        updatedAt: new Date().toISOString(),
    };
    await writeStore(store);
}

export async function createSession(session: StoredSession) {
    const store = await ensureStore();
    store.sessions.push(session);
    await writeStore(store);
}

export async function deleteSession(sessionId: string) {
    const store = await ensureStore();
    store.sessions = store.sessions.filter((session) => session.id !== sessionId);
    await writeStore(store);
}

export async function findSession(sessionId: string) {
    const store = await ensureStore();
    const session = store.sessions.find((entry) => entry.id === sessionId);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
        store.sessions = store.sessions.filter((entry) => entry.id !== sessionId);
        await writeStore(store);
        return null;
    }
    return session;
}

export async function getPortfolio(userId: string) {
    const store = await ensureStore();
    return (
        store.portfolios[userId] ?? {
            userId,
            featuredSymbol: null,
            holdings: [],
            updatedAt: new Date().toISOString(),
        }
    );
}

export async function savePortfolio(portfolio: UserPortfolio) {
    const store = await ensureStore();
    store.portfolios[portfolio.userId] = portfolio;
    await writeStore(store);
}
