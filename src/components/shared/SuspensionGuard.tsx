"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@/hooks/useAuth";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SuspensionGuardProps {
    children: React.ReactNode;
}

export function SuspensionGuard({ children }: SuspensionGuardProps) {
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { signOut } = useClerk();

    useEffect(() => {
        async function checkStatus() {
            try {
                const response = await fetch("/api/user/status");
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data.status);

                    // If user is deleted, sign them out
                    if (data.isDeleted) {
                        await signOut();
                        router.push("/");
                    }
                }
            } catch (error) {
                console.error("Error checking status:", error);
            } finally {
                setLoading(false);
            }
        }

        checkStatus();

        // Check status periodically (every 30 seconds)
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [router, signOut]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Show suspension screen
    if (status === "suspended") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                            Account Suspended
                        </CardTitle>
                        <CardDescription className="text-base">
                            Your account has been temporarily suspended
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-sm text-muted-foreground">
                            Your account access has been restricted. This may be due to
                            suspicious activity, pending verification, or a policy violation.
                        </p>
                        <p className="text-center text-sm text-muted-foreground">
                            Please contact our support team for assistance in restoring
                            your account access.
                        </p>
                        <div className="bg-muted rounded-lg p-4 text-center">
                            <p className="text-sm font-medium">Need Help?</p>
                            <p className="text-sm text-muted-foreground">
                                Email: support@monvana.online
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => signOut()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
