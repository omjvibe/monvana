"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoanShowcase() {
    return (
        <section className="bg-[#0a0a0a] py-24 md:py-32 relative overflow-hidden border-t border-stone-800">
            {/* Ambient Background Glow */}
            <div className="absolute top-[20%] left-0 w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    {/* Image Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative lg:order-last"
                    >
                        <div className="absolute inset-0 bg-stone-500/10 blur-3xl rounded-full scale-110" />
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-800 aspect-[4/3] group">
                            <Image
                                src="https://images.unsplash.com/photo-1648824572507-24e6e9ef6916?w=500&auto=format&fit=crop&q=60"
                                alt="Monvana Premium Loan Services"
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/60 via-transparent to-transparent mix-blend-multiply" />
                            
                            {/* Floating Stats Card */}
                            <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-64">
                                <div className="backdrop-blur-xl bg-white/10 p-5 rounded-2xl border border-white/20 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                            <Landmark className="h-4 w-4 text-amber-400" />
                                        </div>
                                        <span className="text-sm font-semibold text-white">Credit Facility</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white font-serif tracking-tight">$25M+</div>
                                    <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Instant Approval</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="inline-flex w-fit items-center rounded-full border border-stone-700 bg-stone-900/50 backdrop-blur-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 shadow-sm">
                            <Landmark className="mr-2 h-3 w-3" />
                            Elite Credit Solutions
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl italic font-serif leading-tight">
                            Liquidity Without <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">Limits.</span>
                        </h2>
                        <p className="text-lg text-stone-400 font-light leading-relaxed">
                            Access multi-million dollar credit lines with preferred interest rates.
                            Our bespoke lending solutions are designed around your unique asset structure,
                            allowing for instant deployment of capital across global markets.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-8 py-6 border-y border-stone-800">
                            <div>
                                <h4 className="text-3xl font-bold text-white italic font-serif">1.85%</h4>
                                <p className="text-xs text-stone-500 uppercase tracking-[0.15em] mt-2 font-medium">Starting APR</p>
                            </div>
                            <div>
                                <h4 className="text-3xl font-bold text-white italic font-serif">$25M+</h4>
                                <p className="text-xs text-stone-500 uppercase tracking-[0.15em] mt-2 font-medium">Max Credit Line</p>
                            </div>
                        </div>

                        <Button asChild size="lg" className="w-fit mt-4 bg-amber-500 text-stone-950 hover:bg-amber-400 font-medium">
                            <Link href="/sign-up">
                                Apply for Private Credit <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
