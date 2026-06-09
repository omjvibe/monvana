"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const reviews = [
    {
        name: "Sarah Johnson",
        role: "Asset Portfolio Manager",
        content: "Monvana Bank has transformed how I manage institutional liquidity. The real-time settlement feature is unmatched in the industry.",
        rating: 5,
        initials: "SJ",
    },
    {
        name: "Michael Chen",
        role: "Quantitative Analyst",
        content: "The interface is surgical in its precision. Monvana understands the requirements of high-frequency capital movement.",
        rating: 5,
        initials: "MC",
    },
    {
        name: "Emily Rodriguez",
        role: "Global Philanthropist",
        content: "Multi-currency support and seamless charity integration make Monvana the only platform I trust for international impact.",
        rating: 5,
        initials: "ER",
    },
    {
        name: "David Thompson",
        role: "Venture Capitalist",
        content: "The private equity access and sophisticated analytics provided by Monvana have elevated our portfolio performance.",
        rating: 5,
        initials: "DT",
    },
    {
        name: "Lisa Wang",
        role: "Luxury Estates CEO",
        content: "The Monvana Bank team handles our corporate transactions with unmatched discretion and speed. A true partner in global expansion.",
        rating: 5,
        initials: "LW",
    },
    {
        name: "James Miller",
        role: "Tech Entrepreneur",
        content: "Immediate access to liquidity and the premium credit facility helped us secure our latest acquisition without delay.",
        rating: 5,
        initials: "JM",
    },
];

export function Reviews() {
    return (
        <section className="bg-[#0a0a0a] py-24 md:py-32 relative border-y border-stone-800">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[30%] h-[50%] bg-[#00DF89]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-stone-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00DF89]">
                        Client Testimonials
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl italic">
                        The Standard of <span className="text-stone-400">Excellence</span>
                    </h2>
                    <p className="mt-6 text-lg text-stone-400 font-light">
                        Don't just take our word for it. Discover how we're redefining wealth management for the global elite.
                    </p>
                </motion.div>

                <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review, index) => (
                        <motion.div
                            key={review.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative rounded-3xl border border-stone-800 bg-stone-900/20 p-8 backdrop-blur-sm hover:bg-stone-900/40 hover:border-[#00DF89]/30 transition-all duration-300 group shadow-xl"
                        >
                            {/* Quote icon */}
                            <Quote className="absolute right-8 top-8 h-10 w-10 text-stone-800 group-hover:text-stone-700 transition-colors" />

                            {/* Rating */}
                            <div className="flex gap-1.5 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < review.rating
                                            ? "fill-[#00DF89] text-[#00DF89]"
                                            : "text-stone-700"
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-stone-300 font-light leading-relaxed mb-8 relative z-10">"{review.content}"</p>

                            {/* Author */}
                            <div className="flex items-center gap-4 border-t border-stone-800 pt-6 mt-auto">
                                <Avatar className="h-12 w-12 border border-stone-700">
                                    <AvatarFallback className="bg-stone-800 text-[#00DF89] italic">
                                        {review.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-white tracking-wide">{review.name}</p>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">{review.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
