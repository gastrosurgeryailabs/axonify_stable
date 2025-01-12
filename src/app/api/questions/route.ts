import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";
import { translateQuizContent } from "@/lib/translation";

// POST /api/questions
export const POST = async (req: Request, res: Response) => {
    try {
        const body = await req.json();
        const {amount, topic, type, targetLanguage, prompt} = quizCreationSchema.parse(body);
        
        console.log("Generating questions for:", { amount, topic, type, targetLanguage, prompt });
        
        let questions: any;
        
        if (type === 'open_ended') {
            questions = await strict_output(
                prompt,
                new Array(amount).fill(
                    `You are to generate a random easy open-ended question about ${topic}`
                ),
                {
                    question: "complete question without any blanks or placeholders", 
                    answer: "well-structured sentence with exactly 2 technical terms marked with [[term]] syntax",
                }
            );

            // Process the marked terms in the answers
            questions = questions.map((q: any) => ({
                ...q,
                answer: q.answer,
                markedTerms: q.answer.match(/\[\[(.*?)\]\]/g)?.map((m: string) => m.slice(2, -2)) || []
            }));
        } else if (type === 'mcq') {
            questions = await strict_output(
                prompt,
                new Array(amount).fill(
                    `You are to generate a random easy mcq question about ${topic}`
                ),
                {
                    question: 'question',
                    answer: 'answer with max length of 15 words',
                    option1: "1st option with max length of 15 words",
                    option2: "2nd option with max length of 15 words",
                    option3: "3rd option with max length of 15 words",
                }
            );
        }

        if (!Array.isArray(questions)) {
            questions = [questions];
        }

        // Translate questions if a target language is specified
        if (targetLanguage && targetLanguage !== 'en') {
            questions = await translateQuizContent(questions, targetLanguage);
        }

        console.log("Generated questions:", questions);

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
                error: "Failed to generate questions",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
};

