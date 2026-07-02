/**
 * This Next.js route is intentionally a no-op stub.
 *
 * Registration is handled directly by the client-side `auth.service.ts`, which
 * calls the Express backend at POST /api/v1/auth/register using axios
 * (withCredentials: true). The Express server sets the HttpOnly
 * accessToken and refreshToken cookies on the response.
 *
 * This file is kept to satisfy Next.js routing but should not be called
 * by any component. If it is called, it returns 405 Method Not Allowed.
 */
import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { error: "Use the Express auth API directly via auth.service.ts." },
        { status: 405 }
    );
}
