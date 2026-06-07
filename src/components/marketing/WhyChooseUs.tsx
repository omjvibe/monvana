"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
    Shield,
    Clock,
    Headphones,
    Lock,
    Smartphone,
    Banknote,
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
        description: "Low fees and competitive exchange rates for all your transactions.",
    },
];

export function WhyChooseUs() {
    return (
        <section className="relative bg-[#0c0c0e] py-24 md:py-32 overflow-hidden">
            {/* Ambient glows */}
            <div className="pointer-events-none absolute top-0 left-0 h-[400px] w-[600px] rounded-full bg-[#00DF89]/5 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-stone-800/20 blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">

                    {/* Left — Image + intro */}
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="flex flex-col justify-center"
                    >
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10 shadow-2xl border border-white/5 group">
                            <Image
                                src="/images/business-man.jpeg"
                                alt="Modern Banking Experience"
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/70 via-transparent to-transparent" />
                            {/* Green corner accent */}
                            <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-[#00DF89]/50 rounded-tl-md" />
                            <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-[#00DF89]/50 rounded-br-md" />
                        </div>

                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#00DF89]/25 bg-[#00DF89]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00DF89]">
                            The Monvana Advantage
                        </span>
                        <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-white md:text-5xl leading-tight">
                            Banking Reimagined for the{" "}
                            <span className="bg-gradient-to-r from-[#00DF89] to-[#00b870] bg-clip-text text-transparent italic font-serif">
                                Modern Era.
                            </span>
                        </h2>
                        <p className="mt-5 text-lg text-stone-400 font-light leading-relaxed">
                            We've built our platform from the ground up with one goal: to provide you with the most secure, efficient, and user-friendly banking experience possible.
                        </p>
                    </motion.div>

                    {/* Right — Feature grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="flex items-center"
                    >
                        <div className="grid gap-5 sm:grid-cols-2 w-full">
                            {reasons.map((reason, index) => (
                                <motion.div
                                    key={reason.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
                                    className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#00DF89]/25 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(0,223,137,0.06)]"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/5 mb-4 transition-all group-hover:border-[#00DF89]/30 group-hover:bg-[#00DF89]/10">
                                        <reason.icon className="h-4.5 w-4.5 text-stone-400 group-hover:text-[#00DF89] transition-colors" />
                                    </div>
                                    <h3 className="font-semibold text-white text-sm group-hover:text-[#00DF89] transition-colors">
                                        {reason.title}
                                    </h3>
                                    <p className="mt-2 text-xs text-stone-500 font-light leading-relaxed">
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
