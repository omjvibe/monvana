"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { BANK_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Services", href: "/#services" },
    { name: "Contact", href: "/#contact" },
];

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isSignedIn } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                scrolled
                    ? "border-b border-white/5 bg-[#09090b]/95 backdrop-blur-xl shadow-lg shadow-black/20"
                    : "border-b border-transparent bg-[#09090b]/80 backdrop-blur-md"
            }`}
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Left — Logo */}
                <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
                    <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/5 border border-white/10 shadow-inner transition-all duration-300 group-hover:border-[#00DF89]/40 group-hover:shadow-[0_0_16px_rgba(0,223,137,0.2)]">
                        <Image
                            src="/monvanalogo.jpg"
                            alt={BANK_NAME}
                            fill
                            className="object-contain p-0.5"
                        />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">
                        Monvana<span className="text-[#00DF89] font-medium italic ml-0.5">Bank</span>
                    </span>
                </Link>

                {/* Center — Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative px-4 py-2 text-sm font-medium text-stone-400 transition-colors hover:text-white group"
                        >
                            {item.name}
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 bg-[#00DF89] transition-all duration-300 group-hover:w-4/5" />
                        </Link>
                    ))}
                </nav>

                {/* Right — Actions */}
                <div className="hidden md:flex items-center gap-3">
                    <ThemeToggle />
                    {isSignedIn ? (
                        <Link
                            href="/user"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00DF89] px-4 py-2 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#00c578] hover:shadow-[0_0_20px_rgba(0,223,137,0.35)] active:scale-95"
                        >
                            Dashboard
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/sign-in"
                                className="px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:text-white"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/sign-up"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00DF89] px-4 py-2 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#00c578] hover:shadow-[0_0_20px_rgba(0,223,137,0.35)] active:scale-95"
                            >
                                Get Started
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile menu toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-stone-300 transition hover:bg-white/10 hover:text-white"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-white/5 bg-[#09090b] md:hidden"
                    >
                        <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-lg px-4 py-3 text-sm font-medium text-stone-400 transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-3">
                                <div className="flex items-center justify-between px-4 py-2 text-sm text-stone-400">
                                    <span>Theme</span>
                                    <ThemeToggle />
                                </div>
                                {isSignedIn ? (
                                    <Link
                                        href="/user"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-[#00DF89] px-4 py-2.5 text-sm font-semibold text-black"
                                    >
                                        Dashboard <ChevronRight className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/sign-in"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-stone-300 hover:bg-white/5"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            href="/sign-up"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#00DF89] px-4 py-2.5 text-sm font-semibold text-black"
                                        >
                                            Get Started <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
