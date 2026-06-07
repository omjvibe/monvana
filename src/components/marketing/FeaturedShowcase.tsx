"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturedShowcase() {
    return (
        <section className="bg-[#0a0a0a] py-24 md:py-32 relative overflow-hidden text-white">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-stone-500/10 blur-[100px]" />
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-3xl text-center mb-20"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">
                        Monvana Standard
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white font-serif italic">
                        Modern Banking, Refined.
                    </h2>
                    <p className="mt-6 text-xl text-stone-400 font-light leading-relaxed">
                        Designed for the global elite, built for total sovereignty. Our platform combines
                        industrial-grade security with an unmatched aesthetic experience.
                    </p>
                </motion.div>

                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    {/* Visual Showcase */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-stone-800 group">
                            <Image
                                src="https://images.unsplash.com/photo-1556740714-a8395b3bf30f?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0"
                                alt="Monvana Private Banking Interface"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="backdrop-blur-md bg-white/10 p-4 rounded-xl border border-white/20">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                            <ShieldCheck className="h-6 w-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">Military Grade</h4>
                                            <p className="text-xs text-stone-300">Quantum-resistant encryption</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Showcase */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col gap-10"
                    >
                        <div className="space-y-6">
                            <h3 className="text-3xl md:text-4xl font-bold text-white font-serif italic">
                                Digital Sovereignty
                            </h3>
                            <p className="text-stone-400 font-light text-lg leading-relaxed">
                                Deploy bespoke virtual liquidity anywhere in the world.
                                Exercise total control over your digital footprint with instant
                                issuance, freezing, and multi-currency support.
                            </p>
                            <Button asChild size="lg" className="w-fit bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium">
                                <Link href="/sign-up">
                                    Apply for Membership <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-stone-800 shadow-2xl group">
                            <Image
                                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0"
                                alt="Monvana Elite Dashboard"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-transparent transition-colors duration-500" />
                        </div>
                    </motion.div>
                </div>

                {/* Security and Investment Row */}
                <div className="mt-32 grid gap-8 md:grid-cols-3">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Sovereign Vaults",
                            desc: "Biometric isolation and quantum-resistant encryption protocols for your primary reserves."
                        },
                        {
                            icon: TrendingUp,
                            title: "Curated Portfolios",
                            desc: "Algorithmic wealth generation powered by multi-vector market analytics."
                        },
                        {
                            icon: Globe2,
                            title: "Impact Legacies",
                            desc: "Seamless philanthropic integration into verified global humanitarian sectors."
                        }
                    ].map((item, idx) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="flex flex-col items-center text-center p-10 rounded-3xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl group"
                        >
                            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 group-hover:border-amber-500/50 transition-colors">
                                <item.icon className="w-8 h-8 text-amber-400" />
                            </div>
                            <h4 className="text-xl font-semibold text-white font-serif">{item.title}</h4>
                            <p className="mt-4 text-sm text-stone-400 font-light leading-relaxed">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
