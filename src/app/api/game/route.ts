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
        const { amount, topic, type, targetLanguage, prompt } = quizCreationSchema.parse(body);

        console.log("Creating game with:", { amount, topic, type, targetLanguage, prompt });

        // First, generate questions outside the transaction
        const questionsUrl = process.env.API_URL ? `${process.env.API_URL}/api/questions` : '/api/questions';
        console.log("Fetching questions from:", questionsUrl);

        const { data } = await axios.post(questionsUrl, {
            amount,
            topic,
            type,
            targetLanguage,
            prompt,
        });

        console.log("Questions API response:", data);

        if (!data?.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid question format received');
        }

        // Then use transaction only for database operations with increased timeout
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
        }, {
            timeout: 10000 // Set timeout to 10 seconds
        });

        if (!game?.id) {
            throw new Error("Failed to create game - no game ID returned");
        }

        return NextResponse.json({
            gameId: game.id
        });

    } catch (error) {
        console.log("Game creation failed:", error instanceof Error ? error.message : 'Something went wrong');

        return NextResponse.json(
            { 
                error: error instanceof ZodError 
                    ? "Invalid request data" 
                    : (error instanceof Error ? error.message : 'Something went wrong')
            },
            { 
                status: error instanceof ZodError ? 400 : 500 
            }
        );
    }
}