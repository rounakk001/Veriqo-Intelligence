"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
    onLogout?: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = async () => {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
        });

        if (response.ok) {
            onLogout?.();      // Dashboard state reset
            router.refresh();  // Server components refresh
            router.push("/");
        }
    };

    
}