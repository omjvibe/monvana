"use client";

import { motion } from "framer-motion";

const partners = [
    { name: "Visa", logo: "VISA" },
    { name: "Mastercard", logo: "MC" },
    { name: "Swift", logo: "SWIFT" },
    { name: "Stripe", logo: "Stripe" },
    { name: "PayPal", logo: "PayPal" },
    { name: "Apple Pay", logo: "Apple" },
    { name: "Google Pay", logo: "GPay" },
    { name: "Plaid", logo: "Plaid" },
];

export function Partners() {
    // Double the partners for seamless infinite scroll
    const allPartners = [...partners, ...partners];

    return (
        <section className="overflow-hidden bg-[#050505] py-12 md:py-16 border-y border-stone-900 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[2px] bg-amber-500/20 blur-[20px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/70"
                >
                    Strategic Partnerships
                </motion.p>
            </div>

            {/* Infinite Scroll Container */}
            <div className="relative mt-12 overflow-hidden">
                {/* Gradient Masks */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#050505] to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#050505] to-transparent" />

                {/* Scrolling Logos */}
                <div className="flex animate-[scroll_40s_linear_infinite] w-max">
                    {allPartners.map((partner, index) => (
                        <div
                            key={`${partner.name}-${index}`}
                            className="flex min-w-[150px] items-center justify-center px-8 md:min-w-[200px] md:px-12"
                        >
                            <div className="flex h-12 items-center justify-center rounded-xl border border-stone-800 bg-stone-900/30 px-8 py-2 transition-all duration-300 hover:border-amber-500/50 hover:bg-stone-900/60 backdrop-blur-sm group">
                                <span className="text-xl font-bold font-serif italic text-stone-500 group-hover:text-stone-300 transition-colors">
                                    {partner.logo}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
