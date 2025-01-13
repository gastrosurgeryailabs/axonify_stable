import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";
import { translateQuizContent } from "@/lib/translation";

// POST /api/questions
export const POST = async (req: Request, res: Response) => {
    try {
        const body = await req.json();
        const {amount, topic, type, targetLanguage, prompt, model, apiKey} = quizCreationSchema.parse(body);
        
        console.log("Questions API received request with model:", model);
        
        let questions: any;
        
        try {
            if (type === 'open_ended') {
                console.log("Generating open-ended questions using model:", model);
                questions = await strict_output(
                    prompt,
                    new Array(amount).fill(
                        `You are to generate a random easy open-ended question about ${topic}`
                    ),
                    {
                        question: "complete question without any blanks or placeholders", 
                        answer: "well-structured sentence with exactly 2 technical terms marked with [[term]] syntax",
                    },
                    "",
                    false,
                    model,
                    1,
                    3,
                    false,
                    apiKey
                );

                questions = questions.map((q: any) => ({
                    ...q,
                    answer: q.answer,
                    markedTerms: q.answer.match(/\[\[(.*?)\]\]/g)?.map((m: string) => m.slice(2, -2)) || []
                }));
            } else if (type === 'mcq') {
                console.log("Generating MCQ questions using model:", model);
                questions = await strict_output(
                    prompt,
                    new Array(amount).fill(
                        `You are to generate a random easy mcq question about ${topic}`
                    ),
                    {
                        question: "string",
                        answer: "string",
                        incorrectAnswers: ["string", "string", "string"]
                    },
                    "",
                    false,
                    model,
                    1,
                    3,
                    false,
                    apiKey
                );

                // Transform the response to match the expected format
                questions = questions.map((q: any) => {
                    // Ensure we have the correct number of incorrect answers
                    if (!Array.isArray(q.incorrectAnswers) || q.incorrectAnswers.length !== 3) {
                        throw new Error("Invalid incorrect answers format");
                    }

                    return {
                        question: q.question,
                        answer: q.answer,
                        option1: q.incorrectAnswers[0],
                        option2: q.incorrectAnswers[1],
                        option3: q.incorrectAnswers[2]
                    };
                });
            }
        } catch (error: any) {
            console.error("OpenAI API Error:", error);
            
            // Extract the error details
            const errorDetails = error.response?.data || error;
            const errorCode = errorDetails.error?.code || errorDetails.code;
            const errorType = errorDetails.error?.type || errorDetails.type;
            const errorMessage = errorDetails.error?.message || errorDetails.message;
            
            // Check for specific API key errors
            if (
                errorCode === 'invalid_api_key' ||
                errorType === 'invalid_request_error' ||
                errorMessage?.toLowerCase().includes('api key') ||
                errorMessage?.toLowerCase().includes('authentication') ||
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                return NextResponse.json(
                    { error: "Invalid API key. Please check your API key and try again." },
                    { status: 401 }
                );
            }

            // Check for rate limiting
            if (
                errorCode === 'rate_limit_exceeded' ||
                errorType === 'rate_limit_error' ||
                error.response?.status === 429
            ) {
                return NextResponse.json(
                    { error: "We're experiencing high traffic. Please try again in a few seconds." },
                    { status: 429 }
                );
            }

            // Check for server overload
            if (
                errorCode === 'server_error' ||
                errorType === 'server_error' ||
                error.response?.status === 503 ||
                error.response?.status === 502
            ) {
                return NextResponse.json(
                    { error: "Our servers are currently busy. Please try again in a moment." },
                    { status: 503 }
                );
            }
            
            // For other OpenAI errors, return a 400 status with a user-friendly message
            return NextResponse.json(
                { error: "Unable to generate questions right now. Please try again in a few moments." },
                { status: 400 }
            );
        }

        if (!Array.isArray(questions)) {
            questions = [questions];
        }

        if (targetLanguage && targetLanguage !== 'en') {
            questions = await translateQuizContent(questions, targetLanguage);
        }

        return NextResponse.json(
            { questions },
            { status: 200 }
        );

    } catch (error) {
        console.error("Question generation error:", error);
        
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { 
                error: "An unexpected error occurred. Please try again.",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

