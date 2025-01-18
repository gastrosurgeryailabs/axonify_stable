"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { BrainCircuit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Props = {}

const ADMIN_EMAILS = ['abhaychopada@gmail.com', 'dnyanesh.tech001@gmail.com'];

const QuizMeCard = (props: Props) => {
    const router = useRouter();
    const { data: session } = useSession();
    
    // If user is not an admin, don't render the card
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
        return null;
    }

    return (
        <Card className='hover:cursor-pointer hover:opacity-75' onClick={() => {
            router.push('/quiz');
        }}>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='text-2xl font-bold'>Quiz Me!</CardTitle>
                <BrainCircuit size={28} strokeWidth={2.5}/>
            </CardHeader>
            <CardContent>
                <p className='text-sm text-muted-foreground'>
                    Challenge yourself with a quiz!
                </p>
            </CardContent>
        </Card>
    )
}

export default QuizMeCard;