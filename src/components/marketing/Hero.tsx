"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BANK_NAME, BANK_TAGLINE } from "@/lib/constants";
import { AnimatedGlobe } from "./AnimatedGlobe";

const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1616803140344-6682afb13cda?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1609358905581-e5381612486e?q=80&w=411&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8b25saW5lJTIwYmFua2luZ3xlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG9ubGluZSUyMGJhbmtpbmd8ZW58MHx8MHx8fDA%3D"
];

export function Hero() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative min-h-screen overflow-hidden bg-[#fafaf9] dark:bg-[#0c0a09]">
            {/* Animated Carousel Background */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence initial={false}>
                    <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={HERO_IMAGES[currentImageIndex]}
                            alt={`${BANK_NAME} Private Banking`}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 mix-blend-multiply" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Premium Stone Gradient overlays */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-stone-950/80 via-stone-900/50 to-stone-950/90 dark:from-stone-950/90 dark:via-stone-950/70 dark:to-stone-950" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-[0.05]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="container relative z-10 mx-auto flex min-h-screen items-center px-4 py-20 md:px-6">
                <div className="mx-auto max-w-5xl text-center">
                    {/* Badge - Refined */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center rounded-full border border-stone-400/30 bg-stone-900/50 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-stone-200 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300">
                            <Shield className="mr-2 h-3.5 w-3.5 text-amber-400" />
                            Premium Wealth Management
                        </span>
                    </motion.div>

                    {/* Heading - Elegant */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl drop-shadow-xl"
                    >
                        The Future of{" "}
                        <span className="relative inline-block italic font-serif">
                            <span className="relative z-10 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                                Wealth
                            </span>
                        </span>
                    </motion.h1>

                    {/* Subheading - Sophisticated */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto mt-8 max-w-3xl text-lg text-stone-300 md:text-xl lg:text-2xl font-light drop-shadow-md"
                    >
                        {BANK_NAME}. {BANK_TAGLINE}. We provide bespoke financial solutions
                        for individuals and institutions who demand excellence, security, and global mobility.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row"
                    >
                        <Button size="lg" asChild className="group min-w-[200px] bg-amber-500 text-stone-950 hover:bg-amber-400 dark:bg-amber-500 dark:text-stone-900 dark:hover:bg-amber-400 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] border border-amber-400/50 transition-all">
                            <Link href="/sign-up">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="min-w-[200px] border-stone-300/30 text-white hover:bg-stone-800/50 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-900/50 backdrop-blur-md">
                            <Link href="/#services">Private Banking</Link>
                        </Button>
                    </motion.div>

                    {/* Carousel Indicators */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-16 flex items-center justify-center gap-3"
                    >
                        {HERO_IMAGES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentImageIndex ? "w-8 bg-amber-400" : "w-2 bg-stone-500/50 hover:bg-stone-400"
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </motion.div>

                    {/* Stats Bar - Minimalist */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mt-20 flex flex-wrap items-center justify-center gap-12 text-center md:gap-24 opacity-90"
                    >
                        {[
                            { label: "Assets Managed", value: "$4.8B+" },
                            { label: "High-Net-Worth Clients", value: "12K+" },
                            { label: "Global Coverage", value: "190+" }
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="text-3xl font-light text-white md:text-4xl">{stat.value}</div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-2">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent dark:from-stone-950 dark:via-stone-950/80" />
        </section >
    );
}
