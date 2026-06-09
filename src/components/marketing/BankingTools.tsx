"use client";

import { motion } from "framer-motion";
import {
    ArrowLeftRight,
    Landmark,
    TrendingUp,
    CreditCard,
    Wallet,
    Heart,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

const tools = [
    {
        icon: Wallet,
        title: "Digital Wallet",
        description: "Secure digital wallet with multi-currency support and instant access to your funds.",
        href: "/sign-up",
    },
    {
        icon: ArrowLeftRight,
        title: "Wire Transfers",
        description: "Send and receive money globally with competitive rates and fast processing.",
        href: "/sign-up",
    },
    {
        icon: Landmark,
        title: "Loans & Mortgages",
        description: "Flexible financing options with competitive interest rates tailored to your needs.",
        href: "/sign-up",
    },
    {
        icon: TrendingUp,
        title: "Investments",
        description: "Grow your wealth with our curated investment plans and expert guidance.",
        href: "/sign-up",
    },
    {
        icon: CreditCard,
        title: "Virtual Cards",
        description: "Secure virtual cards for online shopping and subscription management.",
        href: "/sign-up",
    },
    {
        icon: Heart,
        title: "Donations",
        description: "Support verified charities and causes you care about directly from your account.",
        href: "/sign-up",
    },
];

export function BankingTools() {
    return (
        <section id="services" className="bg-[#0a0a0a] py-24 md:py-32 relative border-t border-stone-800">
            {/* Ambient Background Glow */}
            <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-[#00DF89]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00DF89]">
                        Our Services
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl italic">
                        Popular Banking <span className="bg-gradient-to-r from-[#00DF89] to-[#00b870] bg-clip-text text-transparent">Tools.</span>
                    </h2>
                    <p className="mt-6 text-lg text-stone-400 font-light leading-relaxed">
                        Everything you need to manage your finances in one place. Simple, secure, and always accessible.
                    </p>
                </motion.div>

                <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool, index) => (
                        <motion.div
                            key={tool.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link
                                href={tool.href}
                                className="group flex h-full flex-col rounded-3xl border border-stone-800 bg-stone-900/20 p-8 backdrop-blur-sm transition-all duration-300 hover:border-[#00DF89]/30 hover:bg-stone-900/40 hover:shadow-xl"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 border border-stone-700 transition-colors group-hover:border-[#00DF89]/40">
                                    <tool.icon className="h-6 w-6 text-stone-400 group-hover:text-[#00DF89] transition-colors" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-white group-hover:text-[#00DF89] transition-colors">
                                    {tool.title}
                                </h3>
                                <p className="mt-4 flex-1 text-sm text-stone-400 font-light leading-relaxed">
                                    {tool.description}
                                </p>
                                <div className="mt-8 flex items-center text-sm font-medium text-[#00DF89] opacity-0 transition-all duration-300 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0">
                                    Learn more
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
