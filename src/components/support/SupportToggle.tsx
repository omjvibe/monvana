"use client";

import { useState, useEffect } from "react";
import { MoveHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupportToggle() {
    const [orientation, setOrientation] = useState<"left" | "right">("right");

    // Load orientation from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("smartsupp_orientation");
        if (saved === "left" || saved === "right") {
            setOrientation(saved);
            applyOrientation(saved);
        }
    }, []);

    const applyOrientation = (side: "left" | "right") => {
        if (typeof window !== "undefined" && (window as any).smartsupp) {
            (window as any).smartsupp("orientation", side);
        }
    };

    const toggleOrientation = () => {
        const newOrientation = orientation === "right" ? "left" : "right";
        localStorage.setItem("smartsupp_orientation", newOrientation);
        window.location.reload();
    };

    return (
        <div
            className={`fixed bottom-24 z-[2147483647] transition-all duration-300 ${orientation === "right" ? "right-4" : "left-4"
                }`}
        >
            <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all"
                onClick={toggleOrientation}
                title={`Move support to ${orientation === "right" ? "left" : "right"}`}
            >
                <MoveHorizontal className="h-5 w-5 text-black dark:text-white" />
            </Button>
        </div>
    );
}
