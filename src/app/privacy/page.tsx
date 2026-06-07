"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
                    <h1 className="text-5xl font-serif italic mb-4">Privacy & Data Sovereignity</h1>
                    <p className="text-stone-500 max-w-2xl mx-auto lead">
                        At Monvana, we believe your financial data is an extension of your identity.
                        Our commitment to privacy is absolute, governed by sovereign encryption and institutional integrity.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-400 mt-8">
                        <span>Last Updated: April 17, 2026</span>
                        <span className="h-1 w-1 bg-stone-300 rounded-full" />
                        <span>Version 2.1.0</span>
                    </div>
                </motion.div>

                <div className="space-y-16">
                    {/* Section 1: Identity Collection */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-stone-900 dark:text-stone-100">
                            <Shield className="h-6 w-6 text-stone-400" />
                            <h2 className="text-2xl font-semibold italic font-serif">1. Mandatory Identity Verification (KYC)</h2>
                        </div>
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-3xl space-y-4 leading-relaxed">
                            <p>
                                To maintain the integrity of our financial network and comply with international Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations, Monvana requires comprehensive identity verification for all institutional clients.
                            </p>
                            <p className="font-semibold underline">We collect and process the following sensitive data points:</p>
                            <ul className="list-disc pl-6 space-y-2 text-stone-600 dark:text-stone-400">
                                <li>Social Security Numbers (SSN), National Identification Numbers (NIN), or equivalent government-issued tax identifiers.</li>
                                <li>High-resolution digital captures of government-issued identification documents.</li>
                                <li>Biometric facial geometry verification (selfie-to-document matching).</li>
                                <li>Verified proof of residential or institutional address (utility invoices, bank certifications).</li>
                            </ul>
                            <p className="text-sm italic text-stone-500 bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border-l-4 border-stone-900">
                                Note: Admin personnel manually verify these identifiers to ensure zero-latency authenticity. Your full identification numbers are visible to authorized compliance officers for secondary verification on international secure gateways.
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Data Usage */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-stone-900 dark:text-stone-100">
                            <Lock className="h-6 w-6 text-stone-400" />
                            <h2 className="text-2xl font-semibold italic font-serif">2. How We Protect Your Sovereign Data</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border border-stone-200 dark:border-stone-800 p-6 rounded-2xl bg-white dark:bg-stone-900">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-stone-400" /> Administrative Access
                                </h3>
                                <p className="text-sm text-stone-500 leading-relaxed">
                                    Access to full identification numbers is strictly limited to Tier-3 Compliance Officers. Every access event is cryptographically logged in our immutable Audit Trail.
                                </p>
                            </div>
                            <div className="border border-stone-200 dark:border-stone-800 p-6 rounded-2xl bg-white dark:bg-stone-900">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-stone-400" /> Data Storage
                                </h3>
                                <p className="text-sm text-stone-500 leading-relaxed">
                                    Your documents are stored in private, air-gapped encryption buckets (AES-256) and are never shared with third-party marketing or profiling agencies.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: User Rights */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-stone-900 dark:text-stone-100">
                            <ChevronRight className="h-6 w-6 text-stone-400" />
                            <h2 className="text-2xl font-semibold italic font-serif">3. Your Consent and Rights</h2>
                        </div>
                        <div className="space-y-4 text-stone-600 dark:text-stone-400">
                            <p>
                                By utilizing Monvana Bank services, you explicitly consent to the manual and automated processing of your identity data for compliance purposes. You retain the right to request deletion of your data once an account is legally terminated and all regulatory holding periods have lapsed (typically 5-7 years for financial records).
                            </p>
                        </div>
                    </section>
                </div>

                <div className="mt-24 pt-12 border-t border-stone-200 dark:border-stone-800 text-center">
                    <p className="text-stone-400 text-sm mb-6">Concerns about your privacy? Speak with a Security Specialist.</p>
                    <Link href="/contact">
                        <Button variant="link" className="text-stone-900 dark:text-stone-100 underline underline-offset-4">Contact Monvana Bank Security</Button>
                    </Link>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-12">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-stone-500 text-xs">
                    <p>© 2026 Monvana International. Institutional Privacy Protocol.</p>
                    <div className="flex items-center gap-8">
                        <Link href="/terms" className="hover:text-stone-900 dark:hover:text-stone-100">Terms of Service</Link>
                        <Link href="/security" className="hover:text-stone-900 dark:hover:text-stone-100">Security Gateway</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
