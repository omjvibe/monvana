"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, Send, MessageCircle, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Message {
    id: string;
    content: string;
    sender_type: "user" | "admin" | "system";
    is_read: boolean;
    created_at: string;
}

export default function MessagesPage() {
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user: clerkUser, isLoaded } = useUser();

    useEffect(() => {
        async function fetchData() {
            if (!clerkUser?.id) return;

            try {
                const { data: userData } = await supabase
                    .from("users")
                    .select("id")
                    .eq("clerk_id", clerkUser.id)
                    .single();

                if (userData) {
                    setUserId(userData.id);

                    const { data: messageData } = await supabase
                        .from("messages")
                        .select("*")
                        .eq("user_id", userData.id)
                        .order("created_at", { ascending: true });

                    setMessages(messageData || []);

                    // Mark unread messages as read
                    await supabase
                        .from("messages")
                        .update({ is_read: true, read_at: new Date().toISOString() })
                        .eq("user_id", userData.id)
                        .eq("is_read", false)
                        .neq("sender_type", "user");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (isLoaded && clerkUser) {
            fetchData();
        }
    }, [clerkUser, isLoaded]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!userId || !newMessage.trim()) return;

        const messageContent = newMessage.trim();
        setNewMessage("");
        setSending(true);

        // Optimistically add the message
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content: messageContent,
            sender_type: "user",
            is_read: true,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMessage]);

        try {
            const { data, error } = await supabase
                .from("messages")
                .insert({
                    user_id: userId,
                    content: messageContent,
                    sender_type: "user",
                    sender_id: userId,
                })
                .select()
                .single();

            if (error) throw error;

            // Replace temp message with real one
            setMessages((prev) =>
                prev.map((m) => (m.id === tempMessage.id ? data : m))
            );
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
            // Remove optimistic message on error
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
            setNewMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-180px)] max-h-[700px]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full"
            >
                <Card className="flex h-full flex-col">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Support Chat
                        </CardTitle>
                        <CardDescription>
                            Chat with our support team
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            {messages.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <MessageCircle className="h-12 w-12 text-stone-300" />
                                    <h3 className="mt-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                                        No messages yet
                                    </h3>
                                    <p className="mt-2 text-stone-500">
                                        Start a conversation with our support team
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message, index) => {
                                        const isUser = message.sender_type === "user";
                                        const showDate =
                                            index === 0 ||
                                            formatDate(message.created_at) !==
                                            formatDate(messages[index - 1].created_at);

                                        return (
                                            <div key={message.id}>
                                                {showDate && (
                                                    <div className="my-4 flex justify-center">
                                                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500 dark:bg-stone-800">
                                                            {formatDate(message.created_at)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div
                                                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`flex max-w-[80%] items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
                                                    >
                                                        <div
                                                            className={`flex h-8 w-8 items-center justify-center rounded-full ${isUser
                                                                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                                                                : "bg-blue-500 text-white"
                                                                }`}
                                                        >
                                                            {isUser ? (
                                                                <User className="h-4 w-4" />
                                                            ) : (
                                                                <Bot className="h-4 w-4" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div
                                                                className={`rounded-2xl px-4 py-2 ${isUser
                                                                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                                                                    : "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                                                                    }`}
                                                            >
                                                                <p className="text-sm whitespace-pre-wrap">
                                                                    {message.content}
                                                                </p>
                                                            </div>
                                                            <p
                                                                className={`mt-1 text-xs text-stone-400 ${isUser ? "text-right" : ""}`}
                                                            >
                                                                {formatTime(message.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input */}
                        <div className="border-t p-4">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <Button type="submit" disabled={sending || !newMessage.trim()}>
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
