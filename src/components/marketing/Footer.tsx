"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    Mail,
    Phone,
    MapPin,
    Twitter,
    Linkedin,
    Facebook,
    Instagram
} from "lucide-react";
import { BANK_NAME } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
    services: [
        { name: "Digital Wallet", href: "/sign-up" },
        { name: "Wire Transfers", href: "/sign-up" },
        { name: "Loans", href: "/sign-up" },
        { name: "Investments", href: "/sign-up" },
        { name: "Virtual Cards", href: "/sign-up" },
    ],
    company: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Press", href: "/press" },
        { name: "Blog", href: "/blog" },
        { name: "Contact", href: "/contact" },
    ],
    legal: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Security", href: "/security" },
        { name: "Compliance", href: "/compliance" },
    ],
    support: [
        { name: "Help Center", href: "/help" },
        { name: "FAQs", href: "/faqs" },
        { name: "Contact Support", href: "/contact" },
        { name: "Status", href: "/status" },
    ],
};

const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
];

export function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="container mx-auto px-4 py-16 md:px-6">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-stone-100 p-1 shadow-sm transition-transform group-hover:scale-110 dark:bg-stone-800">
                                <Image
                                    src="/monvanalogo.jpg"
                                    alt={BANK_NAME}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                                Monvana<span className="text-[#00DF89] font-medium font-serif italic ml-0.5">Bank</span>
                            </span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed">
                            Elevating your financial potential through bespoke wealth management
                            and cutting-edge digital sovereignty. Experience the Monvana standard.
                        </p>

                        {/* Contact Info */}
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                                <Mail className="h-4 w-4 text-stone-400" />
                                <span>support@monvana.online</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                                <Phone className="h-4 w-4 text-stone-400" />
                                <span>+1 (888) MONVANA</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                                <MapPin className="h-4 w-4 text-stone-400" />
                                <span>Private Offices, Zurich & New York</span>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="mt-6 flex gap-3">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.name}
                                    href={social.href}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    aria-label={social.name}
                                >
                                    <social.icon className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-semibold text-foreground">Services</h3>
                        <ul className="mt-4 space-y-3">
                            {footerLinks.services.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold text-foreground">Company</h3>
                        <ul className="mt-4 space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-foreground">Legal</h3>
                        <ul className="mt-4 space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-foreground">Support</h3>
                        <ul className="mt-4 space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <Separator className="my-12" />

                {/* Bottom Bar */}
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} {BANK_NAME}. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        Licensed and regulated. Member FDIC. Equal Housing Lender.
                    </p>
                </div>
            </div>
        </footer>
    );
}
