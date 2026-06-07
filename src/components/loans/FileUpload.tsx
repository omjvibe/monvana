"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Image, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileUploadProps {
    label: string;
    documentType: string;
    accept?: string;
    maxSize?: number; // in MB
    onUploadComplete?: (fileInfo: UploadedFile) => void;
    required?: boolean;
}

export interface UploadedFile {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    url: string;
    documentType: string;
}

export default function FileUpload({
    label,
    documentType,
    accept = "image/*,.pdf,.doc,.docx",
    maxSize = 10,
    onUploadComplete,
    required = false,
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`File is too large. Maximum size is ${maxSize}MB.`);
            return;
        }

        // Validate file type
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.some(type => file.type === type || file.type.startsWith("image/"))) {
            toast.error("Invalid file type. Please upload an image, PDF, or Word document.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("documentType", documentType);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to upload file");
            }

            const fileInfo: UploadedFile = {
                fileName: result.fileName,
                filePath: result.filePath,
                fileSize: result.fileSize,
                mimeType: result.mimeType,
                url: result.url,
                documentType: result.documentType,
            };

            setUploadedFile(fileInfo);
            onUploadComplete?.(fileInfo);
            toast.success("File uploaded successfully!");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return <Image className="h-8 w-8 text-blue-500" />;
        }
        return <FileText className="h-8 w-8 text-amber-500" />;
    };

    return (
        <div className="space-y-2">
            <label className={`text-sm font-medium ${required ? "required" : ""}`}>
                {label}
            </label>

            {uploadedFile ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    {getFileIcon(uploadedFile.mimeType)}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{uploadedFile.fileName}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.fileSize)}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={handleChange}
                        disabled={isUploading}
                    />
                    {isUploading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                    ) : (
                        <>
                            <Upload className={`h-8 w-8 mx-auto mb-2 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="text-sm text-muted-foreground">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG, PDF, or DOC (max {maxSize}MB)
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
