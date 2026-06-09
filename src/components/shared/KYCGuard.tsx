"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@/hooks/useAuth";
import { ShieldAlert, Loader2, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KYCGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState<string>("loading");
    const [isMandatory, setIsMandatory] = useState(false);

    useEffect(() => {
        if (!isLoaded || !user) return;

        async function checkKYC() {
            try {
                // 1. Check if KYC is mandatory from settings
                const { data: settings } = await supabase
                    .from("bank_settings")
                    .select("value")
                    .eq("key", "require_kyc")
                    .single();

                const mandatory = settings?.value === "true";
                setIsMandatory(mandatory);

                if (!mandatory) {
                    setStatus("allowed");
                    return;
                }

                // 2. Check user's KYC status
                const { data: dbUser } = await supabase
                    .from("users")
                    .select("kyc_status, role")
                    .eq("clerk_id", user?.id)
                    .single();

                // Admins bypass KYC
                if (dbUser?.role === 'admin') {
                    setStatus("allowed");
                    return;
                }

                if (dbUser?.kyc_status === 'approved') {
                    setStatus("allowed");
                } else if (pathname === '/user/kyc') {
                    // Don't block the KYC page itself
                    setStatus("allowed");
                } else {
                    setStatus("blocked");
                }
            } catch (error) {
                console.error("KYC Check Error:", error);
                // Fail safe: allow if check fails (or block if you prefer)
                setStatus("allowed");
            }
        }

        checkKYC();
    }, [user, isLoaded, pathname]);

    if (!isLoaded || status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    if (status === "blocked") {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-4">
                <Card className="max-w-md w-full border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden">
                    <div className="h-2 bg-stone-900" />
                    <CardHeader className="text-center pt-8">
                        <div className="mx-auto h-16 w-16 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-stone-600" />
                        </div>
                        <CardTitle className="text-2xl italic">Identity Verification Required</CardTitle>
                        <p className="text-stone-500 text-sm mt-2">
                            To ensure the security of our institutional ecosystem, you must complete identity verification before accessing financial services.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-900">
                            <ul className="text-xs space-y-3 text-stone-600 dark:text-stone-400">
                                <li className="flex items-center gap-2">
                                    <ShieldAlert className="h-3 w-3 text-stone-400" />
                                    Prevents unauthorized account access
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldAlert className="h-3 w-3 text-stone-400" />
                                    Complies with international AML standards
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldAlert className="h-3 w-3 text-stone-400" />
                                    Enables higher transaction limits
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8">
                        <Button
                            className="w-full bg-stone-900 text-white hover:bg-stone-800"
                            onClick={() => router.push('/user/kyc')}
                        >
                            Verify Identity Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
