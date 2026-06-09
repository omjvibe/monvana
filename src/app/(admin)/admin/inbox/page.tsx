"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Search,
    Mail,
    Inbox,
    Send,
    Trash2,
    Archive,
    Reply,
    MoreVertical,
    Star,
    RefreshCw,
    User,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Paperclip,
    ExternalLink,
    Download,
    FileText,
    Image as ImageIcon,
    Clock,
    X,
    Maximize2,
    Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface AdminEmail {
    id: string;
    resend_id: string;
    from_email: string;
    to_email: string;
    subject: string;
    content_html: string;
    content_text: string;
    type: "inbound" | "outbound";
    status: string;
    is_read: boolean;
    created_at: string;
    attachments: any[];
    is_favorite: boolean;
    user_id?: string;
    user?: {
        first_name: string;
        last_name: string;
    };
}

function getAttachmentIcon(type: string) {
    if (type?.includes('image')) return <ImageIcon className="h-4 w-4" />;
    if (type?.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <Paperclip className="h-4 w-4" />;
}

function formatFileSize(bytes: number) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPreviewText(email: AdminEmail): string {
    if (email.content_text && email.content_text.trim()) return email.content_text.substring(0, 120);
    if (email.content_html && email.content_html.trim()) {
        return email.content_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 120);
    }
    return "No preview available";
}

