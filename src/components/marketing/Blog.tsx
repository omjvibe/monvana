"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const posts = [
    {
        title: "Understanding Digital Banking Security",
        excerpt: "Learn about the security measures that keep your online banking safe and how to protect yourself from fraud.",
        date: "Dec 10, 2024",
        category: "Security",
        readTime: "5 min read",
        slug: "#",
    },
    {
        title: "Investment Strategies for Beginners",
        excerpt: "A comprehensive guide to starting your investment journey with practical tips and risk management strategies.",
        date: "Dec 5, 2024",
        category: "Investments",
        readTime: "8 min read",
        slug: "#",
    },
    {
        title: "The Future of Mobile Banking",
        excerpt: "Explore emerging trends in mobile banking and how technology is reshaping the financial services industry.",
        date: "Nov 28, 2024",
        category: "Technology",
        readTime: "6 min read",
        slug: "#",
    },
];

export function Blog() {
    return (
        <section className="bg-[#0a0a0a] py-24 md:py-32 relative border-t border-stone-800">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-[10%] w-[30%] h-[50%] bg-[#00DF89]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-between gap-6 md:flex-row mb-16"
                >
                    <div className="text-center md:text-left">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00DF89]">
                            Market Intelligence
                        </span>
                        <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl italic">
                            Financial <span className="text-stone-400">Insights</span>
                        </h2>
                    </div>
                    <Button variant="outline" asChild className="border-stone-800 text-stone-300 hover:text-white hover:bg-stone-900 bg-transparent rounded-full px-6">
                        <Link href="/blog">
                            View All Publications
                            <ArrowRight className="ml-2 h-4 w-4 text-[#00DF89]" />
                        </Link>
                    </Button>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, index) => (
                        <motion.article
                            key={post.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link
                                href={post.slug}
                                className="group flex h-full flex-col rounded-3xl border border-stone-800 bg-stone-900/20 p-8 backdrop-blur-sm transition-all duration-300 hover:border-[#00DF89]/30 hover:bg-stone-900/40 hover:shadow-xl relative overflow-hidden"
                            >
                                {/* Gradient Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#00DF89]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Category */}
                                    <span className="inline-flex w-fit rounded-full border border-stone-800 bg-stone-950/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00DF89] shadow-sm">
                                        {post.category}
                                    </span>

                                    {/* Title */}
                                    <h3 className="mt-6 text-xl font-bold text-white group-hover:text-[#00DF89] transition-colors leading-snug">
                                        {post.title}
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="mt-4 flex-1 text-sm text-stone-400 font-light leading-relaxed">
                                        {post.excerpt}
                                    </p>

                                    {/* Meta */}
                                    <div className="mt-8 flex items-center gap-6 text-xs text-stone-500 font-medium uppercase tracking-wider border-t border-stone-800 pt-6">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-[#00DF89]" />
                                            {post.date}
                                        </span>
                                        <span>{post.readTime}</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
