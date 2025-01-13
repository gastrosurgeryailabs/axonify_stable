import SignInButton from '@/components/SignInButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthSession } from '@/lib/nextauth';
import Image from 'next/image';
import { redirect } from 'next/navigation';

interface Props {
    searchParams: {
        callbackUrl?: string;
    };
}

export default async function SignIn({ searchParams }: Props) {
    const session = await getAuthSession();
    if (session?.user) {
        return redirect(searchParams.callbackUrl || '/dashboard');
    }

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[500px]">
            <Card className="p-4">
                <CardHeader className="space-y-1">
                    <div className="flex flex-col items-center justify-center mb-4">
                        <Image
                            src="/logo.png"
                            alt="AxonCare Logo"
                            width={63}
                            height={50}
                            className="w-29 h-18"
                        />
                        <div className="flex flex-col items-center">
                            <p className='text-2xl font-bold tracking-wide text-[#0A2472] dark:text-[#1E40AF]'>
                                AxonCare
                            </p>
                            <p className="text-[10px] tracking-[0.2em] text-gray-500 dark:text-gray-400 font-light -mt-0.5">
                                Your Health Guardians
                            </p>
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Welcome to AxonCare</CardTitle>
                    <CardDescription className="text-center">
                        Sign in to access your quizzes and track your progress
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <SignInButton text="Sign in with Google" callbackUrl={searchParams.callbackUrl} />
                    <p className="mt-4 text-sm text-center text-muted-foreground">
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 