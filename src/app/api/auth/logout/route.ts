import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000/api/v1";

export async function POST(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;
        const refreshToken = cookieStore.get("refreshToken")?.value;

        // Build the cookie header so Express can invalidate the session on its end.
        const cookieHeader = [
            accessToken ? `accessToken=${accessToken}` : null,
            refreshToken ? `refreshToken=${refreshToken}` : null,
        ]
            .filter(Boolean)
            .join("; ");

        const response = await fetch(`${BACKEND_URL}/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            },
        });

        // Regardless of the Express response, always clear the cookies on the
        // Next.js side so the browser no longer sends them.
        const res = NextResponse.json({ ok: true });
        
        // Ensure cookies are cleared on the response object
        res.cookies.delete("accessToken");
        res.cookies.delete("refreshToken");

        if (!response.ok) {
            console.warn("[/api/auth/logout proxy] Express returned non-OK:", response.status);
        }

        return res;
    } catch (error) {
        console.error("[/api/auth/logout proxy]", error);
        
        const res = NextResponse.json({ ok: true });
        res.cookies.delete("accessToken");
        res.cookies.delete("refreshToken");
        return res;
    }
}
