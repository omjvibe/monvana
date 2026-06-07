import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="mx-auto max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <FileQuestion className="h-10 w-10 text-muted-foreground" />
                    </div>
                </div>

                <h1 className="mb-2 text-6xl font-bold">404</h1>
                <h2 className="mb-2 text-2xl font-semibold">Page Not Found</h2>
                <p className="mb-8 text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button asChild variant="default">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
