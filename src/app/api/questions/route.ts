import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";

// POST /api/questions
export const POST = async (req: Request, res: Response) => {
    try {
        const body = await req.json();
        const {amount, topic, type} = quizCreationSchema.parse(body);
        
        console.log("Generating questions for:", { amount, topic, type });
        
        let questions: any;
        
        if (type === 'open_ended') {
            questions = await strict_output(
                "You are a helpful AI that is able to generate pairs of questions and answers. Follow these rules strictly:\n1. Each question should be a clear, complete question\n2. Each answer MUST be a complete sentence with subject, verb, and object\n3. Never repeat the question as the answer\n4. The answer must contain exactly 2 IMPORTANT technical terms\n5. Structure answers to make the technical terms meaningful when blanked\n\nExample 1 (BAD):\nQ: What is a Python data type?\nA: List is a built-in data type.\n(This is bad because 'List' alone isn't meaningful)\n\nExample 1 (GOOD):\nQ: What is a Python data type?\nA: Python lists are used to store multiple data items.\n(Better because 'lists' and 'data items' are meaningful terms)\n\nExample 2 (BAD):\nQ: What does a compiler do?\nA: A compiler converts code to machine code.\n(Too simple, terms aren't specific enough)\n\nExample 2 (GOOD):\nQ: What does a compiler do?\nA: The compiler translates source code into executable machine code.\n(Better because 'source code' and 'machine code' are specific terms)\n\nMake sure each answer is properly structured so the blanked terms test actual knowledge. Return the questions in a JSON array format.",
                new Array(amount).fill(
                    `You are to generate a random easy open-ended question about ${topic}`
                ),
                {
                    question: "complete question without any blanks or placeholders", 
                    answer: "well-structured sentence with exactly 2 meaningful technical terms that will make sense when replaced with blanks",
                }
            );
        } else if (type === 'mcq') {
            questions = await strict_output(
                'You are a helpful AI that is able to generate mcq questions and answers. Each question should have one clear correct answer and three incorrect but plausible options. Return the questions in a JSON array format.',
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

