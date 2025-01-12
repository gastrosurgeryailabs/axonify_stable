import QuizCreation from '@/components/QuizCreation';
import { getAuthSession } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import React from 'react'

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