export default function AdminInboxPage() {
    const [loading, setLoading] = useState(true);
    const [emails, setEmails] = useState<AdminEmail[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<AdminEmail | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "inbound" | "outbound">("all");
    const [composeOpen, setComposeOpen] = useState(false);
    const [viewerExpanded, setViewerExpanded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Compose Form
    const [composeData, setComposeData] = useState({
        to: "",
        subject: "",
        content: ""
    });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/emails');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setEmails(data || []);
        } catch (error) {
            console.error("Error fetching emails:", error);
            toast.error("Failed to load emails");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (emailId: string) => {
        try {
            await fetch(`/api/admin/emails/${emailId}/read`, { method: 'POST' });
            setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: true } : e));
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const handleEmailClick = (email: AdminEmail) => {
        setSelectedEmail(email);
        if (!email.is_read) {
            markAsRead(email.id);
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeData.to || !composeData.subject || !composeData.content) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSending(true);
        try {
            // If the content contains HTML tags, use it directly, otherwise format as plain text paragraphs
            const isHtml = /<[a-z][\s\S]*>/i.test(composeData.content);
            const formattedHtml = isHtml
                ? composeData.content
                : composeData.content
                    .split('\n\n')
                    .map(p => `<p style="margin-bottom: 1.25em;">${p.replace(/\n/g, '<br />')}</p>`)
                    .join('');

            const response = await fetch("/api/admin/emails/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: composeData.to,
                    subject: composeData.subject,
                    html: formattedHtml,
                    text: composeData.content,
                }),
            });

            if (!response.ok) throw new Error("Failed to send");

            toast.success("Email sent successfully");
            setComposeOpen(false);
            setComposeData({ to: "", subject: "", content: "" });
            fetchEmails();
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send email");
        } finally {
            setIsSending(false);
        }
    };

    const toggleFavorite = async (emailId: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/emails/${emailId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_favorite: !currentStatus }),
            });

            if (!response.ok) throw new Error('Failed to update');

            setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_favorite: !currentStatus } : e));
            if (selectedEmail?.id === emailId) {
                setSelectedEmail({ ...selectedEmail, is_favorite: !currentStatus });
            }
            toast.success(currentStatus ? "Removed from favorites" : "Added to favorites");
        } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error("Failed to update favorite status");
        }
    };

    const deleteEmail = async (emailId: string) => {
        if (!confirm("Are you sure you want to delete this email?")) return;

        try {
            const response = await fetch(`/api/admin/emails/${emailId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete');

            setEmails(prev => prev.filter(e => e.id !== emailId));
            if (selectedEmail?.id === emailId) {
                setSelectedEmail(null);
            }
            toast.success("Email deleted successfully");
        } catch (error) {
            console.error("Error deleting email:", error);
            toast.error("Failed to delete email");
        }
    };

    // Render HTML email content safely in an iframe for proper isolation
    const renderHtmlInIframe = (html: string) => {
        const styledHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { box-sizing: border-box; }
                    html, body {
                        margin: 0;
                        padding: 16px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #1c1917;
                        background: #ffffff;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                    }
                    img { max-width: 100%; height: auto; }
                    table { max-width: 100% !important; width: auto !important; }
                    td, th { word-wrap: break-word; }
                    a { color: #2563eb; }
                    pre, code { white-space: pre-wrap; word-wrap: break-word; max-width: 100%; overflow-x: auto; }
                    blockquote {
                        margin: 8px 0;
                        padding: 8px 16px;
                        border-left: 3px solid #d6d3d1;
                        color: #57534e;
                    }
                    /* Force all nested tables/divs to not overflow */
                    div, table, tr, td, th, p, span {
                        max-width: 100% !important;
                    }
                </style>
            </head>
            <body>${html}</body>
            </html>
        `;
        return styledHtml;
    };

    const filteredEmails = emails.filter(email => {
        const matchesSearch =
            email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.from_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.to_email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filter === "all" || email.type === filter;

        return matchesSearch && matchesFilter;
    });

    const unreadCount = emails.filter(e => !e.is_read && e.type === "inbound").length;
    const inboundCount = emails.filter(e => e.type === "inbound").length;
    const outboundCount = emails.filter(e => e.type === "outbound").length;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 italic">Monvana Bank Inbox</h1>
                    <p className="text-sm text-stone-500">Manage premium client communications</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchEmails}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => setComposeOpen(true)} className="bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900">
                        <Send className="h-4 w-4 mr-2" />
                        Compose
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
                {/* Sidebar Filter */}
                <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
                    <Card className="flex-1 bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 shadow-sm">
                        <CardContent className="p-2 pt-4">
                            <div className="space-y-1">
                                <Button
                                    variant={filter === "all" ? "secondary" : "ghost"}
                                    className="w-full justify-start text-stone-700 dark:text-stone-300"
                                    onClick={() => setFilter("all")}
                                >
                                    <Inbox className="h-4 w-4 mr-3" />
                                    All Mail
                                    <Badge variant="secondary" className="ml-auto bg-stone-100 dark:bg-stone-800">{emails.length}</Badge>
                                </Button>
                                <Button
                                    variant={filter === "inbound" ? "secondary" : "ghost"}
                                    className="w-full justify-start text-stone-700 dark:text-stone-300"
                                    onClick={() => setFilter("inbound")}
                                >
                                    <Mail className="h-4 w-4 mr-3" />
                                    Inbound
                                    <Badge variant={unreadCount > 0 ? "destructive" : "secondary"} className="ml-auto">{inboundCount}</Badge>
                                </Button>
                                <Button
                                    variant={filter === "outbound" ? "secondary" : "ghost"}
                                    className="w-full justify-start text-stone-700 dark:text-stone-300"
                                    onClick={() => setFilter("outbound")}
                                >
                                    <Send className="h-4 w-4 mr-3" />
                                    Outbound
                                    <Badge variant="secondary" className="ml-auto bg-stone-100 dark:bg-stone-800">{outboundCount}</Badge>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Email List */}
                <div className="lg:col-span-4 h-full min-h-0">
                    <Card className="h-full flex flex-col bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 shadow-sm">
                        <CardHeader className="p-4 pb-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <Input
                                    placeholder="Search inbox..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-800"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 min-h-0">
                            <ScrollArea className="h-full mt-4">
                                <div className="divide-y divide-stone-100 dark:divide-stone-900">
                                    {filteredEmails.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                                            <Inbox className="h-10 w-10 mb-2 opacity-20" />
                                            <p className="text-sm">No emails found</p>
                                        </div>
                                    ) : (
                                        filteredEmails.map((email) => (
                                            <button
                                                key={email.id}
                                                onClick={() => handleEmailClick(email)}
                                                className={`w-full p-4 text-left transition-colors border-l-2 ${selectedEmail?.id === email.id
                                                    ? "bg-stone-50 dark:bg-stone-900 border-l-stone-900 dark:border-l-stone-100"
                                                    : "hover:bg-stone-50/50 dark:hover:bg-stone-900/50 border-l-transparent"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                        {!email.is_read && email.type === "inbound" && (
                                                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                                        )}
                                                        <span className={`text-sm truncate ${!email.is_read && email.type === "inbound"
                                                            ? "font-bold text-stone-900 dark:text-stone-100"
                                                            : "font-medium text-stone-600 dark:text-stone-400"
                                                            }`}>
                                                            {email.type === "inbound" ? email.from_email : `To: ${email.to_email}`}
                                                        </span>
                                                        {email.is_favorite && <Star className="h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-400" />}
                                                    </div>
                                                    <span className="text-[10px] text-stone-400 ml-2 flex-shrink-0 mt-0.5">
                                                        {format(new Date(email.created_at), "MMM d")}
                                                    </span>
                                                </div>
                                                <div className={`text-xs truncate mb-1 ${!email.is_read && email.type === "inbound" ? "font-semibold text-stone-800 dark:text-stone-200" : "text-stone-700 dark:text-stone-300"}`}>
                                                    {email.subject || "(No Subject)"}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs text-stone-400 line-clamp-1 flex-1">
                                                        {getPreviewText(email)}
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                        {email.attachments && email.attachments.length > 0 && (
                                                            <Paperclip className="h-3 w-3 text-stone-400" />
                                                        )}
                                                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-stone-200 dark:border-stone-700">
                                                            {email.type === "inbound" ? "IN" : "OUT"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Email Viewer */}
                <div className="lg:col-span-6 h-full min-h-0">
                    <Card className="h-full flex flex-col bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 shadow-sm relative">
                        {selectedEmail ? (
                            <>
                                {/* Email Header */}
                                <div className="p-5 border-b border-stone-100 dark:border-stone-900 flex-shrink-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 leading-tight mb-2">
                                                {selectedEmail.subject || "(No Subject)"}
                                            </h2>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] uppercase tracking-widest ${selectedEmail.type === "inbound"
                                                        ? "border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                                                        : "border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950"
                                                        }`}
                                                >
                                                    {selectedEmail.type}
                                                </Badge>
                                                <div className="text-sm text-stone-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(selectedEmail.created_at), "MMM d, yyyy 'at' h:mm a")}
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-0.5">
                                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                                    <span className="font-medium text-stone-500 dark:text-stone-500 w-12 inline-block">From:</span>
                                                    <span className="font-medium text-stone-800 dark:text-stone-200">{selectedEmail.from_email}</span>
                                                    {selectedEmail.user && (
                                                        <span className="ml-2 text-xs text-stone-400">
                                                            ({selectedEmail.user.first_name} {selectedEmail.user.last_name})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                                    <span className="font-medium text-stone-500 dark:text-stone-500 w-12 inline-block">To:</span>
                                                    <span className="text-stone-700 dark:text-stone-300">{selectedEmail.to_email}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${selectedEmail.is_favorite ? "text-amber-400" : "text-stone-400"}`}
                                                onClick={() => toggleFavorite(selectedEmail.id, selectedEmail.is_favorite)}
                                                title={selectedEmail.is_favorite ? "Remove from favorites" : "Add to favorites"}
                                            >
                                                <Star className={`h-4 w-4 ${selectedEmail.is_favorite ? "fill-current" : ""}`} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-stone-400"
                                                onClick={() => {
                                                    setComposeData({
                                                        to: selectedEmail.from_email,
                                                        subject: `Re: ${selectedEmail.subject}`,
                                                        content: `\n\n--- Original Message ---\nFrom: ${selectedEmail.from_email}\nSent: ${format(new Date(selectedEmail.created_at), "MMM d, yyyy h:mm a")}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.content_text || ''}`
                                                    });
                                                    setComposeOpen(true);
                                                }}
                                                title="Reply"
                                            >
                                                <Reply className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-stone-400 hover:text-red-600"
                                                onClick={() => deleteEmail(selectedEmail.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Body */}
                                <div className="flex-1 min-h-0 overflow-hidden">
                                    <ScrollArea className="h-full">
                                        <div className="p-5">
                                            {/* HTML Content — rendered in an iframe for full fidelity */}
                                            {selectedEmail.content_html && selectedEmail.content_html.trim() ? (
                                                <div className="w-full">
                                                    <iframe
                                                        ref={iframeRef}
                                                        srcDoc={renderHtmlInIframe(selectedEmail.content_html)}
                                                        className="w-full border border-stone-100 dark:border-stone-800 rounded-lg bg-white"
                                                        style={{ minHeight: '300px', height: '500px' }}
                                                        sandbox="allow-same-origin"
                                                        title="Email content"
                                                        onLoad={() => {
                                                            // Auto-resize iframe to fit content
                                                            if (iframeRef.current) {
                                                                try {
                                                                    const doc = iframeRef.current.contentDocument;
                                                                    if (doc) {
                                                                        const height = doc.documentElement.scrollHeight;
                                                                        iframeRef.current.style.height = Math.min(Math.max(height + 40, 200), 800) + 'px';
                                                                    }
                                                                } catch (e) {
                                                                    // Cross-origin issues, keep default height
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ) : selectedEmail.content_text && selectedEmail.content_text.trim() ? (
                                                <div className="bg-stone-50 dark:bg-stone-900 rounded-lg p-6 border border-stone-100 dark:border-stone-800">
                                                    <pre className="whitespace-pre-wrap font-sans text-sm text-stone-800 dark:text-stone-200 leading-relaxed break-words">
                                                        {selectedEmail.content_text}
                                                    </pre>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                                                    <Mail className="h-10 w-10 mb-3 opacity-20" />
                                                    <p className="text-sm font-medium text-stone-500">No content available</p>
                                                    <p className="text-xs text-stone-400 mt-1">This email has no visible body content</p>
                                                </div>
                                            )}

                                            {/* Attachments Section */}
                                            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                                <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-900">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                                                        <Paperclip className="h-3 w-3" />
                                                        Attachments ({selectedEmail.attachments.length})
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {selectedEmail.attachments.map((attachment: any, idx: number) => (
                                                            <a
                                                                key={idx}
                                                                href={attachment.url || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`flex items-center p-3 rounded-lg border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group ${!attachment.url ? 'opacity-50 pointer-events-none' : ''}`}
                                                            >
                                                                <div className="h-9 w-9 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center mr-3 group-hover:bg-white dark:group-hover:bg-stone-700 transition-colors text-stone-500">
                                                                    {getAttachmentIcon(attachment.type)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">
                                                                        {attachment.name || 'Untitled'}
                                                                    </div>
                                                                    <div className="text-[10px] text-stone-400">
                                                                        {formatFileSize(attachment.size)} {attachment.type ? `• ${attachment.type.split('/')[1] || attachment.type}` : ''}
                                                                    </div>
                                                                </div>
                                                                {attachment.url && (
                                                                    <Download className="h-4 w-4 text-stone-300 group-hover:text-stone-600 dark:group-hover:text-stone-400 flex-shrink-0 ml-2" />
                                                                )}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Quick Reply Bar */}
                                <div className="p-3 border-t border-stone-100 dark:border-stone-900 flex-shrink-0">
                                    <Button
                                        variant="outline"
                                        className="w-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 border-stone-100 dark:border-stone-800"
                                        onClick={() => {
                                            setComposeData({
                                                to: selectedEmail.type === "inbound" ? selectedEmail.from_email : selectedEmail.to_email,
                                                subject: `Re: ${selectedEmail.subject}`,
                                                content: ""
                                            });
                                            setComposeOpen(true);
                                        }}
                                    >
                                        <Reply className="h-4 w-4 mr-2" />
                                        Quick Reply
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-stone-400 p-12 text-center">
                                <Mail className="h-16 w-16 mb-4 opacity-10" />
                                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 italic">No Message Selected</h3>
                                <p className="text-sm dark:text-stone-500 max-w-xs mt-2 font-light">
                                    Select a message from the list to view its contents and initiate strategic communication.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {composeOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-stone-100 dark:border-stone-900 flex justify-between items-center">
                                <h3 className="text-xl italic text-stone-900 dark:text-stone-100">Draft New Message</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex bg-stone-100 dark:bg-stone-900 rounded-lg p-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setComposeData({
                                                ...composeData,
                                                subject: "Investment Advisory: Strategic Position Alert",
                                                content: "Our wealth management team has identified a particularly advantageous positioning... \n\n[Details Here]"
                                            })}
                                            className="text-[10px] uppercase tracking-tighter h-7 px-2"
                                        >
                                            Investment
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setComposeData({
                                                ...composeData,
                                                subject: "Security Alert: New Device Authentication",
                                                content: "A new security protocol has been initiated on your account... \n\n[Action Details]"
                                            })}
                                            className="text-[10px] uppercase tracking-tighter h-7 px-2"
                                        >
                                            Security
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setComposeOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <form onSubmit={handleSendEmail} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-12 text-xs font-bold uppercase tracking-widest text-stone-400">To:</span>
                                        <Input
                                            value={composeData.to}
                                            onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                            className="border-none shadow-none bg-stone-50 dark:bg-stone-900 h-10 px-4"
                                            placeholder="recipient@example.com"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="w-12 text-xs font-bold uppercase tracking-widest text-stone-400">Sub:</span>
                                        <Input
                                            value={composeData.subject}
                                            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                            className="border-none shadow-none bg-stone-50 dark:bg-stone-900 h-10 px-4 font-semibold"
                                            placeholder="Executive Summary"
                                        />
                                    </div>
                                </div>
                                <Separator className="bg-stone-100 dark:bg-stone-900" />
                                <div className="min-h-[300px]">
                                    <textarea
                                        value={composeData.content}
                                        onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                                        className="w-full h-full min-h-[300px] bg-transparent resize-none border-none focus:ring-0 text-stone-800 dark:text-stone-200 font-light leading-relaxed outline-none"
                                        placeholder="Compose your premium strategic communication..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <p className="mr-auto text-[10px] text-stone-400 self-center uppercase tracking-widest italic">Monvana Private Protocol</p>
                                    <Button type="button" variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isSending} className="bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900">
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                        Send Message
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
