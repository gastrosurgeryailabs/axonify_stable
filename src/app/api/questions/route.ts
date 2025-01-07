import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";
import { translateQuizContent } from "@/lib/translation";

// POST /api/questions
export const POST = async (req: Request, res: Response) => {
    try {
        const body = await req.json();
        const {amount, topic, type, targetLanguage} = quizCreationSchema.parse(body);
        
        console.log("Generating questions for:", { amount, topic, type, targetLanguage });
        
        let questions: any;
        
        if (type === 'open_ended') {
            questions = await strict_output(
                `You are a helpful AI that is able to generate pairs of questions and answers. Follow these rules strictly:
1. Each question should be a clear, complete question
2. Each answer MUST be a complete sentence with subject, verb, and object
3. Never repeat the question as the answer
4. The answer must contain exactly 2 IMPORTANT technical terms
5. Mark each important technical term with [[term]] markers
6. The marked terms should be meaningful when replaced with blanks

Example 1 (BAD):
Q: What is a Python data type?
A: [[List]] is a built-in data type.
(This is bad because the term alone isn't meaningful in context)

Example 1 (GOOD):
Q: What is a Python data type?
A: [[Python lists]] are used to store [[multiple data items]].
(Better because both terms are meaningful in context)

Example 2 (BAD):
Q: What does a compiler do?
A: A compiler converts [[code]] to [[machine code]].
(Too simple, first term isn't specific enough)

Example 2 (GOOD):
Q: What does a compiler do?
A: The compiler translates [[source code]] into [[executable machine code]].
(Better because both terms are specific and meaningful)

Important:
- Terms can be multiple words if they form one concept
- Terms should be crucial to understanding the concept
- Terms should make sense when blanked out
- The sentence should remain grammatically correct when terms are replaced with blanks
- In non-English languages, mark the entire meaningful phrase, not just individual words

Return the questions in a JSON array format.`,
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

