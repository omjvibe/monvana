"use client";

import { useState, useEffect } from "react";
import {
    Bell, Check, CheckCheck, Loader2, Landmark, AlertCircle, Info,
    DollarSign, TrendingUp, Heart, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: "loan" | "transaction" | "system" | "admin" | "info" | "success" | "warning" | "error";
    is_read: boolean;
    created_at: string;
    users?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface NotificationsDropdownProps {
    isAdmin?: boolean;
}

export function NotificationsDropdown({ isAdmin = false }: NotificationsDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications");
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (notificationId?: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    notificationId
                        ? { notificationId }
                        : { markAllRead: true }
                ),
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking notifications as read:", error);
        }
    };

    const getIcon = (type: string) => {
        const iconClass = "h-5 w-5";
        switch (type) {
            case "loan":
                return <Landmark className={`${iconClass} text-blue-500`} />;
            case "transaction":
                return <DollarSign className={`${iconClass} text-green-500`} />;
            case "system":
            case "admin":
                return <AlertCircle className={`${iconClass} text-orange-500`} />;
            case "success":
                return <CheckCheck className={`${iconClass} text-green-600`} />;
            case "warning":
                return <AlertCircle className={`${iconClass} text-yellow-600`} />;
            case "error":
                return <X className={`${iconClass} text-red-600`} />;
            default:
                return <Info className={`${iconClass} text-cyan-500`} />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case "loan":
                return "bg-blue-100 dark:bg-blue-900/20";
            case "transaction":
                return "bg-green-100 dark:bg-green-900/20";
            case "system":
            case "admin":
                return "bg-orange-100 dark:bg-orange-900/20";
            case "success":
                return "bg-green-100 dark:bg-green-900/20";
            case "warning":
                return "bg-yellow-100 dark:bg-yellow-900/20";
            case "error":
                return "bg-red-100 dark:bg-red-900/20";
            default:
                return "bg-cyan-100 dark:bg-cyan-900/20";
        }
    };

    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return "Recently";
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                    <Bell className="h-5 w-5" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
                            >
                                <span className="text-[10px] font-bold text-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
                <div className="flex items-center justify-between px-2 py-2">
                    <DropdownMenuLabel className="p-0 font-semibold text-stone-900 dark:text-stone-100">
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600 dark:bg-red-900/20">
                                {unreadCount} new
                            </Badge>
                        )}
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                            onClick={() => markAsRead()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="h-16 w-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                            <Bell className="h-8 w-8 text-stone-400" />
                        </div>
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                            All caught up!
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
                            You have no new notifications
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-1 px-1 py-1">
                            <AnimatePresence>
                                {notifications.map((notif, index) => (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <DropdownMenuItem
                                            className={`cursor-pointer p-3 rounded-lg ${!notif.is_read
                                                    ? "bg-cyan-50 dark:bg-cyan-950/20 hover:bg-cyan-100 dark:hover:bg-cyan-950/30"
                                                    : "hover:bg-stone-50 dark:hover:bg-stone-800/50"
                                                }`}
                                            onClick={() => {
                                                if (!notif.is_read) {
                                                    markAsRead(notif.id);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-3 w-full">
                                                {/* Icon */}
                                                <div className={`${getIconBg(notif.type)} rounded-full p-2 shrink-0`}>
                                                    {getIcon(notif.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="font-medium text-sm text-stone-900 dark:text-stone-100 leading-tight">
                                                            {notif.title}
                                                        </p>
                                                        {!notif.is_read && (
                                                            <div className="h-2 w-2 rounded-full bg-cyan-500 shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[11px] text-stone-500 dark:text-stone-500 flex items-center gap-1">
                                                        {formatTime(notif.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </ScrollArea>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
