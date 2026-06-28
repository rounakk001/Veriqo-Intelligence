import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/authService";

export async function GET() {
    try {
        const user = await getCurrentUser();
        return NextResponse.json({ user });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ user: null });
    }
}
