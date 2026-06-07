"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="mx-auto max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                </div>

                <h1 className="mb-2 text-2xl font-bold">Something went wrong!</h1>
                <p className="mb-6 text-muted-foreground">
                    We apologize for the inconvenience. An unexpected error has occurred.
                </p>

                {error.digest && (
                    <p className="mb-6 rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button onClick={reset} variant="default">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
