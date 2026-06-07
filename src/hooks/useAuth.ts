import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function useAuth() {
    const [dbUser, setDbUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        async function getSession() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setDbUser(session?.user ?? null);
                    setIsLoaded(true);
                }
            } catch (error) {
                console.error("Error getting session in useAuth:", error);
                if (mounted) {
                    setIsLoaded(true);
                }
            }
        }

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setDbUser(session?.user ?? null);
                setIsLoaded(true);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    const userObj = dbUser ? {
        id: dbUser.id,
        emailAddresses: [{ emailAddress: dbUser.email || "" }],
        primaryEmailAddress: { emailAddress: dbUser.email || "" },
        firstName: dbUser.user_metadata?.first_name || dbUser.email?.split("@")[0] || "User",
        lastName: dbUser.user_metadata?.last_name || "",
        imageUrl: dbUser.user_metadata?.avatar_url || "/images/avatar-placeholder.png",
        publicMetadata: {
            role: dbUser.user_metadata?.role || "user"
        }
    } : null;

    return {
        user: userObj,
        isLoaded,
        signOut,
        isSignedIn: !!dbUser,
    };
}

export function useUser() {
    const authObj = useAuth();
    return {
        user: authObj.user,
        isLoaded: authObj.isLoaded,
        isSignedIn: authObj.isSignedIn,
    };
}

export function useClerk() {
    const authObj = useAuth();
    return {
        signOut: authObj.signOut,
    };
}
