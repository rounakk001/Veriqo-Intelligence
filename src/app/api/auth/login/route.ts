import { NextResponse } from "next/server";
import { loginUser } from "@/lib/services/authService";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }

        const user = await loginUser(email, password);
        return NextResponse.json({ user });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Login failed." },
            { status: 401 }
        );
    }
}
