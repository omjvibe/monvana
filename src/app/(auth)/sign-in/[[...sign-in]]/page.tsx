"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BANK_NAME } from "@/lib/constants";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (data.user) {
                router.push("/user");
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Branding */}
            <div className="hidden w-1/2 bg-stone-900 lg:flex lg:flex-col lg:justify-between lg:p-16">
                <div>
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full overflow-hidden bg-stone-100 shadow-xl border border-stone-200">
                            <Image src="/monvanalogo.jpg" alt={BANK_NAME} width={44} height={44} className="object-cover" />
                        </div>
                        <span className="text-2xl font-bold text-white italic tracking-tight">
                            Monvana<span className="text-[#00DF89] font-medium italic ml-0.5">Bank</span>
                        </span>
                    </Link>
                </div>

                <div className="max-w-lg">
                    <h1 className="text-5xl font-bold leading-tight text-white">
                        Welcome Back
                    </h1>
                    <p className="mt-6 text-xl text-stone-400">
                        Access your account and manage your finances with ease.
                    </p>

                    <div className="mt-16 grid grid-cols-2 gap-6">
                        <div className="rounded-lg bg-white/5 p-6">
                            <div className="text-3xl font-bold text-white">$2.4B+</div>
                            <div className="mt-1 text-sm text-stone-400">Assets managed</div>
                        </div>
                        <div className="rounded-lg bg-white/5 p-6">
                            <div className="text-3xl font-bold text-white">500K+</div>
                            <div className="mt-1 text-sm text-stone-400">Active users</div>
                        </div>
                        <div className="rounded-lg bg-white/5 p-6">
                            <div className="text-3xl font-bold text-white">180+</div>
                            <div className="mt-1 text-sm text-stone-400">Countries</div>
                        </div>
                        <div className="rounded-lg bg-white/5 p-6">
                            <div className="text-3xl font-bold text-white">99.9%</div>
                            <div className="mt-1 text-sm text-stone-400">Uptime</div>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-stone-500">
                    © 2024 {BANK_NAME}. All rights reserved.
                </p>
            </div>

            {/* Right Panel - Sign In Form */}
            <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 dark:bg-black lg:w-1/2 lg:px-16">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="flex justify-center lg:hidden">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-stone-100 dark:bg-stone-100 shadow-lg">
                                <Image src="/monvanalogo.jpg" alt={BANK_NAME} width={40} height={40} className="object-cover" />
                            </div>
                            <span className="text-xl font-bold italic">Monvana<span className="text-[#00DF89] font-medium italic ml-0.5">Bank</span></span>
                        </Link>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                            Don&apos;t have an account?{" "}
                            <Link href="/sign-up" className="font-medium text-black underline dark:text-white">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Google OAuth Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="flex w-full items-center justify-center gap-3 rounded-md border border-black dark:border-white bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-950 h-11 px-4 font-medium text-black dark:text-white transition-colors"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-black/20 dark:border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white dark:bg-black px-4 text-black/60 dark:text-white/60">or</span>
                        </div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-black dark:text-white mb-1.5">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-md border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white h-11 px-3 outline-none transition-colors"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-black dark:text-white">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-sm text-black dark:text-white hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-md border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white h-11 px-3 pr-10 outline-none transition-colors"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black h-11 font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
