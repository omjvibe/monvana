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
        <section className="relative bg-[#0c0c0e] py-24 md:py-32 overflow-hidden">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[#00DF89]/5 blur-[140px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-stone-800/20 blur-[100px]" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#00DF89]/25 bg-[#00DF89]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00DF89]">
                            Our Legacy
                        </span>
                        <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
                            Architecting the Future of{" "}
                            <span className="bg-gradient-to-r from-[#00DF89] to-[#00b870] bg-clip-text text-transparent italic">
                                Capital.
                            </span>
                        </h2>
                        <p className="mt-6 text-lg text-stone-400 font-light leading-relaxed">
                            {BANK_NAME} was founded with a singular objective: to provide total financial
                            liberty to those who operate at the highest levels of global commerce.
                            We bridge traditional wealth with the digital frontier.
                        </p>

                        <div className="mt-10 space-y-4">
                            {highlights.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 transition-all duration-300 group-hover:border-[#00DF89]/40 group-hover:bg-[#00DF89]/10">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-stone-500 group-hover:text-[#00DF89] transition-colors" />
                                    </div>
                                    <span className="text-sm text-stone-400 font-light group-hover:text-stone-200 transition-colors">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="relative"
                    >
                        {/* Corner brackets */}
                        <div className="absolute -top-4 -left-4 h-10 w-10 border-t-2 border-l-2 border-[#00DF89]/50 rounded-tl-lg z-10" />
                        <div className="absolute -bottom-4 -right-4 h-10 w-10 border-b-2 border-r-2 border-[#00DF89]/50 rounded-br-lg z-10" />

                        {/* Glow */}
                        <div className="absolute inset-6 bg-[#00DF89]/8 blur-3xl rounded-full" />

                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
                            <Image
                                src="https://images.unsplash.com/photo-1705948354275-d55101017fb6?w=500&auto=format&fit=crop&q=60"
                                alt="Monvana Private Banking Team"
                                fill
                                className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/85 via-black/10 to-transparent flex flex-col justify-end p-8">
                                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-2xl">
                                    <p className="text-white text-base font-light italic leading-snug">"Excellence is not an act, but a habit."</p>
                                    <p className="text-[#00DF89] text-xs mt-3 uppercase tracking-widest font-semibold">— Monvana Executive Board</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
