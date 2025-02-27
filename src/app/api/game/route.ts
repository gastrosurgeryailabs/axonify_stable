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

        console.log("Session validated successfully");

        const body = await req.json();
        console.log("Received request body:", body);

        const { amount, topic, type, targetLanguage, prompt, model, apiKey, completionMessage, serverUrl } = quizCreationSchema.parse(body);
        console.log("Request body validated successfully");
        console.log("Game API received model:", model);
        console.log("Creating game with:", { amount, topic, type, targetLanguage, prompt, model });

        // Make request to AnythingLLM API for questions
        const apiUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
        console.log("Making request to AnythingLLM API at:", apiUrl);
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
                        content: `You are a quiz generator. Return ONLY a valid JSON array of questions with this exact format:
[
    {
        "question": "Clear question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "answer": "Exact match of correct option",
        "explanation": "Brief explanation of why this answer is correct"
    }
]
For MCQ: include question, options (exactly 4), answer, and explanation fields.
For open-ended: include question, answer, and explanation fields.

For explanations: ${body.explanationPrompt || "Provide clear, concise explanations for why the answer is correct. Include relevant facts and context that help understand the concept."}

IMPORTANT: Return ONLY the JSON array with no markdown, formatting, or additional text.`
                    },
                    {
                        role: "user",
                        content: `Generate ${amount} ${type === 'mcq' ? 'multiple choice' : 'open ended'} questions about ${topic}.

Topic: ${topic}
Requirements: ${prompt}`
                    }
                ],
                model,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AnythingLLM API error response:", errorText);
            throw new Error(`AnythingLLM API returned ${response.status}: ${response.statusText}. Details: ${errorText}`);
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
            // Try direct JSON parsing first
            try {
                parsedQuestions = JSON.parse(content);
                console.log("Successfully parsed JSON directly");
            } catch (e) {
                console.log("Direct JSON parsing failed, trying to extract JSON from text");
                
            // Find the JSON array in the response
            const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
            if (!jsonMatch) {
                    // If no JSON array found, try to convert the formatted text to JSON
                    console.log("No JSON array found, attempting to convert formatted text to JSON");
                    
                    // Extract questions and convert to JSON format
                    const questions = [];
                    const questionBlocks = content.split(/\*\*Question \d+:\*\*/).filter((block: string) => block.trim());
                    
                    for (const block of questionBlocks) {
                        try {
                            if (type === 'mcq') {
                                // Extract question text
                                const questionMatch = block.match(/\*\*(.*?)\*\*/);
                                const question = questionMatch ? questionMatch[1].trim() : block.split('\n')[0].trim();
                                
                                // Extract options
                                const options: string[] = [];
                                const optionMatches = block.match(/\([A-D]\)(.*?)(?=\([A-D]\)|$|\*\*Answer)/g);
                                if (optionMatches) {
                                    for (const option of optionMatches) {
                                        options.push(option.replace(/^\([A-D]\)/, '').trim());
                                    }
                                } else {
                                    // Try alternative format
                                    const lines = block.split('\n').filter((line: string) => line.trim());
                                    for (const line of lines) {
                                        const optMatch = line.match(/^\s*\([A-D]\)\s*(.*)/);
                                        if (optMatch) {
                                            options.push(optMatch[1].trim());
                                        }
                                    }
                                }
                                
                                // Extract answer
                                const answerMatch = block.match(/\*\*Answer:\*\*\s*\(([A-D])\)(.*?)$/);
                                let answer = '';
                                if (answerMatch) {
                                    const answerLetter = answerMatch[1];
                                    const index = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                                    if (index >= 0 && index < options.length) {
                                        answer = options[index];
                                    } else {
                                        answer = answerMatch[2] ? answerMatch[2].trim() : '';
                                    }
                                }
                                
                                // Extract explanation
                                let explanation = '';
                                const explanationMatch = block.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
                                if (explanationMatch) {
                                    explanation = explanationMatch[1].trim();
                                }
                                
                                if (question && options.length === 4 && answer) {
                                    questions.push({
                                        question,
                                        options,
                                        answer,
                                        explanation: explanation || `Explanation for why "${answer}" is correct.`
                                    });
                                }
                            } else {
                                // Handle open-ended questions
                                const lines = block.split('\n').filter((line: string) => line.trim());
                                const question = lines[0].replace(/^\*\*|\*\*$/g, '').trim();
                                const answerLine = lines.find((line: string) => line.includes('Answer:'));
                                const answer = answerLine 
                                    ? answerLine.replace(/^\*\*Answer:\*\*\s*/, '').trim() 
                                    : lines[lines.length - 1].trim();
                                
                                // Extract explanation for open-ended
                                let explanation = '';
                                const explanationLine = lines.find((line: string) => line.includes('Explanation:'));
                                if (explanationLine) {
                                    explanation = explanationLine.replace(/^\*\*Explanation:\*\*\s*/, '').trim();
                                }
                                
                                if (question && answer) {
                                    questions.push({
                                        question,
                                        answer,
                                        explanation: explanation || `Explanation for the answer "${answer.substring(0, 30)}${answer.length > 30 ? '...' : ''}".`
                                    });
                                }
                            }
                        } catch (blockError) {
                            console.error('Error parsing question block:', blockError);
                        }
                    }
                    
                    if (questions.length > 0) {
                        parsedQuestions = questions;
                        console.log("Successfully converted formatted text to JSON");
                    } else {
                        throw new Error('Failed to extract questions from formatted text');
                    }
                } else {
            // Clean up the JSON string
            const jsonStr = jsonMatch[0]
                .replace(/\n/g, '')  // Remove newlines
                .replace(/\s+/g, ' ') // Normalize spaces
                .replace(/,\s*]/g, ']'); // Remove trailing commas

            parsedQuestions = JSON.parse(jsonStr);
                    console.log("Successfully extracted and parsed JSON from text");
                }
            }

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
                
                // Ensure explanation exists
                if (!q.explanation || typeof q.explanation !== 'string') {
                    q.explanation = type === 'mcq' 
                        ? `Explanation for why "${q.answer}" is correct.`
                        : `Explanation for the answer "${q.answer.substring(0, 30)}${q.answer.length > 30 ? '...' : ''}".`;
                } else {
                    q.explanation = q.explanation.trim();
                }

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
                        answer: normalizedAnswer,
                        explanation: q.explanation
                    };
                }

                // For open-ended questions
                return {
                    question: q.question,
                    answer: q.answer,
                    explanation: q.explanation
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
                // Create questions one by one instead of using createMany
                for (const question of parsedQuestions) {
                    await tx.question.create({
                        data: {
                            question: question.question,
                            answer: question.answer,
                            options: JSON.stringify(question.options),
                            gameId: newGame.id,
                            questionType: type,
                        }
                    });
                    
                    // If explanation field is supported, update the question to add it
                    if (question.explanation) {
                        try {
                            const createdQuestion = await tx.question.findFirst({
                                where: {
                                    gameId: newGame.id,
                                    question: question.question,
                                    answer: question.answer
                                },
                                orderBy: {
                                    id: 'desc'
                                }
                            });
                            
                            if (createdQuestion) {
                                await tx.question.update({
                                    where: { id: createdQuestion.id },
                                    data: { 
                                        // Use type assertion to bypass TypeScript checking
                                        // since we know the field exists in the database
                                        ...(question.explanation ? { explanation: question.explanation } : {}) as any
                                    }
                                });
                            }
                        } catch (e) {
                            console.log("Could not update explanation field:", e);
                        }
                    }
                }
                console.log("MCQ questions created");
            } else if (type === 'open_ended') {
                // Create questions one by one instead of using createMany
                for (const question of parsedQuestions) {
                    await tx.question.create({
                        data: {
                            question: question.question,
                            answer: question.answer,
                            gameId: newGame.id,
                            questionType: type,
                        }
                    });
                    
                    // If explanation field is supported, update the question to add it
                    if (question.explanation) {
                        try {
                            const createdQuestion = await tx.question.findFirst({
                                where: {
                                    gameId: newGame.id,
                                    question: question.question,
                                    answer: question.answer
                                },
                                orderBy: {
                                    id: 'desc'
                                }
                            });
                            
                            if (createdQuestion) {
                                await tx.question.update({
                                    where: { id: createdQuestion.id },
                                    data: { 
                                        // Use type assertion to bypass TypeScript checking
                                        // since we know the field exists in the database
                                        ...(question.explanation ? { explanation: question.explanation } : {}) as any
                                    }
                                });
                            }
                        } catch (e) {
                            console.log("Could not update explanation field:", e);
                        }
                    }
                }
                console.log("Open-ended questions created");
            }

            return newGame;
        }, { timeout: 10000 });

        return NextResponse.json({
            gameId: game.id
        });

    } catch (error) {
        // Safely log error without using error object directly
        if (error instanceof Error) {
            console.log("Game creation failed. Error message:", error.message);
            console.log("Error name:", error.name);
            console.log("Error stack:", error.stack);
        } else {
            console.log("Game creation failed with non-Error object:", String(error));
        }
        
        if (error instanceof ZodError) {
            console.log("Validation error details:", JSON.stringify(error.errors));
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred", details: String(error) },
            { status: 500 }
        );
    }
}