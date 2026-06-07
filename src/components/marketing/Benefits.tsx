"use client";

import { motion } from "framer-motion";
import {
    PiggyBank,
    ShieldCheck,
    Zap,
    Globe,
    Gift,
    HeadphonesIcon,
} from "lucide-react";

const benefits = [
    {
        icon: PiggyBank,
        title: "Zero Monthly Fees",
        description: "No hidden charges or monthly maintenance fees on your account. Ever.",
    },
    {
        icon: ShieldCheck,
        title: "Insured Deposits",
        description: "Your deposits are protected up to regulatory limits with full transparency.",
    },
    {
        icon: Zap,
        title: "Instant Notifications",
        description: "Real-time alerts for all account activities and transactions in seconds.",
    },
    {
        icon: Globe,
        title: "Multi-Currency Support",
        description: "Hold and transact in multiple currencies without friction or high fees.",
    },
    {
        icon: Gift,
        title: "Referral Rewards",
        description: "Earn generous bonuses when you refer friends and family to our platform.",
    },
    {
        icon: HeadphonesIcon,
        title: "Priority Support",
        description: "Access to a dedicated customer support team with priority 24/7 response.",
    },
];

export function Benefits() {
    return (
        <section className="relative bg-[#09090b] py-24 md:py-32 overflow-hidden">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute bottom-0 right-[15%] h-[400px] w-[500px] rounded-full bg-[#00DF89]/6 blur-[120px]" />
            <div className="pointer-events-none absolute top-0 left-[10%] h-[300px] w-[400px] rounded-full bg-stone-700/20 blur-[100px]" />

            {/* Top glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#00DF89]/25 bg-[#00DF89]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00DF89]">
                        Member Benefits
                    </span>
                    <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl leading-tight">
                        Exclusive Perks for Our{" "}
                        <span className="bg-gradient-to-r from-[#00DF89] to-[#00b870] bg-clip-text text-transparent italic font-serif">
                            Members.
                        </span>
                    </h2>
                    <p className="mt-5 text-lg text-stone-400 font-light leading-relaxed">
                        Enjoy a suite of benefits designed to make your banking experience truly exceptional.
                    </p>
                </motion.div>

                <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-7 transition-all duration-300 hover:border-[#00DF89]/25 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(0,223,137,0.06)] backdrop-blur-sm"
                        >
                            {/* Hover glow */}
                            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#00DF89]/0 transition-all duration-500 group-hover:bg-[#00DF89]/8 blur-2xl" />

                            <div className="relative z-10">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/8 bg-white/5 transition-all duration-300 group-hover:border-[#00DF89]/30 group-hover:bg-[#00DF89]/10">
                                    <benefit.icon className="h-5 w-5 text-stone-400 transition-colors group-hover:text-[#00DF89]" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-white transition-colors group-hover:text-[#00DF89]">
                                    {benefit.title}
                                </h3>
                                <p className="mt-3 text-sm text-stone-500 font-light leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>

                            {/* Bottom accent line */}
                            <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-[#00DF89]/60 to-transparent transition-all duration-500 group-hover:w-full" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
