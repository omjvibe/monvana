"use client";

import { motion } from "framer-motion";
import {
    PiggyBank,
    ShieldCheck,
    Zap,
    Globe,
    Gift,
    HeadphonesIcon
} from "lucide-react";

const benefits = [
    {
        icon: PiggyBank,
        title: "Zero Monthly Fees",
        description: "No hidden charges or monthly maintenance fees on your account.",
    },
    {
        icon: ShieldCheck,
        title: "Insured Deposits",
        description: "Your deposits are protected up to regulatory limits.",
    },
    {
        icon: Zap,
        title: "Instant Notifications",
        description: "Real-time alerts for all account activities and transactions.",
    },
    {
        icon: Globe,
        title: "Multi-Currency Support",
        description: "Hold and transact in multiple currencies without hassle.",
    },
    {
        icon: Gift,
        title: "Referral Rewards",
        description: "Earn bonuses when you refer friends and family to our platform.",
    },
    {
        icon: HeadphonesIcon,
        title: "Priority Support",
        description: "Access to dedicated customer support with priority response.",
    },
];

export function Benefits() {
    return (
        <section className="bg-[#0a0a0a] py-24 md:py-32 relative border-t border-stone-800">
            {/* Background elements */}
            <div className="absolute bottom-0 right-[20%] w-[30%] h-[40%] bg-stone-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">
                        Member Benefits
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl font-serif italic">
                        Exclusive Perks for Our <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Members.</span>
                    </h2>
                    <p className="mt-6 text-lg text-stone-400 font-light leading-relaxed">
                        Enjoy a range of benefits designed to make your banking experience exceptional.
                    </p>
                </motion.div>

                <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/20 p-8 transition-all duration-300 hover:border-amber-500/30 hover:bg-stone-900/40 backdrop-blur-sm"
                        >
                            {/* Decorative gradient */}
                            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-amber-500/10" />

                            <div className="relative z-10">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 border border-stone-700 transition-colors group-hover:border-amber-500/50">
                                    <benefit.icon className="h-6 w-6 text-stone-400 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-white group-hover:text-amber-400 transition-colors font-serif">
                                    {benefit.title}
                                </h3>
                                <p className="mt-4 text-sm text-stone-400 font-light leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
