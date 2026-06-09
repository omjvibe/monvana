"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { BANK_NAME } from "@/lib/constants";

const bullets = [
    {
        icon: Zap,
        title: "Fast, Easy Application",
        description: "Quick online setup and instant 24/7 support.",
    },
    {
        icon: TrendingUp,
        title: "Flexible Financial Tools",
        description: "Multi-asset banking, swapping, and virtual cards.",
    },
    {
        icon: ShieldCheck,
        title: "Premium Wealth Management",
        description: "Competitive rates and tailored wealth plans.",
    },
];

const avatarBadge = [
    "/images/user-avatar-1.jpeg",
    "/images/user-avatar-2.jpeg",
    "/images/user-avatar-3.jpeg",
];

export function Hero() {
    return (
        <section className="relative min-h-screen overflow-hidden bg-[#09090b]">
            {/* Ambient background glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-[#00DF89]/8 blur-[140px]" />
                <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#00DF89]/5 blur-[120px]" />
                <div className="absolute bottom-0 left-0 h-[400px] w-[600px] rounded-full bg-stone-800/30 blur-[100px]" />
            </div>



            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="flex min-h-screen items-center py-20 lg:py-28">
                    <div className="grid w-full items-center gap-16 lg:grid-cols-2 lg:gap-20">

                        {/* ─── LEFT COLUMN ─── */}
                        <div>
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#00DF89]/25 bg-[#00DF89]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00DF89]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#00DF89] animate-pulse" />
                                    Premium Digital Banking
                                </span>
                            </motion.div>

                            {/* Heading */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="mt-8 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
                            >
                                Unlock Your{" "}
                                <span className="relative">
                                    <span className="bg-gradient-to-r from-[#00DF89] to-[#00b870] bg-clip-text text-transparent italic">
                                        Financial
                                    </span>
                                </span>
                                {" "}Potential
                            </motion.h1>

                            {/* Subtext */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="mt-6 max-w-lg text-lg text-stone-400 font-light leading-relaxed"
                            >
                                {BANK_NAME} delivers bespoke financial solutions for individuals and institutions who demand excellence, security, and global reach.
                            </motion.p>

                            {/* Bullets */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="mt-10 space-y-5"
                            >
                                {bullets.map((bullet, i) => (
                                    <motion.div
                                        key={bullet.title}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                                        className="flex items-start gap-4 group"
                                    >
                                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#00DF89]/25 bg-[#00DF89]/10 transition-colors group-hover:bg-[#00DF89]/20">
                                            <bullet.icon className="h-4 w-4 text-[#00DF89]" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white text-sm">{bullet.title}</p>
                                            <p className="mt-0.5 text-sm text-stone-500 font-light">{bullet.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* CTAs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="mt-12 flex flex-wrap items-center gap-4"
                            >
                                <Link
                                    href="/sign-up"
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#00DF89] px-7 py-3.5 text-sm font-bold text-black transition-all duration-200 hover:bg-[#00c578] hover:shadow-[0_0_32px_rgba(0,223,137,0.4)] active:scale-95"
                                >
                                    Get Started Free
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/#services"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 backdrop-blur-sm"
                                >
                                    Explore Services
                                </Link>
                            </motion.div>

                            {/* Social proof badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.75 }}
                                className="mt-10 flex items-center gap-4"
                            >
                                <div className="flex -space-x-2.5">
                                    {avatarBadge.map((src, i) => (
                                        <div
                                            key={i}
                                            className="h-9 w-9 rounded-full border-2 border-[#09090b] overflow-hidden ring-1 ring-[#00DF89]/30"
                                        >
                                            <Image src={src} alt={`Client ${i + 1}`} width={36} height={36} className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">12K+ HNW Clients</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="h-3 w-3 fill-[#00DF89]" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                        <span className="text-xs text-stone-400 ml-1">5.0 trusted rating</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* ─── RIGHT COLUMN ─── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative hidden lg:block"
                        >
                            {/* Decorative corner brackets */}
                            <div className="absolute -top-4 -left-4 h-10 w-10 border-t-2 border-l-2 border-[#00DF89]/60 rounded-tl-lg" />
                            <div className="absolute -bottom-4 -right-4 h-10 w-10 border-b-2 border-r-2 border-[#00DF89]/60 rounded-br-lg" />

                            {/* Glow behind image */}
                            <div className="absolute inset-4 bg-[#00DF89]/10 blur-3xl rounded-full" />

                            {/* Image container */}
                            <div className="relative overflow-hidden rounded-3xl border border-[#00DF89]/20 shadow-[0_0_60px_rgba(0,223,137,0.12)] aspect-[4/5]">
                                <Image
                                    src="/images/hero-executive.jpeg"
                                    alt="Monvana Premium Banking Executive"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/90 via-transparent to-transparent" />

                                {/* Bottom card overlay */}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-[#00DF89] font-semibold">Portfolio Performance</p>
                                                <p className="mt-1.5 text-2xl font-bold text-white">$4.8B+</p>
                                                <p className="text-xs text-stone-400 mt-0.5">Assets Under Management</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 rounded-lg bg-[#00DF89]/15 border border-[#00DF89]/25 px-3 py-1.5">
                                                <TrendingUp className="h-3.5 w-3.5 text-[#00DF89]" />
                                                <span className="text-xs font-bold text-[#00DF89]">+24.7%</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-4 text-center">
                                            {[
                                                { label: "Countries", value: "190+" },
                                                { label: "Uptime", value: "99.9%" },
                                                { label: "Transactions", value: "$2.5B+" },
                                            ].map((s) => (
                                                <div key={s.label} className="flex-1">
                                                    <p className="text-sm font-bold text-white">{s.value}</p>
                                                    <p className="text-[10px] uppercase tracking-wider text-stone-500 mt-0.5">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Award badge top-right */}
                                <div className="absolute top-5 right-5 flex flex-col items-center rounded-2xl border border-[#00DF89]/30 bg-black/70 backdrop-blur-md px-4 py-3 text-center shadow-xl">
                                    <CheckCircle2 className="h-5 w-5 text-[#00DF89]" />
                                    <p className="mt-1.5 text-[10px] uppercase tracking-widest text-[#00DF89] font-bold">Certified</p>
                                    <p className="text-[10px] text-stone-400">ISO 27001</p>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
        </section>
    );
}
