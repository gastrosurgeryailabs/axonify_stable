import React from 'react'
import { User } from 'next-auth';
import { Avatar, AvatarFallback } from './ui/avatar';
import Image from 'next/image';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

type Props = {
    user: Pick<User, "name" | "image" | "email">;
}

const getUserInitials = (name?: string | null) => {
    if (!name) return '';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const UserAvatar = ({user}: Props) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                    {user.image ? (
                        <div className='relative w-full h-full aspect-square'>
                            <Image 
                                fill 
                                src={user.image} 
                                alt="profile image" 
                                referrerPolicy='no-referrer'
                                className="object-cover"
                                sizes="(max-width: 40px) 100vw, 40px"
                            />
                        </div>
                    ) : (
                        <AvatarFallback className="bg-secondary dark:bg-secondary-foreground">
                            <span className="text-secondary-foreground dark:text-secondary">
                                {getUserInitials(user?.name)}
                            </span>
                        </AvatarFallback>
                    )}
                </Avatar>
                
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[200px]">
                <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium text-foreground/80 dark:text-foreground/80">
                        {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                    </p>
                </div>
                <DropdownMenuItem 
                    className="text-sm font-semibold text-primary dark:text-white/90 tracking-tight hover:text-primary/80 dark:hover:text-white/80"
                    onClick={() => window.location.href = '/'}
                >
                    AxonCare
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="text-red-600 dark:text-red-400 cursor-pointer mt-1 flex items-center gap-2"
                    onClick={() => signOut()}
                >
                    <span>Sign Out</span>
                    <LogOut className="h-4 w-4" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserAvatar;