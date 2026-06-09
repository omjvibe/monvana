"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { BANK_NAME } from "@/lib/constants";

export function CTA() {
    return (
        <section className="relative overflow-hidden bg-[#09090b] py-24 md:py-32">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-[#00DF89]/8 blur-[120px]" />
            </div>

            {/* Grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            {/* Border top glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-[#00DF89]/50 to-transparent" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#00DF89]/25 bg-[#00DF89]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00DF89] mb-6">
                        <Sparkles className="h-3.5 w-3.5" />
                        Join the Elite
                    </span>

                    <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
                        Ready to Experience{" "}
                        <span className="bg-gradient-to-r from-[#00DF89] to-[#00b870] bg-clip-text text-transparent italic">
                            Premium Banking?
                        </span>
                    </h2>

                    <p className="mt-6 text-lg text-stone-400 font-light leading-relaxed">
                        Join thousands of satisfied clients who trust {BANK_NAME} for their financial future.
                        Open your account in minutes and unlock global wealth management.
                    </p>

                    <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#00DF89] px-8 py-4 text-base font-bold text-black transition-all duration-200 hover:bg-[#00c578] hover:shadow-[0_0_40px_rgba(0,223,137,0.4)] active:scale-95"
                        >
                            Open an Account
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-white transition-all duration-200 hover:bg-white/10 backdrop-blur-sm"
                        >
                            Contact Sales
                        </Link>
                    </div>

                    <p className="mt-8 text-sm text-stone-600">
                        No credit check required &bull; Cancel anytime &bull; 256-bit SSL encryption
                    </p>
                </motion.div>
            </div>

            {/* Border bottom glow line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-[#00DF89]/30 to-transparent" />
        </section>
    );
}
