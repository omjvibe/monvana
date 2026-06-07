"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
    Shield,
    Clock,
    Headphones,
    Lock,
    Smartphone,
    Banknote
} from "lucide-react";

const reasons = [
    {
        icon: Shield,
        title: "Bank-Grade Security",
        description: "Your data is protected with 256-bit SSL encryption and multi-factor authentication.",
    },
    {
        icon: Clock,
        title: "24/7 Availability",
        description: "Access your account anytime, anywhere. Our platform never sleeps.",
    },
    {
        icon: Headphones,
        title: "Dedicated Support",
        description: "Personal account managers and support team ready to assist you.",
    },
    {
        icon: Lock,
        title: "Regulatory Compliance",
        description: "Fully licensed and compliant with international banking regulations.",
    },
    {
        icon: Smartphone,
        title: "Mobile-First Design",
        description: "Seamless experience across all devices with our responsive platform.",
    },
    {
        icon: Banknote,
        title: "Competitive Rates",
        description: "Low fees and competitive exchange rates for all transactions.",
    },
];

export function WhyChooseUs() {
    return (
        <section className="bg-white dark:bg-[#0c0a09] py-24 md:py-32 relative">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col justify-center"
                    >
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-10 shadow-2xl border border-stone-200 dark:border-stone-800">
                            <Image
                                src="https://images.unsplash.com/photo-1715635846032-b30c7fd5b2d6?w=500&auto=format&fit=crop&q=60"
                                alt="Modern Banking Experience"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-stone-900/10 dark:bg-black/30" />
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">
                            The Monvana Advantage
                        </span>
                        <h2 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl dark:text-white font-serif italic">
                            Banking Reimagined for the{" "}
                            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Modern Era.</span>
                        </h2>
                        <p className="mt-6 text-lg text-stone-600 dark:text-stone-400 font-light leading-relaxed">
                            We've built our platform from the ground up with one goal in mind:
                            to provide you with the most secure, efficient, and user-friendly
                            banking experience possible.
                        </p>
                    </motion.div>

                    {/* Right Content - Features Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center"
                    >
                        <div className="grid gap-6 sm:grid-cols-2 w-full">
                            {reasons.map((reason, index) => (
                                <motion.div
                                    key={reason.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                    className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:bg-white dark:hover:bg-stone-900/80 hover:shadow-xl group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 mb-4 group-hover:border-amber-500/50 transition-colors">
                                        <reason.icon className="h-5 w-5 text-stone-700 dark:text-stone-300 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                    <h3 className="font-semibold text-stone-900 dark:text-white font-serif">
                                        {reason.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed">
                                        {reason.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
