"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

// Simulated exchange rates (in production, fetch from API)
const baseRates = [
    { from: "USD", to: "EUR", rate: 0.92, flag: "🇺🇸" },
    { from: "USD", to: "GBP", rate: 0.79, flag: "🇺🇸" },
    { from: "EUR", to: "USD", rate: 1.09, flag: "🇪🇺" },
    { from: "GBP", to: "USD", rate: 1.27, flag: "🇬🇧" },
    { from: "USD", to: "JPY", rate: 149.50, flag: "🇺🇸" },
    { from: "USD", to: "CHF", rate: 0.88, flag: "🇺🇸" },
    { from: "EUR", to: "GBP", rate: 0.86, flag: "🇪🇺" },
    { from: "USD", to: "CAD", rate: 1.36, flag: "🇺🇸" },
];

function getRandomChange() {
    return (Math.random() - 0.5) * 0.02; // ±1% change
}

export function ExchangeRates() {
    const [rates, setRates] = useState(baseRates.map(r => ({ ...r, change: 0 })));

    useEffect(() => {
        // Simulate live rate updates
        const interval = setInterval(() => {
            setRates(prev => prev.map(rate => ({
                ...rate,
                rate: rate.rate * (1 + getRandomChange() * 0.1),
                change: getRandomChange(),
            })));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="bg-[#0a0a0a] py-24 md:py-32 relative">
            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
                    
                    {/* Left - Content and Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-5 flex flex-col justify-center"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">
                            Global Markets
                        </span>
                        <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl font-serif italic">
                            Live Exchange <span className="bg-gradient-to-r from-stone-200 to-stone-500 bg-clip-text text-transparent">Rates.</span>
                        </h2>
                        <p className="mt-6 text-lg text-stone-400 font-light leading-relaxed">
                            Access real-time currency exchange rates driven by advanced institutional algorithms. Execute transfers with absolute precision at competitive rates.
                        </p>

                        <div className="mt-10 relative aspect-[3/4] w-full max-w-sm mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 group">
                            <Image
                                src="https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=387&auto=format&fit=crop"
                                alt="Financial Markets Analysis"
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105 grayscale hover:grayscale-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>
                    </motion.div>

                    {/* Right - Rates Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-7"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            {rates.map((item, index) => (
                                <motion.div
                                    key={`${item.from}-${item.to}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:bg-stone-900/60 shadow-lg group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl drop-shadow-sm">{item.flag}</span>
                                            <span className="font-semibold text-white tracking-wide">
                                                {item.from}/{item.to}
                                            </span>
                                        </div>
                                        {item.change > 0.001 ? (
                                            <TrendingUp className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                        ) : item.change < -0.001 ? (
                                            <TrendingDown className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <Minus className="h-5 w-5 text-stone-500" />
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <span className="text-3xl font-bold text-white font-serif tracking-tight">
                                            {item.rate.toFixed(item.rate > 100 ? 2 : 4)}
                                        </span>
                                        <span
                                            className={`text-sm font-medium px-2 py-1 rounded-md ${item.change > 0
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : item.change < 0
                                                        ? "bg-red-500/10 text-red-400"
                                                        : "bg-stone-500/10 text-stone-400"
                                                }`}
                                        >
                                            {item.change > 0 ? "+" : ""}
                                            {(item.change * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 text-sm text-stone-500 font-light"
                        >
                            Rates are indicative and updated every 5 seconds. Actual transaction rates may vary.
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
