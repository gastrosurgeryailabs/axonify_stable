import QuizCreation from '@/components/QuizCreation';
import { getAuthSession } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import React from 'react'

interface SearchParams {
    topic?: string;
}

interface Props {
    searchParams: SearchParams;
}

export const metadata = {
    title: "Quiz Page",
};

const QuizPage = async ({ searchParams }: Props) => {
    const session = await getAuthSession();
    if (!session?.user) {
        return redirect('/');
    }

    // Ensure searchParams is handled safely
    const topic = (searchParams?.topic as string) || '';
    
    return <QuizCreation topicParam={topic} />;
};

export default QuizPage;