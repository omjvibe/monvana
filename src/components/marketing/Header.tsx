"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { BANK_NAME } from "@/lib/constants";

const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Services", href: "/#services" },
    { name: "Contact", href: "/#contact" },
];

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const { isSignedIn } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-stone-200/50 bg-white/80 backdrop-blur-xl dark:border-stone-800/50 dark:bg-stone-950/80">
            <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
                {/* Left - Navigation */}
                <nav className="hidden flex-1 items-center gap-1 md:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Center - Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-3 md:absolute md:left-1/2 md:-translate-x-1/2 group"
                >
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-stone-100 p-1 shadow-sm transition-transform group-hover:scale-110 dark:bg-stone-800">
                        <Image
                            src="/images/logo.png"
                            alt={BANK_NAME}
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                        Monvana<span className="text-stone-500 font-medium font-serif italic ml-0.5">Bank</span>
                    </span>
                </Link>

                {/* Right - Actions */}
                <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
                    <ThemeToggle />
                    {isSignedIn ? (
                        <Button asChild size="sm" className="rounded-md">
                            <Link href="/user">
                                Dashboard
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" asChild className="rounded-md">
                                <Link href="/sign-in">Sign In</Link>
                            </Button>
                            <Button size="sm" asChild className="rounded-md">
                                <Link href="/sign-up">
                                    Get Started
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile - Menu Button */}
                <div className="ml-auto flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                        className="rounded-md"
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-stone-200/50 bg-white dark:border-stone-800/50 dark:bg-stone-950 md:hidden"
                    >
                        <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-md px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div className="mt-4 flex flex-col gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
                                {isSignedIn ? (
                                    <Button asChild className="w-full rounded-md">
                                        <Link href="/user">
                                            Dashboard
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" asChild className="w-full rounded-md">
                                            <Link href="/sign-in">Sign In</Link>
                                        </Button>
                                        <Button asChild className="w-full rounded-md">
                                            <Link href="/sign-up">Get Started</Link>
                                        </Button>
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
