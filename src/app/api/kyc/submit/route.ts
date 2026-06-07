import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getAdminSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("KYC ERROR: Missing Supabase configuration (URL or Service Key).");
        throw new Error("Missing Supabase configuration. Check environment variables.");
    }

    // Diagnostic logging (safe key prefix)
    console.log(`KYC: Initializing with Key Prefix: ${supabaseServiceKey.substring(0, 10)}... (Length: ${supabaseServiceKey.length})`);

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = getAdminSupabase();
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkId = authUser?.id;
        if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Parse multipart form data
        const formData = await request.formData();
        const idType = formData.get("idType") as string;
        const idNumber = formData.get("idNumber") as string;
        const idFront = formData.get("idFront") as File | null;
        const idBack = formData.get("idBack") as File | null;
        const selfie = formData.get("selfie") as File | null;
        const proofOfAddress = formData.get("proofOfAddress") as File | null;

        if (!idType || !idNumber || !idFront || !selfie) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Supabase User ID
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", clerkId)
            .single();

        if (!user || userError) {
            return NextResponse.json({ error: "User profile not found in database" }, { status: 404 });
        }

        // 2. Upload files server-side using service role (bypasses RLS)
        const uploadFile = async (file: File, folder: string): Promise<string> => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${clerkId}/${folder}-${Date.now()}.${fileExt}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabase.storage
                .from('kyc')
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: true,
                });

            if (uploadError) {
                console.error(`Upload error for ${folder}:`, uploadError);
                throw new Error(`Failed to upload ${folder}: ${uploadError.message}`);
            }

            return fileName;
        };

        const idFrontPath = await uploadFile(idFront, 'id-front');
        const selfiePath = await uploadFile(selfie, 'selfie');
        let idBackPath: string | null = null;
        if (idBack) {
            idBackPath = await uploadFile(idBack, 'id-back');
        }
        let addressPath: string | null = null;
        if (proofOfAddress) {
            addressPath = await uploadFile(proofOfAddress, 'address');
        }

        // 3. Insert KYC Submission
        const { data: submission, error: subError } = await supabase
            .from("kyc_submissions")
            .insert({
                user_id: user.id,
                id_type: idType,
                id_number: idNumber,
                id_front_url: idFrontPath,
                id_back_url: idBackPath,
                selfie_url: selfiePath,
                address_proof_url: addressPath,
                status: "pending"
            })
            .select()
            .single();

        if (subError) {
            console.error("KYC Submission error:", subError);
            return NextResponse.json({
                error: "Failed to store submission data",
                details: subError.message,
                hint: subError.hint,
                code: subError.code
            }, { status: 500 });
        }

        // 4. Update User KYC status to pending
        await supabase
            .from("users")
            .update({ kyc_status: "pending" })
            .eq("id", user.id);

        // 5. Create Audit Log (non-blocking)
        try {
            await supabase.from("audit_logs").insert({
                actor_id: user.id,
                action: "kyc_submitted",
                target_id: user.id,
                category: "user",
                details: {
                    message: `Identity verification submitted: ${idType} (${idNumber})`,
                    submission_id: submission.id
                }
            });
        } catch (auditErr) {
            console.error("Audit log error:", auditErr);
        }

        return NextResponse.json({ success: true, submissionId: submission.id });
    } catch (error: any) {
        console.error("KYC POST error:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: error.message,
        }, { status: 500 });
    }
}
