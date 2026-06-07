"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BANK_NAME } from "@/lib/constants";

export function CTA() {
    return (
        <section className="relative overflow-hidden bg-primary py-20 md:py-32">
            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <h2 className="text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl lg:text-5xl">
                        Ready to Experience Modern Banking?
                    </h2>
                    <p className="mt-6 text-lg text-primary-foreground/80">
                        Join thousands of satisfied customers who trust {BANK_NAME} for their
                        financial needs. Open your account in minutes.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button
                            size="lg"
                            variant="secondary"
                            asChild
                            className="min-w-[180px]"
                        >
                            <Link href="/sign-up">
                                Open an Account
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="min-w-[180px] border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            <Link href="/contact">Contact Sales</Link>
                        </Button>
                    </div>
                    <p className="mt-6 text-sm text-primary-foreground/60">
                        No credit check required. Cancel anytime.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
