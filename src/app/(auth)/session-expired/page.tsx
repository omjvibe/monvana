"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SessionExpiredPage() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            await supabase.auth.signOut();
            router.push("/sign-in");
        } catch (error) {
            console.error("Sign out error:", error);
            toast.error("Failed to sign out");
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-stone-900/50 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-800/30 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 260, 
                            damping: 20,
                            delay: 0.2
                        }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-900 border border-stone-800 mb-6 shadow-2xl"
                    >
                        <ShieldAlert className="h-10 w-10 text-stone-400" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 font-serif italic">
                        Session Expired
                    </h1>
                    <p className="text-stone-400">
                        Your session has timed out due to inactivity.
                    </p>
                </div>

                <Card className="bg-stone-900/40 border-stone-800/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-white">
                            Security Protocol
                        </CardTitle>
                        <CardDescription className="text-stone-500">
                            To protect your account, we have logged you out. Please sign in again to continue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="py-4">
                        <div className="p-4 bg-stone-950/50 rounded-lg border border-stone-800/50 text-center">
                            <p className="text-sm text-stone-400">
                                Protected by Monvana Bank Security
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8">
                        <Button 
                            type="button" 
                            className="w-full h-12 bg-white text-stone-950 hover:bg-stone-200 transition-colors font-semibold"
                            onClick={handleSignOut}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign In Again
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-8 text-stone-600 text-xs uppercase tracking-widest font-semibold"
                >
                    Monvana Bank • Private Wealth Management
                </motion.p>
            </motion.div>
        </div>
    );
}
