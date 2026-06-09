"use client";

import { motion } from "framer-motion";
import { FileCheck, ShieldAlert, Scale, Landmark, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100">
            {/* Header */}
            <header className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center text-white dark:text-stone-900 font-bold italic">M</div>
                        <span className="text-xl font-bold italic tracking-tight">Monvana</span>
                    </Link>
                    <Link href="/sign-up">
                        <Button variant="outline" className="rounded-full px-6">Open Account</Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-20 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 text-center mb-16"
                >
                    <h1 className="text-5xl italic mb-4">Terms of Operational Sovereignty</h1>
                    <p className="text-stone-500 max-w-2xl mx-auto lead">
                        Governing the partnership between Monvana International and our global clientele.
                        By accessing our ecosystem, you agree to the highest standards of financial conduct and institutional integrity.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-400 mt-8">
                        <span>Last Updated: April 17, 2026</span>
                    </div>
                </motion.div>

                <div className="space-y-16">
                    {/* Section 1: Compliance */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-stone-900 dark:text-stone-100">
                            <Scale className="h-6 w-6 text-stone-400" />
                            <h2 className="text-2xl font-semibold italic">1. Compliance & Verification Obligations</h2>
                        </div>
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-3xl space-y-6 leading-relaxed">
                            <div>
                                <h3 className="font-bold text-stone-900 dark:text-stone-100 mb-2">1.1 Identity Authenticity</h3>
                                <p className="text-stone-600 dark:text-stone-400">
                                    Users must provide accurate, current, and complete information during the onboarding and verification processes. Providing fraudulent identification (including falsified SSN, NIN, or document scans) will lead to immediate asset freezing and reporting to relevant financial authorities.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-900 dark:text-stone-100 mb-2">1.2 Mandatory KYC Compliance</h3>
                                <p className="text-stone-600 dark:text-stone-400">
                                    Monvana reserves the right to restrict account functionality, including withdrawals and transfers, until Know Your Customer (KYC) verification is successfully completed and approved by our manual review team.
                                </p>
                            </div>
                            <div className="bg-[#00DF89]/5 border-l-4 border-[#00DF89] p-4 rounded-r-xl">
                                <p className="text-sm font-medium text-stone-900 dark:text-stone-400">
                                    The "Verification" dashboard is the primary instrument of compliance. Failure to submit required documents within 14 days of account opening may result in automatic account suspension.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Account Sovereignty */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-stone-900 dark:text-stone-100">
                            <Landmark className="h-6 w-6 text-stone-400" />
                            <h2 className="text-2xl font-semibold italic">2. Institutional Limitations</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-2xl">
                                <FileCheck className="h-5 w-5 text-stone-400 mb-3" />
                                <h3 className="font-bold mb-2">Manual Verification</h3>
                                <p className="text-stone-500">Administrators may take up to 48 hours to cross-verify document authenticity against private institutional registers.</p>
                            </div>
                            <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-2xl">
                                <ShieldAlert className="h-5 w-5 text-stone-400 mb-3" />
                                <h3 className="font-bold mb-2">Transaction Suspension</h3>
                                <p className="text-stone-500">We reserve the right to audit and suspend any transaction that appears inconsistent with verified client profiles.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Governing Law */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-stone-900 dark:text-stone-100">
                            <ChevronRight className="h-6 w-6 text-stone-400" />
                            <h2 className="text-2xl font-semibold italic">3. Governing Law and Jurisdiction</h2>
                        </div>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            These terms are governed by the laws of Switzerland. Any disputes arising from the verification process or account sovereignty shall be settled through binding arbitration in the Canton of Zurich.
                        </p>
                    </section>
                </div>

                <div className="mt-24 pt-12 border-t border-stone-200 dark:border-stone-800 text-center">
                    <p className="text-stone-400 text-sm mb-6">By continuing, you acknowledge you have read and agreed to these Institutional Terms.</p>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-12">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-stone-500 text-xs">
                    <p>© 2026 Monvana International. Institutional Standard.</p>
                    <div className="flex items-center gap-8">
                        <Link href="/privacy" className="hover:text-stone-900 dark:hover:text-stone-100">Privacy Policy</Link>
                        <Link href="/compliance" className="hover:text-stone-900 dark:hover:text-stone-100">Compliance Gateway</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
