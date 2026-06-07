"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { BANK_NAME } from "@/lib/constants";

const highlights = [
    "Established with a vision for sovereign digital banking",
    "Licensed and regulated global financial institution",
    "Advanced AI-driven fraud prevention systems",
    "Dedicated Monvana Bank team available 24/7",
    "Continuous innovation in wealth technology",
    "Absolute commitment to client privacy and security",
];

export function AboutUs() {
    return (
        <section className="bg-white dark:bg-[#0c0a09] py-24 md:py-32 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">
                            Our Legacy
                        </span>
                        <h2 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl lg:text-6xl dark:text-stone-50 italic font-serif">
                            Architecting the Future of <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Capital.</span>
                        </h2>
                        <p className="mt-8 text-lg text-stone-600 dark:text-stone-400 font-light leading-relaxed">
                            {BANK_NAME} was founded with a singular objective: to provide total financial
                            liberty to those who operate at the highest levels of global commerce.
                            We bridge traditional wealth with the digital frontier.
                        </p>

                        <div className="mt-12 space-y-5">
                            {highlights.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 transition-colors group-hover:border-amber-500/50">
                                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <span className="text-stone-700 dark:text-stone-300 font-light tracking-wide">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Content - Team Photo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-stone-500/10 blur-3xl rounded-full scale-110" />
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 group">
                            <Image
                                src="https://images.unsplash.com/photo-1705948354275-d55101017fb6?w=500&auto=format&fit=crop&q=60"
                                alt="Monvana Private Banking Team"
                                fill
                                className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                                <div className="backdrop-blur-md bg-white/10 border border-white/20 p-6 rounded-2xl">
                                    <p className="text-white text-lg font-light italic leading-snug">"Excellence is not an act, but a habit."</p>
                                    <p className="text-amber-400 text-xs mt-3 uppercase tracking-widest font-semibold">— Monvana Executive Board</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
