"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthGate } from "@/lib/context/AuthGateContext";
import { logoutUser } from "@/lib/services/auth.service";
import { User, LogOut, Settings, LayoutDashboard, History, Palette } from "lucide-react";
import { useTheme } from "next-themes";

export function UserNav() {
  const { user, setIsAuthenticated, setUser, isLoadingSession } = useAuthGate();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setIsOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  if (isLoadingSession) {
    return <div className="h-9 w-9 rounded-full bg-zinc-200 animate-pulse dark:bg-zinc-800" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400 transition-colors px-3 py-2">
          Sign In
        </Link>
        <Link href="/login" className="hidden sm:inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/30">
          Get Started
        </Link>
      </div>
    );
  }

  const initials = user.fullname
    ? user.fullname.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    : user.email.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 transition-all hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800/60 dark:hover:bg-emerald-800/60"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {initials}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-zinc-200/80 bg-white/80 p-2 shadow-xl shadow-zinc-900/10 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/40"
          >
            {/* Header */}
            <div className="flex flex-col px-3 py-2">
              <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user.fullname}
              </span>
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </span>
            </div>

            <div className="my-1 h-px bg-zinc-200/80 dark:bg-zinc-800" />

            {/* Links */}
            <div className="flex flex-col gap-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <User className="h-4 w-4" />
                My Profile
              </Link>
              <Link
                href="/portfolio"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                Portfolio
              </Link>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <History className="h-4 w-4" />
                Search History
              </Link>
              
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 opacity-50 cursor-not-allowed dark:text-zinc-300"
                disabled
              >
                <Settings className="h-4 w-4" />
                Settings (Coming soon)
              </button>
              
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <Palette className="h-4 w-4" />
                {mounted && resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
            </div>

            <div className="my-1 h-px bg-zinc-200/80 dark:bg-zinc-800" />

            {/* Logout */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
