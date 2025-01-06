import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";
import { getAuthSession } from "@/lib/nextauth";
import { error } from "console";

// POST /api/questions
export const POST = async (req: Request, res: Response) => {
    try {
        // const session = await getAuthSession()
        // if (!session?.user){
        //     return NextResponse.json(
        //         {
        //             error: "You must be logged in to create a quiz",
        //         },
        //         {
        //             status: 401,
        //         }
        //     );
        // }
        const body = await req.json();
        const {amount, topic, type} = quizCreationSchema.parse(body);
        let questions: any;
        if (type === 'open_ended') {
            questions = await strict_output(
                "You are a helpful AI that is able to generate a pair of questions and answers, the length of the answer should not have limit of character, store all the pairs of answers and questions in a JSON array",
                new Array(amount).fill(
                    `You are to generate a random easy open-ended question about ${topic}`
                ),
                {
                 question: "question", 
                 answer: "answer with max length of 15 words",
                },
            );
        } else if (type === 'mcq') {
            questions = await strict_output(
                'You are a helpful AI that is able to generate mcq questions and answers,',
                new Array(amount).fill(
                    `You are to generate a random easy mcq question about ${topic}`
                ),
                {
                    question: 'question',
                    answer: 'answer with max length of 15 words',
                    option1: "1st options with max length of 15 words",
                    option2: "2nd options with max length of 15 words",
                    option3: "3rd options with max length of 15 words",

                }
            );
            questions = questions.map((q: any) => {
                const options = [q.option1, q.option2, q.option3];
                const uniqueOptions = Array.from(new Set(options));
                while (uniqueOptions.length < 3) {
                    const newOption = `new option with max length of 15 words about ${topic}`;
                    if (!uniqueOptions.includes(newOption)) {
                        uniqueOptions.push(newOption);
                    }
                }
                return {
                    ...q,
                    option1: uniqueOptions[0],
                    option2: uniqueOptions[1],
                    option3: uniqueOptions[2],
                };
            });
        }
        return NextResponse.json(
        {
        questions,
        }, 
        {
        status: 200,
        }
        );
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
            {
                error: error.issues,
            }, 
            {
                status: 400,
            });
        }
    }  
};

