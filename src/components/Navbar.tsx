import { getAuthSession } from "@/lib/nextauth";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import SignInButton from "./SignInButton";
import UserAccountNav from "./UserAccountNav";
import { ThemeToggle } from "./ThemeToggle";

type Props = {};

const Navbar= async (props: Props) => {
  const session = await getAuthSession();
  return (
    <div className='fixed inset-x-0 top-0 bg-white dark:bg-gray-950 z-[10] h-fit border-b border-zinc-300 py-2'>
      <div className='flex items-center justify-between h-full gap-2 px-8 mx-auto max-w-7xl'>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="AxonCare Logo"
            width={52}
            height={42}
            className="w-22 h-10"
          />
          <div className="flex flex-col">
            <p className='text-2xl font-bold tracking-wide text-blue-900 dark:text-blue-700'>
              AxonCare
            </p>
            <p className="text-[10px] tracking-[0.2em] text-gray-500 dark:text-gray-400 font-light -mt-0.5">
              Your Health Guardians
            </p>
          </div>
        </Link>
        <div className="flex items-center">
        <ThemeToggle className="mr-4"/>
        <div className="flex item-center">
          {session?.user ? (
            <UserAccountNav user={session.user}/>
          ) : (
            <SignInButton text="Sign In" />
          )}
          </div>
        </div>
        </div>
    </div>
  );
}

export default Navbar;