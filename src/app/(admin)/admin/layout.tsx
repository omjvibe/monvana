"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/shared/UserButton";
import { useUser, useClerk } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    Users,
    Receipt,
    Landmark,
    TrendingUp,
    Heart,
    Bitcoin,
    FileText,
    Settings,
    Menu,
    Shield,
    MessageCircle,
    Mail,
    LogOut,
    BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { BANK_NAME, ADMIN_NAV_ITEMS } from "@/lib/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Users,
    Receipt,
    Landmark,
    TrendingUp,
    Heart,
    Bitcoin,
    FileText,
    Settings,
    MessageCircle,
    Mail,
    BarChart3,
};

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { user } = useUser();
    const { signOut } = useClerk();

    // Fix hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const NavLinks = ({ onClose }: { onClose?: () => void }) => (
        <>
            {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        {Icon && <Icon className="h-4 w-4" />}
                        {item.name}
                    </Link>
                );
            })}
        </>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar - Fixed */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r border-border bg-card">
                <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                            <Image src="/monvanalogo.jpg" alt={BANK_NAME} width={32} height={32} className="object-cover" />
                        </div>
                        <div>
                            <span className="text-lg font-semibold italic">Monvana<span className="text-[#00DF89] font-medium italic ml-0.5">Bank</span></span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                                Admin
                            </Badge>
                        </div>
                    </Link>
                </div>

                <ScrollArea className="flex-1 px-4 py-4">
                    <nav className="space-y-1">
                        <NavLinks />
                    </nav>
                </ScrollArea>

                <div className="border-t border-border p-4">
                    <div className="flex items-center gap-3">
                        {mounted && <UserButton afterSignOutUrl="/" appearance={{ elements: { activeDeviceList: "hidden", activeDevices: "hidden", activeDeviceItem: "hidden" } }} />}
                        {mounted && (
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    Administrator
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area - With left margin for fixed sidebar */}
            <div className="lg:pl-64">
                {/* Top Header - Sticky */}
                <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
                    {/* Mobile Menu */}
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild className="lg:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                                    <Image src="/monvanalogo.jpg" alt={BANK_NAME} width={32} height={32} className="object-cover" />
                                </div>
                                <span className="text-lg font-semibold italic">Monvana<span className="text-[#00DF89] font-medium italic ml-0.5">Bank</span></span>
                            </div>
                            <ScrollArea className="flex-1 px-4 py-4">
                                <nav className="space-y-1">
                                    <NavLinks onClose={() => setSidebarOpen(false)} />
                                </nav>
                            </ScrollArea>
                            {/* Mobile User Info & Logout */}
                            <div className="border-t border-border p-4 space-y-3">
                                {mounted && user && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                            {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-medium">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                Administrator
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                                    onClick={() => {
                                        setSidebarOpen(false);
                                        signOut();
                                    }}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="hidden lg:block">
                        <h1 className="text-lg font-semibold">{BANK_NAME} Admin</h1>
                    </div>

                    <div className="flex-1" />

                    {/* Header Actions */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <NotificationsDropdown isAdmin />
                        <div className="hidden lg:block">
                            <UserButton afterSignOutUrl="/" appearance={{ elements: { activeDeviceList: "hidden", activeDevices: "hidden", activeDeviceItem: "hidden" } }} />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1">
                    <div className="container mx-auto p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
