import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        

        if (!userId || !authUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from database
        const { data: dbUser, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", userId)
            .single();

        if (userError || !dbUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Parse form data
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const documentType = formData.get("documentType") as string || "document";
        const applicationId = formData.get("applicationId") as string;
        const bucket = formData.get("bucket") as string || "loan-documents";

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
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

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF, DOC, DOCX" },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            );
        }

        // Create unique filename
        const fileExt = file.name.split(".").pop();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${dbUser.id}/${documentType}/${timestamp}-${randomStr}.${fileExt}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage (using service role bypasses RLS)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);

            // If bucket doesn't exist, try to create it
            if (uploadError.message.includes("Bucket not found")) {
                // Create the bucket first
                const { error: bucketError } = await supabase.storage.createBucket(bucket, {
                    public: true,
                    allowedMimeTypes: allowedTypes,
                    fileSizeLimit: maxSize,
                });

                if (bucketError && !bucketError.message.includes("already exists")) {
                    console.error("Bucket creation error:", bucketError);
                    return NextResponse.json(
                        { error: "Storage not available. Please contact support." },
                        { status: 500 }
                    );
                }

                // Retry upload
                const { data: retryData, error: retryError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, buffer, {
                        contentType: file.type,
                        upsert: false,
                    });

                if (retryError) {
                    console.error("Retry upload error:", retryError);
                    return NextResponse.json(
                        { error: "Failed to upload file" },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: "Failed to upload file" },
                    { status: 500 }
                );
            }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        // If there's an application ID, save the document reference
        if (applicationId) {
            try {
                await supabase.from("loan_documents").insert({
                    application_id: applicationId,
                    document_type: documentType,
                    file_name: file.name,
                    file_path: fileName,
                    file_size: file.size,
                    mime_type: file.type,
                });
            } catch (docError) {
                console.log("Could not save document reference, loan_documents table may not exist");
            }
        }

        return NextResponse.json({
            success: true,
            fileName: file.name,
            filePath: fileName,
            fileSize: file.size,
            mimeType: file.type,
            url: urlData.publicUrl,
            documentType,
        });

    } catch (error) {
        console.error("File upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}

// Get list of uploaded documents for a user
export async function GET(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from database
        const { data: dbUser } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", userId)
            .single();

        if (!dbUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // List files in user's folder
        const { data: files, error } = await supabase.storage
            .from("loan-documents")
            .list(dbUser.id, {
                sortBy: { column: "created_at", order: "desc" },
            });

        if (error) {
            console.error("Error listing files:", error);
            return NextResponse.json({ files: [] });
        }

        return NextResponse.json({ files: files || [] });

    } catch (error) {
        console.error("Error fetching files:", error);
        return NextResponse.json(
            { error: "Failed to fetch files" },
            { status: 500 }
        );
    }
}
