"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
    { value: 50000, suffix: "+", label: "Active Users" },
    { value: 2.5, suffix: "B+", label: "Transactions Processed", prefix: "$" },
    { value: 180, suffix: "+", label: "Countries Served" },
    { value: 99.9, suffix: "%", label: "Uptime Guaranteed" },
];

function AnimatedCounter({
    value,
    suffix = "",
    prefix = "",
    duration = 2
}: {
    value: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
}) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(easeOutQuart * value);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [isInView, value, duration]);

    const displayValue = value % 1 === 0 ? Math.floor(count) : count.toFixed(1);

    return (
        <span ref={ref}>
            {prefix}{displayValue}{suffix}
        </span>
    );
}

export function Statistics() {
    return (
        <section className="relative py-24 md:py-32 overflow-hidden border-y border-stone-800">
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src="https://images.unsplash.com/photo-1733503747506-773e56e4078f?q=80&w=870&auto=format&fit=crop"
                    alt="Monvana Global Scale"
                    fill
                    className="object-cover grayscale opacity-20"
                />
                <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm" />
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 drop-shadow-md">
                        Global Impact
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl italic font-serif">
                        Excellence in <span className="bg-gradient-to-r from-stone-200 to-stone-500 bg-clip-text text-transparent">Numbers.</span>
                    </h2>
                    <p className="mt-6 text-lg text-stone-400 font-light leading-relaxed">
                        Our commitment to security and growth is reflected in every transaction we manage. We operate at a scale that ensures your assets are protected and highly liquid.
                    </p>
                </motion.div>

                <div className="mt-20 grid grid-cols-2 gap-x-8 gap-y-16 md:grid-cols-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <span className="text-4xl font-bold text-white md:text-5xl lg:text-6xl font-serif tracking-tight drop-shadow-xl group-hover:scale-105 transition-transform duration-500">
                                <AnimatedCounter
                                    value={stat.value}
                                    suffix={stat.suffix}
                                    prefix={stat.prefix}
                                />
                            </span>
                            <span className="mt-4 text-xs md:text-sm text-stone-400 uppercase tracking-widest font-medium">
                                {stat.label}
                            </span>
                            <div className="mt-6 w-12 h-px bg-amber-500/50 group-hover:w-24 transition-all duration-500" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
