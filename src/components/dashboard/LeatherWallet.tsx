"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Copy, Check, CreditCard } from "lucide-react";

interface WalletData {
    id: string;
    account_name: string;
    account_number: string;
    account_type: string;
    currency: string;
    balance: number;
    is_primary: boolean;
}

interface LeatherWalletProps {
    wallets: WalletData[];
    showBalance: boolean;
    onToggleBalance: () => void;
    onCopy: (text: string) => void;
    copied: boolean;
    firstName: string;
    lastName: string;
}

// Real leather texture URL
const LEATHER_TEXTURE = "https://images.unsplash.com/photo-1571829604981-ea159f94e5ad?w=600&auto=format&fit=crop&q=60";

// Card design variants with crypto background images
const getCardDesign = (currency: string, index: number) => {
    if (currency === "BTC") {
        return {
            gradient: "linear-gradient(135deg, #f7931a 0%, #c77600 100%)",
            backgroundImage: "https://images.pexels.com/photos/33045/lion-wild-africa-african.jpg?auto=compress&cs=tinysrgb&w=800",
            logo: "crypto",
            hasImage: true,
        };
    }
    if (currency === "ETH") {
        return {
            gradient: "linear-gradient(135deg, #627eea 0%, #3c4f9e 100%)",
            backgroundImage: "https://images.pexels.com/photos/1612353/pexels-photo-1612353.jpeg?auto=compress&cs=tinysrgb&w=800",
            logo: "crypto",
            hasImage: true,
        };
    }
    if (currency === "USDT") {
        return {
            gradient: "linear-gradient(135deg, #26a17b 0%, #1a7a5a 100%)",
            backgroundImage: "https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=800",
            logo: "crypto",
            hasImage: true,
        };
    }
    // USD and default cards
    const designs = [
        { gradient: "linear-gradient(135deg, #222, #444)", logo: "mastercard" },
        { gradient: "linear-gradient(135deg, #1a1f71, #2b32b2)", logo: "visa" },
        { gradient: "linear-gradient(135deg, #d32f2f, #b71c1c)", logo: "verve" },
    ];
    return { ...designs[index % designs.length], hasImage: false, backgroundImage: "" };
};

