import QuizCreation from '@/components/QuizCreation';
import { getAuthSession } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import React from 'react'

const ADMIN_EMAILS = ['abhaychopada@gmail.com', 'dnyanesh.tech001@gmail.com'];

interface Props {
    searchParams: Promise<{
        topic?: string;
    }>;
}

export const metadata = {
    title: "Quiz Page",
};

const QuizPage = async ({ searchParams }: Props) => {
    const session = await getAuthSession();
    if (!session?.user) {
        return redirect('/');
    }

    // Check if user is admin
    if (!session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
        return redirect('/dashboard');
    }

    // Await searchParams
    const params = await searchParams;
    const topic = typeof params?.topic === 'string' ? params.topic : '';
    
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <QuizCreation topicParam={topic} />
        </div>
    );
};

export default QuizPage;