import OpenEnded from '@/components/OpenEnded';
import { prisma } from '@/lib/db';
import { getAuthSession } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import React from 'react'
import { Prisma } from '@prisma/client';

interface PageProps {
    params: {
        gameId: string;
    };
}

async function cloneGame(gameId: string, userId: string) {
    const originalGame = await prisma.game.findUnique({
        where: { id: gameId },
        include: { questions: true }
    });

    if (!originalGame) return null;

    // Use a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
        const clonedGame = await tx.game.create({
            data: {
                topic: originalGame.topic,
                gameType: originalGame.gameType,
                timeStarted: new Date(),
                userId: userId,
                completionMessage: originalGame.completionMessage
            }
        });

        const questionData = originalGame.questions.map(q => ({
            question: q.question,
            answer: q.answer,
            options: q.options as Prisma.InputJsonValue,
            gameId: clonedGame.id,
            questionType: originalGame.gameType
        }));

        await tx.question.createMany({
            data: questionData
        });

        return clonedGame;
    });
}

const OpenEndedPage = async ({ params }: PageProps) => {
    const gameId = params.gameId;
    
    const session = await getAuthSession();
    if (!session?.user) {
        const callbackUrl = `/play/open-ended/${gameId}`;
        return redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    let game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { questions: true }
    });

    if (!game || game.gameType !== 'open_ended') {
        return redirect('/quiz');
    }

    // If this is not the user's game, create a new instance for them
    if (game.userId !== session.user.id) {
        const clonedGame = await cloneGame(gameId, session.user.id);
        if (!clonedGame) {
            return redirect('/quiz');
        }
        game = await prisma.game.findUnique({
            where: { id: clonedGame.id },
            include: { questions: true }
        });
        if (!game) {
            return redirect('/quiz');
        }
    }

    // Filter the game data for the OpenEnded component
    const filteredGame = {
        ...game,
        questions: game.questions.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
        }))
    };

    return <OpenEnded game={filteredGame} />;
};

export default OpenEndedPage;