export function LeatherWallet({
    wallets,
    showBalance,
    onCopy,
    copied,
    firstName,
    lastName,
}: LeatherWalletProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (amount: number, currency = "USD") => {
        if (currency === "USD") {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);
        }
        return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ${currency}`;
    };

    // Handle wallet click - toggle open/close
    const handleWalletClick = useCallback(() => {
        console.log('[WALLET] Click! isOpen:', isOpen, 'selectedCardIndex:', selectedCardIndex);
        if (selectedCardIndex !== null) {
            setSelectedCardIndex(null);
        } else {
            setIsOpen(prev => !prev);
        }
    }, [isOpen, selectedCardIndex]);

    // Handle card click for expansion
    const handleCardClick = useCallback((e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        console.log('[WALLET] Card click! index:', index);
        if (isOpen) {
            setSelectedCardIndex(selectedCardIndex === index ? null : index);
        }
    }, [isOpen, selectedCardIndex]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setSelectedCardIndex(null);
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!wallets.length) return null;

    // Animation values - CENTERED scoop design
    const getCardAnimation = (index: number, totalCards: number) => {
        const reverseIndex = totalCards - 1 - index;

        if (selectedCardIndex === index) {
            // Selected card expands fully
            return {
                y: -180,
                rotate: 0,
                scale: 1.02,
                zIndex: 50,
            };
        }

        if (isOpen) {
            // Cards slide up with stagger
            return {
                y: -100 - (reverseIndex * 45),
                rotate: -2 + (reverseIndex * 2),
                scale: 1,
                zIndex: totalCards - reverseIndex,
            };
        }

        // Closed state - cards stacked, peeking through centered scoop
        return {
            y: 8 + (reverseIndex * 6),
            rotate: 0,
            scale: 1 - (reverseIndex * 0.02),
            zIndex: totalCards - reverseIndex,
        };
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full flex justify-center"
            style={{ minHeight: '220px' }}
        >
            {/* Wallet Container */}
            <div
                className="relative transition-transform duration-200 hover:scale-[1.02]"
                style={{
                    width: '300px',
                    height: '190px',
                }}
            >
                {/* Wallet Base - Full leather background */}
                <div
                    className="absolute bottom-0 w-full h-full rounded-xl overflow-hidden"
                    style={{
                        backgroundImage: `url('${LEATHER_TEXTURE}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
                        zIndex: 0,
                    }}
                >
                    {/* Darkening for depth */}
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Card Group - centered, behind wallet front */}
                <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                        top: '5px',
                        width: 'calc(100% - 40px)',
                        height: '100%',
                        zIndex: 1,
                    }}
                >
                    {wallets.map((wallet, index) => {
                        const design = getCardDesign(wallet.currency, index);
                        const animation = getCardAnimation(index, wallets.length);

                        return (
                            <motion.div
                                key={wallet.id}
                                className="absolute w-full left-0 cursor-pointer"
                                style={{ top: 0 }}
                                animate={{
                                    y: animation.y,
                                    rotate: animation.rotate,
                                    scale: animation.scale,
                                    zIndex: animation.zIndex,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                }}
                                onClick={(e) => handleCardClick(e, index)}
                            >
                                {/* Card */}
                                <div
                                    className="w-full h-[145px] rounded-xl overflow-hidden relative"
                                    style={{
                                        background: design.gradient,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {/* Background Image for Crypto Cards */}
                                    {design.hasImage && (
                                        <>
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url('${design.backgroundImage}')` }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
                                        </>
                                    )}

                                    {/* Glossy Effect */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                                    </div>

                                    {/* Card Content */}
                                    <div className="relative z-10 text-white h-full flex flex-col justify-between p-4">
                                        {/* Top Row */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider opacity-50">{wallet.currency} Balance</p>
                                                <h2 className="text-xl font-bold tracking-tight">
                                                    {showBalance ? formatCurrency(wallet.balance, wallet.currency) : "••••••"}
                                                </h2>
                                            </div>
                                            {/* Card Logo */}
                                            {design.logo === "mastercard" ? (
                                                <div className="relative w-12 h-8 flex items-center justify-end">
                                                    <div className="absolute right-0 w-5 h-5 rounded-full bg-[#eb001b] opacity-90" />
                                                    <div className="absolute right-4 w-5 h-5 rounded-full bg-[#f79e1b] opacity-90" />
                                                </div>
                                            ) : design.logo === "visa" ? (
                                                <span className="text-lg font-bold italic tracking-tight opacity-90">VISA</span>
                                            ) : design.logo === "crypto" ? (
                                                <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                                                    {wallet.currency}
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold opacity-90">Verve</span>
                                            )}
                                        </div>

                                        {/* Account Number */}
                                        <div>
                                            <p className="text-xs font-mono tracking-widest opacity-70">
                                                {showBalance
                                                    ? wallet.account_number?.replace(/(.{4})/g, "$1 ").trim()
                                                    : "•••• •••• •••• ••••"
                                                }
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[8px] opacity-40 uppercase tracking-wider">Card Holder</p>
                                                <p className="text-xs font-medium tracking-wide">
                                                    {wallet.account_name || `${firstName} ${lastName}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCopy(wallet.account_number || "");
                                                }}
                                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                            >
                                                {copied ? (
                                                    <Check className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Wallet Front - CENTERED scoop at top */}
                <AnimatePresence>
                    {selectedCardIndex === null && (
                        <motion.div
                            className="absolute bottom-0 w-full cursor-pointer"
                            style={{
                                height: '140px',
                                zIndex: 10,
                            }}
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleWalletClick();
                            }}
                        >
                            {/* Leather Shape with CENTERED scoop */}
                            <div
                                className="w-full h-full rounded-xl overflow-hidden pointer-events-none"
                                style={{
                                    backgroundImage: `url('${LEATHER_TEXTURE}')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    clipPath: `polygon(
                                        0% 25%,
                                        30% 25%,
                                        50% 0%,
                                        70% 25%,
                                        100% 25%,
                                        100% 100%,
                                        0% 100%
                                    )`,
                                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
                                }}
                            />

                            {/* Stitching - CENTERED scoop */}
                            <div
                                className="absolute rounded-lg pointer-events-none"
                                style={{
                                    top: '6px',
                                    left: '6px',
                                    right: '6px',
                                    bottom: '6px',
                                    border: '2px dashed rgba(236, 219, 186, 0.6)',
                                    clipPath: `polygon(
                                        0% 28%,
                                        28% 28%,
                                        50% 3%,
                                        72% 28%,
                                        100% 28%,
                                        100% 100%,
                                        0% 100%
                                    )`,
                                }}
                            />

                            {/* Embossed Brand Logo */}
                            <div
                                className="absolute flex items-center justify-center"
                                style={{
                                    bottom: '16px',
                                    right: '16px',
                                    width: '36px',
                                    height: '36px',
                                    border: '2px solid rgba(0,0,0,0.2)',
                                    borderRadius: '50%',
                                    opacity: 0.5,
                                    transform: 'rotate(-15deg)',
                                }}
                            >
                                <CreditCard className="w-4 h-4 text-black/30" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hint Text */}
            <motion.p
                className="absolute text-xs text-stone-500"
                style={{ bottom: '-35px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                {!isOpen && "Tap wallet to reveal cards"}
                {isOpen && selectedCardIndex === null && "Tap a card to select"}
                {selectedCardIndex !== null && "Tap anywhere to close"}
            </motion.p>
        </div>
    );
}
