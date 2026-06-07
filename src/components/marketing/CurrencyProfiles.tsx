"use client";

import { motion } from "framer-motion";

const currencies = [
    {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        flag: "🇺🇸",
        description: "The world's primary reserve currency",
    },
    {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        flag: "🇪🇺",
        description: "Official currency of the Eurozone",
    },
    {
        code: "GBP",
        name: "British Pound",
        symbol: "£",
        flag: "🇬🇧",
        description: "One of the oldest currencies still in use",
    },
    {
        code: "JPY",
        name: "Japanese Yen",
        symbol: "¥",
        flag: "🇯🇵",
        description: "Major currency in Asian markets",
    },
    {
        code: "CHF",
        name: "Swiss Franc",
        symbol: "Fr",
        flag: "🇨🇭",
        description: "Known for stability and security",
    },
    {
        code: "AUD",
        name: "Australian Dollar",
        symbol: "A$",
        flag: "🇦🇺",
        description: "Major commodity currency",
    },
];

export function CurrencyProfiles() {
    return (
        <section className="bg-[#0a0a0a] py-24 md:py-32 relative border-t border-stone-800">
            {/* Background elements */}
            <div className="absolute top-0 left-[20%] w-[40%] h-[40%] bg-stone-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">
                        Supported Currencies
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl font-serif italic">
                        Global Liquidity <span className="bg-gradient-to-r from-stone-200 to-stone-500 bg-clip-text text-transparent">Network.</span>
                    </h2>
                    <p className="mt-6 text-lg text-stone-400 font-light leading-relaxed">
                        Hold, send, and receive money in multiple currencies with institutional-grade exchange rates and deep liquidity pools.
                    </p>
                </motion.div>

                <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {currencies.map((currency, index) => (
                        <motion.div
                            key={currency.code}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-start gap-5 rounded-3xl border border-stone-800 bg-stone-900/20 p-6 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:bg-stone-900/40 hover:shadow-xl group"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 border border-stone-700 text-3xl shadow-inner group-hover:border-amber-500/50 transition-colors">
                                {currency.flag}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white tracking-wide">{currency.code}</span>
                                    <span className="text-sm font-medium text-amber-500/80">({currency.symbol})</span>
                                </div>
                                <p className="text-sm text-stone-300 mt-1 font-medium">{currency.name}</p>
                                <p className="mt-2 text-xs text-stone-500 font-light leading-relaxed">{currency.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
