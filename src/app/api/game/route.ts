import { getAuthSession } from "@/lib/nextauth";
import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import axios from "axios";

export async function POST(req: Request, res: Response) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be logged in" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { amount, topic, type } = quizCreationSchema.parse(body);

        console.log("Creating game with:", { amount, topic, type });

        // Use a transaction to ensure data consistency
        const game = await prisma.$transaction(async (tx) => {
            // Create the game
            const newGame = await tx.game.create({
                data: {
                    topic,
                    gameType: type,
                    timeStarted: new Date(),
                    userId: session.user.id,
                },
            });

            console.log("Game created:", newGame.id);

            // Update topic count
            await tx.topic_count.upsert({
                where: { topic },
                create: {
                    topic,
                    count: 1
                },
                update: {
                    count: {
                        increment: 1
                    }
                }
            });

            console.log("Topic count updated");

            // Generate questions
            const questionsUrl = `${process.env.API_URL}/api/questions`;
            console.log("Fetching questions from:", questionsUrl);

            const { data } = await axios.post(questionsUrl, {
                amount,
                topic,
                type,
            });

            console.log("Questions API response:", data);

            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Invalid question format received');
            }

            if (type === "mcq") {
                const manyData = data.questions.map((question: any) => {
                    const options = [
                        question.answer,
                        question.option1,
                        question.option2,
                        question.option3
                    ].sort(() => Math.random() - 0.5);

                    return {
                        question: question.question,
                        answer: question.answer,
                        options: JSON.stringify(options),
                        gameId: newGame.id,
                        questionType: type,
                    };
                });

                await tx.question.createMany({
                    data: manyData
                });
                console.log("MCQ questions created");
            } else if (type === 'open_ended') {
                const manyData = data.questions.map((question: any) => ({
                    question: question.question,
                    answer: question.answer,
                    gameId: newGame.id,
                    questionType: type,
                }));

                await tx.question.createMany({
                    data: manyData
                });
                console.log("Open-ended questions created");
            }

            return newGame;
        });

        return NextResponse.json({
            gameId: game.id,
        });

    } catch (error) {
        console.error("Game creation error:", error);
        
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 }
            );
        }

        // Check if it's a Prisma error
        if (error && typeof error === 'object' && 'code' in error) {
            const prismaError = error as { code?: string; message?: string };
            return NextResponse.json(
                { 
                    error: "Database error",
                    details: prismaError.message || "Unknown database error",
                    code: prismaError.code
                },
                { status: 500 }
            );
        }

        // Check if it's an Axios error
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { 
                    error: "Failed to generate questions",
                    details: error.response?.data || error.message
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                error: "Failed to create game",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}