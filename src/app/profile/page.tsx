"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, User, Shield, Key, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { useAuthGate } from "@/lib/context/AuthGateContext";
import { updateProfile, changePassword, deleteAccount } from "@/lib/services/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/UserNav";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoadingSession, checkSession, setIsAuthenticated, setUser } = useAuthGate();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoadingSession && !isAuthenticated) {
      router.push("/login?redirect=/profile");
    }
  }, [isAuthenticated, isLoadingSession, router]);

  const [fullname, setFullname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Initialize fields
  useEffect(() => {
    if (user?.fullname) {
      setFullname(user.fullname);
    }
  }, [user]);

  if (isLoadingSession || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isGoogleAccount = user.authProvider === "google";
  const createdDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const updatedDate = new Date(user.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile({ fullname });
      await checkSession();
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMessage({
        type: "error",
        text: err?.response?.data?.message || err.message || "Failed to update profile.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMessage({
        type: "error",
        text: err?.response?.data?.message || err.message || "Failed to change password.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmationText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      setIsAuthenticated(false);
      setUser(null);
      router.push("/?deleted=true");
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmationText("");
      alert("Failed to delete account. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 pb-20">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            VERIQO
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
              Dashboard
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Account Settings</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Manage your profile, security preferences, and data.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name</label>
                    <Input
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                    <Input value={user.email} disabled className="bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed opacity-70" />
                    <p className="mt-1 text-xs text-zinc-500">Email address cannot be changed directly.</p>
                  </div>

                  {profileMessage && (
                    <div className={`text-sm p-3 rounded-lg border ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50'}`}>
                      {profileMessage.text}
                    </div>
                  )}
                </form>
              </CardContent>
              <CardFooter className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                <Button type="submit" form="profile-form" disabled={isUpdatingProfile || !fullname.trim()}>
                  {isUpdatingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>

            {/* Password Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-emerald-600" />
                  Security
                </CardTitle>
                <CardDescription>Change your password to keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent>
                {isGoogleAccount ? (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 text-sm text-zinc-600 dark:text-zinc-400">
                    Your account is linked with Google. You can sign in securely using your Google credentials.
                  </div>
                ) : (
                  <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                      />
                    </div>

                    {passwordMessage && (
                      <div className={`text-sm p-3 rounded-lg border ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50'}`}>
                        {passwordMessage.text}
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
              {!isGoogleAccount && (
                <CardFooter className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                  <Button type="submit" form="password-form" disabled={isUpdatingPassword || !currentPassword || !newPassword}>
                    {isUpdatingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900/50 overflow-hidden">
              <CardHeader className="bg-red-50/50 dark:bg-red-950/10">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-red-600/80 dark:text-red-400/80">
                  Permanently delete your account and all associated data.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Deleting your account will permanently remove your portfolio, search history, and saved preferences. This action cannot be undone.
                </p>

                {showDeleteConfirm ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20 space-y-4">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      To confirm deletion, please type <span className="font-bold select-all">DELETE</span> below:
                    </p>
                    <Input
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="DELETE"
                      className="border-red-300 focus-visible:ring-red-500 dark:border-red-800 dark:bg-red-950/40"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        variant="destructive"
                        disabled={deleteConfirmationText !== "DELETE" || isDeleting}
                        onClick={handleDeleteAccount}
                      >
                        {isDeleting ? "Deleting..." : "Permanently Delete"}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Account Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Account Type</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{user.authProvider} Account</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Member Since</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{createdDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Last Updated</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{updatedDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
