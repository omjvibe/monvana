"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    Loader2,
    Send,
    Search,
    User,
    MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface UserConversation {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    unreadCount: number;
    lastMessage?: string;
    lastMessageTime?: string;
}

interface Message {
    id: string;
    content: string;
    sender_type: "user" | "admin";
    created_at: string;
    is_read: boolean;
}

export default function AdminMessagesPage() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserConversation[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserConversation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserConversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchUsersWithMessages();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
            markMessagesAsRead(selectedUser.id);
        }
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = users.filter(u =>
                `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchUsersWithMessages = async () => {
        try {
            const { data: allUsers } = await supabase
                .from("users")
                .select("id, first_name, last_name, email")
                .order("created_at", { ascending: false });

            if (allUsers) {
                const usersWithStats = await Promise.all(
                    allUsers.map(async (user) => {
                        const { count: unreadCount } = await supabase
                            .from("messages")
                            .select("*", { count: "exact", head: true })
                            .eq("user_id", user.id)
                            .eq("sender_type", "user")
                            .eq("is_read", false);

                        const { data: lastMsg } = await supabase
                            .from("messages")
                            .select("content, created_at")
                            .eq("user_id", user.id)
                            .order("created_at", { ascending: false })
                            .limit(1)
                            .single();

                        return {
                            ...user,
                            unreadCount: unreadCount || 0,
                            lastMessage: lastMsg?.content,
                            lastMessageTime: lastMsg?.created_at,
                        };
                    })
                );

                usersWithStats.sort((a, b) => {
                    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
                    if (!a.lastMessageTime) return 1;
                    if (!b.lastMessageTime) return -1;
                    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
                });

                setUsers(usersWithStats);
                setFilteredUsers(usersWithStats);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });

            if (data) {
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const markMessagesAsRead = async (userId: string) => {
        try {
            await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("sender_type", "user");

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, unreadCount: 0 } : u
            ));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const sendMessage = async () => {
        if (!selectedUser || !newMessage.trim()) return;

        setSending(true);
        try {
            const { data: newMsg, error } = await supabase
                .from("messages")
                .insert({
                    user_id: selectedUser.id,
                    content: newMessage.trim(),
                    sender_type: "admin",
                    is_read: false,
                })
                .select()
                .single();

            if (error) throw error;

            setMessages(prev => [...prev, newMsg]);
            setNewMessage("");

            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id
                    ? { ...u, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at }
                    : u
            ));

            await supabase.from("notifications").insert({
                user_id: selectedUser.id,
                title: "New Message",
                message: "You have a new message from support",
                type: "message",
            });

            toast.success("Message sent");
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / 86400000);

        if (days === 0) {
            return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        } else if (days === 1) {
            return "Yesterday";
        } else if (days < 7) {
            return date.toLocaleDateString("en-US", { weekday: "short" });
        } else {
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Messages
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Communicate with users
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]"
            >
                {/* User List */}
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader className="pb-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-stone-500">
                                    No users found
                                </div>
                            ) : (
                                <div className="space-y-1 px-4 pb-4">
                                    {filteredUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${selectedUser?.id === user.id
                                                ? "bg-stone-100 dark:bg-stone-800"
                                                : "hover:bg-stone-50 dark:hover:bg-stone-800/50"
                                                }`}
                                        >
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-stone-500" />
                                                </div>
                                                {user.unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center">
                                                        {user.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    {user.lastMessageTime && (
                                                        <span className="text-xs text-stone-400">
                                                            {formatTime(user.lastMessageTime)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-stone-500 truncate">
                                                    {user.lastMessage || user.email}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2 flex flex-col">
                    {selectedUser ? (
                        <>
                            <CardHeader className="border-b dark:border-stone-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                                        <User className="h-5 w-5 text-stone-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            {selectedUser.first_name} {selectedUser.last_name}
                                        </CardTitle>
                                        <p className="text-sm text-stone-500">{selectedUser.email}</p>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea className="h-full p-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 text-stone-500">
                                            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No messages yet</p>
                                            <p className="text-sm">Start a conversation</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.sender_type === "admin"
                                                            ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                                                            : "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                                                            }`}
                                                    >
                                                        <p>{msg.content}</p>
                                                        <p className={`text-xs mt-1 ${msg.sender_type === "admin"
                                                            ? "text-stone-300 dark:text-stone-500"
                                                            : "text-stone-500"
                                                            }`}>
                                                            {formatTime(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>

                            <div className="p-4 border-t dark:border-stone-800">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                        disabled={sending}
                                    />
                                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <CardContent className="flex-1 flex items-center justify-center">
                            <div className="text-center text-stone-500">
                                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Select a conversation</p>
                                <p className="text-sm">Choose a user from the list to start messaging</p>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}
