/**
 * Server-side utility to fetch the currently authenticated user from the
 * Express backend by forwarding the accessToken HttpOnly cookie.
 *
 * Used by server-side services (e.g. portfolioService.ts) that run inside
 * Next.js API routes and need to resolve the current user without calling
 * the old file-based auth system.
 *
 * Returns null if unauthenticated or if the Express call fails.
 */
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000/api/v1";

export interface AuthenticatedUser {
    id: string;
    name: string;
    email: string;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        if (!accessToken) return null;

        const response = await fetch(`${BACKEND_URL}/auth/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Cookie: `accessToken=${accessToken}`,
            },
            cache: "no-store",
        });

        if (!response.ok) return null;

        const data = await response.json();
        const rawUser = data.user ?? data.data ?? null;
        if (!rawUser) return null;

        return {
            id: rawUser._id ?? rawUser.id,
            name: rawUser.fullname ?? rawUser.name,
            email: rawUser.email,
        };
    } catch (error) {
        console.error("[getCurrentUser]", error);
        return null;
    }
}
