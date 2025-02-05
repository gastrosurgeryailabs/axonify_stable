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
        const { amount, topic, type, targetLanguage, prompt, model, apiKey, completionMessage, serverUrl } = quizCreationSchema.parse(body);

        console.log("Game API received model:", model);
        console.log("Creating game with:", { amount, topic, type, targetLanguage, prompt, model });

            // Make request to AnythingLLM API for questions
            const apiUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
            const response = await fetch(`${apiUrl}/api/v1/openai/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: `You are a quiz generator. Return only a single JSON array without any additional text, markdown, or explanation. The response must be a single array containing all questions, like this exact format: [{"question": "First question", "options": ["A", "B", "C", "D"], "answer": "A"}, {"question": "Second question", "options": ["W", "X", "Y", "Z"], "answer": "Z"}]. For MCQ questions: each question needs "question" (string), "options" (array of exactly 4 strings), and "answer" (string matching one option). For open-ended: each needs "question" and "answer" (both strings).`
                        },
                        {
                            role: "user",
                            content: `Generate ${amount} ${type === 'mcq' ? 'multiple choice' : 'open ended'} questions about ${topic}.\n\nRequirements: ${prompt}`
                        }
                    ],
                    model,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`AnythingLLM API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data?.choices?.[0]?.message?.content) {
                throw new Error('Invalid response format from AnythingLLM');
            }

        const content = data.choices[0].message.content;
        console.log('Raw AI response:', content);

        // Parse and validate questions
        let parsedQuestions;
        try {
            // Find the JSON array in the response
            const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }

            // Clean up the JSON string
            const jsonStr = jsonMatch[0]
                .replace(/\n/g, '')  // Remove newlines
                .replace(/\s+/g, ' ') // Normalize spaces
                .replace(/,\s*]/g, ']'); // Remove trailing commas

            parsedQuestions = JSON.parse(jsonStr);

            // Ensure we have an array
            if (!Array.isArray(parsedQuestions)) {
                parsedQuestions = [parsedQuestions];
            }

            // Validate each question
            parsedQuestions = parsedQuestions.map((q: any, index: number) => {
                const questionNum = index + 1;
                
                // Basic structure validation
                if (!q.question || typeof q.question !== 'string') {
                    throw new Error(`Question ${questionNum} must have a valid question text`);
                }
                if (!q.answer || typeof q.answer !== 'string') {
                    throw new Error(`Question ${questionNum} must have a valid answer`);
                }

                // Trim the question
                q.question = q.question.trim();
                q.answer = q.answer.trim();

                if (type === 'mcq') {
                    if (!Array.isArray(q.options) || q.options.length !== 4) {
                        throw new Error(`Question ${questionNum} must have exactly 4 options`);
                    }

                    // Normalize options and answer
                    const normalizedOptions = q.options.map((opt: string) => {
                        opt = opt.trim();
                        // Remove letter prefix if present (e.g., "A. ", "B. ")
                        return opt.replace(/^[A-D]\.\s*/, '');
                    });

                    let normalizedAnswer = q.answer.trim();
                    // If answer is just a letter (A, B, C, D), convert to full option text
                    if (/^[A-D]$/.test(normalizedAnswer)) {
                        const index = normalizedAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
                        if (index >= 0 && index < q.options.length) {
                            normalizedAnswer = normalizedOptions[index];
                        }
                    } else {
                        // Remove letter prefix if present
                        normalizedAnswer = normalizedAnswer.replace(/^[A-D]\.\s*/, '');
                    }

                    // Check if normalized answer matches any normalized option
                    if (!normalizedOptions.includes(normalizedAnswer)) {
                        throw new Error(`Question ${questionNum}'s answer must match one of its options`);
                    }

                    return {
                        question: q.question,
                        options: normalizedOptions,
                        answer: normalizedAnswer
                    };
                }

                // For open-ended questions
                return {
                    question: q.question,
                    answer: q.answer
                };
            });

            if (parsedQuestions.length !== amount) {
                throw new Error(`Expected ${amount} questions but got ${parsedQuestions.length}`);
            }

        } catch (error) {
            console.error('Error parsing questions:', error);
            console.error('Raw content:', content);
            throw new Error(error instanceof Error ? error.message : 'Failed to parse questions from response');
        }

        // Create game and questions in database
            const game = await prisma.$transaction(async (tx) => {
                const newGame = await tx.game.create({
                    data: {
                        topic,
                        gameType: type,
                        timeStarted: new Date(),
                        userId: session.user.id,
                        completionMessage,
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
                const manyData = parsedQuestions.map((question: any) => ({
                            question: question.question,
                            answer: question.answer,
                    options: JSON.stringify(question.options),
                            gameId: newGame.id,
                            questionType: type,
                }));

                    await tx.question.createMany({
                        data: manyData
                    });
                    console.log("MCQ questions created");
                } else if (type === 'open_ended') {
                const manyData = parsedQuestions.map((question: any) => ({
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
                gameId: game.id
            });

    } catch (error) {
        console.error("Game creation failed:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred" },
            { status: 500 }
        );
    }
}