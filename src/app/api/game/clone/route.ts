import { getAuthSession } from "@/lib/nextauth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be logged in" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { gameId } = body;

        // Find the original game
        const originalGame = await prisma.game.findUnique({
            where: { id: gameId },
            include: {
                questions: true
            }
        });

        if (!originalGame) {
            return NextResponse.json(
                { error: "Game not found" },
                { status: 404 }
            );
        }

        // Create a new game with the same properties but new timestamps
        const newGame = await prisma.game.create({
            data: {
                topic: originalGame.topic,
                gameType: originalGame.gameType,
                timeStarted: new Date(),
                userId: session.user.id,
                completionMessage: originalGame.completionMessage
            }
        });

        // Clone the questions
        const questionData = originalGame.questions.map(q => ({
            question: q.question,
            answer: q.answer,
            options: q.options as Prisma.InputJsonValue,
            gameId: newGame.id,
            questionType: q.questionType
        }));

        await prisma.question.createMany({
            data: questionData
        });

        return NextResponse.json({
            gameId: newGame.id
        });

    } catch (error) {
        console.error("Error cloning game:", error);
        return NextResponse.json(
            { error: "Failed to clone game" },
            { status: 500 }
        );
    }
} 