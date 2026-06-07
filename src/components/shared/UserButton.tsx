"use client";

import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface UserButtonProps {
    afterSignOutUrl?: string;
    appearance?: any;
}

export function UserButton({ afterSignOutUrl = "/", appearance }: UserButtonProps) {
    const { user, signOut } = useAuth();

    if (!user) return null;

    const initials = (
        (user.firstName?.[0] || "") + (user.lastName?.[0] || "")
    ).toUpperCase() || "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} alt={user.firstName} />
                        <AvatarFallback className="bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100 font-medium text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.primaryEmailAddress?.emailAddress}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/user/settings" className="cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600 dark:text-red-400 cursor-pointer flex items-center"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
