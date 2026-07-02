import { api } from "@/lib/api/api";

// Register a new user.
export async function registerUser(userData: {
    fullname: string;
    email: string;
    password: string;
}) {
    const response = await api.post("/auth/register", userData);

    return response.data;
}

// Login using email and password.
export async function loginUser(credentials: {
    email: string;
    password: string;
}) {
    const response = await api.post("/auth/login", credentials);

    return response.data;
}

// Logout the currently authenticated user.
export async function logoutUser() {
    const response = await api.post("/auth/logout");

    return response.data;
}

// Fetch the currently logged-in user.
export async function getCurrentUser() {
    const response = await api.get("/auth/me");

    return response.data;
}

// Refresh the access token using the refresh token cookie.
export async function refreshAccessToken() {
    const response = await api.post("/auth/refresh-token");

    return response.data;
}

// Update the current user's profile.
export async function updateProfile(data: { fullname: string }) {
    const response = await api.patch("/auth/profile", data);
    return response.data;
}

// Change the current user's password.
export async function changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await api.patch("/auth/password", data);
    return response.data;
}

// Delete the current user's account.
export async function deleteAccount() {
    const response = await api.delete("/auth/account");
    return response.data;
}