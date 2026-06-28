import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/services/authService";

export async function POST() {
    try {
        await logoutUser();
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Logout failed." }, { status: 500 });
    }
}
