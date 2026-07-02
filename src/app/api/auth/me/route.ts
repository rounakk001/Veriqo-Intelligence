import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000/api/v1";

export async function GET(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        if (!accessToken) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const response = await fetch(`${BACKEND_URL}/auth/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                // Forward the accessToken as a cookie so the Express backend's
                // cookie-parser can read it, same as a browser would send it.
                Cookie: `accessToken=${accessToken}`,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const data = await response.json();
        // Express returns { user: { id, fullname, email } } or { data: user }
        // Normalize to { user: { id, name, email } } to match existing UI expectations.
        const rawUser = data.user ?? data.data ?? null;
        if (!rawUser) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const user = {
            id: rawUser._id ?? rawUser.id,
            name: rawUser.fullname ?? rawUser.name,
            email: rawUser.email,
        };

        return NextResponse.json({ user });
    } catch (error) {
        console.error("[/api/auth/me proxy]", error);
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
