"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

export default function DraggableSupport() {
    const [isDragging, setIsDragging] = useState(false);

    const handleClick = () => {
        if (!isDragging) {
            if (typeof window !== "undefined" && (window as any).smartsupp) {
                (window as any).smartsupp("chat:open");
            }
        }
    };

    return (
        <motion.div
            drag
            dragConstraints={{
                top: 20,
                left: 20,
                right: typeof window !== "undefined" ? window.innerWidth - 80 : 0,
                bottom: typeof window !== "undefined" ? window.innerHeight - 80 : 0,
            }}
            initial={{ bottom: 30, right: 30 }}
            style={{
                position: "fixed",
                zIndex: 9999,
                cursor: "grab"
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, cursor: "grabbing" }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
                // Short timeout to prevent click trigger after drag
                setTimeout(() => setIsDragging(false), 100);
            }}
            onClick={handleClick}
            className="flex items-center justify-center w-14 h-14 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full shadow-2xl border border-stone-800/20 dark:border-stone-200/20"
        >
            <MessageCircle className="w-6 h-6" />
        </motion.div>
    );
}
