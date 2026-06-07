"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
    { value: 50000, suffix: "+", label: "Active Users" },
    { value: 2.5, suffix: "B+", label: "Transactions Processed", prefix: "$" },
    { value: 190, suffix: "+", label: "Countries Served" },
    { value: 99.9, suffix: "%", label: "Uptime Guaranteed" },
];

function AnimatedCounter({
    value,
    suffix = "",
    prefix = "",
    duration = 2,
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
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(easeOutQuart * value);
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
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
        <section className="relative py-24 md:py-32 overflow-hidden bg-[#09090b]">
            {/* Background Image with heavy overlay */}
            <div className="absolute inset-0">
                <Image
                    src="https://images.unsplash.com/photo-1733503747506-773e56e4078f?q=80&w=870&auto=format&fit=crop"
                    alt="Monvana Global Scale"
                    fill
                    className="object-cover opacity-10 grayscale"
                />
                <div className="absolute inset-0 bg-[#09090b]/85" />
            </div>

            {/* Green ambient glow */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[700px] rounded-full bg-[#00DF89]/6 blur-[120px]" />
            </div>

            {/* Border lines */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00DF89]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#00DF89]/25 bg-[#00DF89]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00DF89]">
                        Global Impact
                    </span>
                    <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
                        Excellence in{" "}
                        <span className="bg-gradient-to-r from-[#00DF89] to-[#00b870] bg-clip-text text-transparent italic font-serif">
                            Numbers.
                        </span>
                    </h2>
                    <p className="mt-5 text-lg text-stone-400 font-light leading-relaxed">
                        Our commitment to security and growth is reflected in every transaction we manage globally.
                    </p>
                </motion.div>

                <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.12 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <span className="text-4xl font-extrabold text-white md:text-5xl lg:text-6xl tracking-tight group-hover:text-[#00DF89] transition-colors duration-500">
                                <AnimatedCounter
                                    value={stat.value}
                                    suffix={stat.suffix}
                                    prefix={stat.prefix}
                                />
                            </span>
                            <span className="mt-4 text-xs md:text-sm text-stone-500 uppercase tracking-widest font-medium">
                                {stat.label}
                            </span>
                            <div className="mt-5 h-px w-8 bg-[#00DF89]/40 group-hover:w-20 transition-all duration-500" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
