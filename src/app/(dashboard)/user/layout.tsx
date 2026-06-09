"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/shared/UserButton";
import { useUser, useClerk } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Receipt,
    ArrowLeftRight,
    Download,
    Upload,
    Landmark,
    TrendingUp,
    CreditCard,
    Heart,
    MessageCircle,
    Settings,
    Menu,
    Bell,
    X,
    LogOut,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SuspensionGuard } from "@/components/shared/SuspensionGuard";
import KYCGuard from "@/components/shared/KYCGuard";
import { BANK_NAME, USER_NAV_ITEMS } from "@/lib/constants";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShieldCheck } from "lucide-react";

const supabase = createClient();

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Receipt,
    ArrowLeftRight,
    Download,
    Upload,
    Landmark,
    TrendingUp,
    CreditCard,
    Heart,
    MessageCircle,
    Settings,
    ShieldCheck,
};

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch notifications
    useEffect(() => {
        async function fetchNotifications() {
            if (!user?.id) return;

            try {
                // Get user ID from Supabase
                const { data: userData } = await supabase
                    .from("users")
                    .select("id")
                    .eq("clerk_id", user.id)
                    .single();

                if (userData) {
                    // Fetch recent notifications
                    const { data: notifData } = await supabase
                        .from("notifications")
                        .select("*")
                        .eq("user_id", userData.id)
                        .order("created_at", { ascending: false })
                        .limit(10);

                    if (notifData) {
                        setNotifications(notifData);
                        setUnreadCount(notifData.filter(n => !n.is_read).length);
                    }

                    // Also check for unread messages
                    const { data: messageData } = await supabase
                        .from("messages")
                        .select("id")
                        .eq("user_id", userData.id)
                        .eq("is_read", false)
                        .neq("sender_type", "user");

                    if (messageData && messageData.length > 0) {
                        // Add message notification
                        const existingMessageNotif = notifications.find(n => n.type === "message");
                        if (!existingMessageNotif) {
                            setNotifications(prev => [{
                                id: "msg-notif",
                                title: "New Messages",
                                message: `You have ${messageData.length} unread message${messageData.length > 1 ? "s" : ""}`,
                                type: "message",
                                is_read: false,
                                created_at: new Date().toISOString(),
                            }, ...prev]);
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        }

        if (isLoaded && user) {
            fetchNotifications();
        }
    }, [user, isLoaded]);

    const markAsRead = async (notificationId: string) => {
        if (notificationId === "msg-notif") {
            // Handle message notification separately
            setNotifications(prev => prev.filter(n => n.id !== "msg-notif"));
            setUnreadCount(prev => Math.max(0, prev - 1));
            return;
        }

        try {
            await supabase
                .from("notifications")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("id", notificationId);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;

        try {
            const { data: userData } = await supabase
                .from("users")
                .select("id")
                .eq("clerk_id", user.id)
                .single();

            if (userData) {
                await supabase
                    .from("notifications")
                    .update({ is_read: true, read_at: new Date().toISOString() })
                    .eq("user_id", userData.id);

                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const NavLinks = ({ onClose }: { onClose?: () => void }) => (
        <>
            {USER_NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                            ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
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
        <SuspensionGuard>
            <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950">
                {/* Desktop Sidebar - Fixed/Sticky */}
                <aside className="hidden w-64 border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950 lg:flex lg:flex-col fixed inset-y-0 left-0 z-30">
                    <div className="flex h-16 items-center gap-2 border-b border-stone-200 px-6 dark:border-stone-800">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-lg">
                                <Image src="/monvanalogo.jpg" alt={BANK_NAME} width={36} height={36} className="object-cover" />
                            </div>
                            <span className="text-lg font-bold text-stone-900 dark:text-stone-100 italic">Monvana<span className="text-[#00DF89] font-medium italic ml-0.5">Bank</span></span>
                        </Link>
                    </div>

                    <ScrollArea className="flex-1 px-4 py-4">
                        <nav className="space-y-1">
                            <NavLinks />
                        </nav>
                    </ScrollArea>

                    <div className="border-t border-stone-200 p-4 dark:border-stone-800">
                        <div className="flex items-center gap-3">
                            {mounted && <UserButton afterSignOutUrl="/" appearance={{ elements: { activeDeviceList: "hidden", activeDevices: "hidden", activeDeviceItem: "hidden" } }} />}
                            {mounted && isLoaded && user && (
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                                        {user.firstName || ""} {user.lastName || ""}
                                    </p>
                                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                                        {user.primaryEmailAddress?.emailAddress || ""}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content - offset for fixed sidebar on desktop */}
                <div className="flex flex-1 flex-col lg:ml-64">
                    {/* Top Header */}
                    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-stone-200 bg-white/95 px-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 lg:px-6">
                        {/* Mobile Menu */}
                        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                            <SheetTrigger asChild className="lg:hidden">
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-0 flex flex-col">
                                <div className="flex h-16 items-center gap-2.5 border-b border-stone-200 px-6 dark:border-stone-800">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                                        <Image src="/monvanalogo.jpg" alt={BANK_NAME} width={32} height={32} className="object-cover" />
                                    </div>
                                    <span className="text-lg font-bold italic">Monvana<span className="text-[#00DF89] font-medium italic ml-0.5">Bank</span></span>
                                </div>
                                <ScrollArea className="flex-1 px-4 py-4">
                                    <nav className="space-y-1">
                                        <NavLinks onClose={() => setSidebarOpen(false)} />
                                    </nav>
                                </ScrollArea>
                                {/* Mobile User Info & Logout */}
                                <div className="border-t border-stone-200 p-4 dark:border-stone-800 space-y-3">
                                    {mounted && isLoaded && user && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700 text-sm font-semibold text-stone-700 dark:text-stone-200">
                                                {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                                                    {user.firstName || ""} {user.lastName || ""}
                                                </p>
                                                <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                                                    {user.primaryEmailAddress?.emailAddress || ""}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                                        disabled={isLoggingOut}
                                        onClick={async () => {
                                            try {
                                                setIsLoggingOut(true);
                                                setSidebarOpen(false);
                                                await signOut();
                                                window.location.href = "/";
                                            } catch (error) {
                                                console.error("Logout error:", error);
                                                setIsLoggingOut(false);
                                            }
                                        }}
                                    >
                                        {isLoggingOut ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <LogOut className="h-4 w-4" />
                                        )}
                                        {isLoggingOut ? "Signing out..." : "Sign Out"}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="flex-1" />

                        {/* Header Actions */}
                        <div className="flex items-center gap-2">
                            <ThemeToggle />

                            {/* Notifications Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </Badge>
                                        )}
                                        <span className="sr-only">Notifications</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        Notifications
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-cyan-600 hover:underline font-normal"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-stone-500">
                                            No notifications
                                        </div>
                                    ) : (
                                        <ScrollArea className="max-h-[400px]">
                                            {notifications.map((notif) => (
                                                <DropdownMenuItem
                                                    key={notif.id}
                                                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notif.is_read ? "bg-stone-50 dark:bg-stone-900" : ""
                                                        }`}
                                                    onClick={() => {
                                                        markAsRead(notif.id);
                                                        if (notif.type === "message") {
                                                            window.location.href = "/user/messages";
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between w-full">
                                                        <span className="font-medium text-sm">{notif.title}</span>
                                                        {!notif.is_read && (
                                                            <span className="h-2 w-2 rounded-full bg-cyan-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-stone-400">
                                                        {formatTimeAgo(notif.created_at)}
                                                    </p>
                                                </DropdownMenuItem>
                                            ))}
                                        </ScrollArea>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/user/messages" className="w-full text-center text-sm text-cyan-600">
                                            View all messages
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="hidden lg:block">
                                {mounted && <UserButton afterSignOutUrl="/" appearance={{ elements: { activeDeviceList: "hidden", activeDevices: "hidden", activeDeviceItem: "hidden" } }} />}
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
                        <div className="container mx-auto p-4 lg:p-6">
                            <KYCGuard>
                                {children}
                            </KYCGuard>
                        </div>
                    </main>

                    {/* Mobile Bottom Navigation */}
                    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/80 backdrop-blur-lg dark:border-stone-800 dark:bg-stone-950/80 lg:hidden">
                        <div className="flex items-end justify-around py-2">
                            {USER_NAV_ITEMS.slice(0, 5).map((item, index) => {
                                const Icon = iconMap[item.icon];
                                const isActive = pathname === item.href;
                                const isCenter = index === 2; // Dashboard is at index 2

                                if (isCenter) {
                                    // Center Dashboard button - elevated and larger
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="flex flex-col items-center -mt-4"
                                        >
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${isActive
                                                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 scale-110"
                                                : "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                                                }`}>
                                                {Icon && <Icon className="h-6 w-6" />}
                                            </div>
                                            <span className={`text-xs mt-1 ${isActive
                                                ? "text-stone-900 dark:text-stone-100 font-medium"
                                                : "text-stone-500 dark:text-stone-400"
                                                }`}>
                                                {item.name}
                                            </span>
                                        </Link>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex flex-col items-center gap-1 px-3 py-2 ${isActive
                                            ? "text-stone-900 dark:text-stone-100"
                                            : "text-stone-500 dark:text-stone-400"
                                            }`}
                                    >
                                        {Icon && <Icon className="h-5 w-5" />}
                                        <span className="text-xs">{item.name.split(" ")[0]}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </div>
        </SuspensionGuard>
    );
}
