import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { strict_output, SYSTEM_QUIZ_PROMPT } from "@/lib/gpt";
import { translateQuizContent } from "@/lib/translation";

// POST /api/questions
export const POST = async (req: Request, res: Response) => {
    try {
        const body = await req.json();
        const {amount, topic, type, targetLanguage, prompt, model, apiKey} = quizCreationSchema.parse(body);
        
        // Get the origin from the request URL
        const origin = new URL(req.url).origin;
        
        console.log("Questions API received request:", {
            topic,
            type,
            amount,
            targetLanguage,
            model,
            origin
        });
        
        let questions: any;
        const systemPromptWithCustom = SYSTEM_QUIZ_PROMPT + "\n\nCustom Instructions:\n" + prompt;
        
        try {
            if (type === 'open_ended') {
                console.log("Full prompt for open-ended questions:", systemPromptWithCustom);
                questions = await strict_output(
                    systemPromptWithCustom,
                    new Array(amount).fill(
                        `Generate an open-ended question about ${topic}. Follow the custom instructions provided.`
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
                console.log("Full prompt for MCQ questions:", systemPromptWithCustom);
                questions = await strict_output(
                    systemPromptWithCustom,
                    new Array(amount).fill(
                        `Generate a multiple choice question about ${topic}. Follow the custom instructions provided.`
                    ),
                    {
                        question: "detailed question text, including any scenario or context if applicable",
                        answer: "correct answer with explanation",
                        incorrectAnswers: ["plausible incorrect answer 1", "plausible incorrect answer 2", "plausible incorrect answer 3"]
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
                        answer: q.answer.split(" with explanation:")[0], // Extract just the answer part
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

        // Log the generated questions before translation
        console.log("Generated questions before translation:", JSON.stringify(questions, null, 2));
        
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

export async function POST_ANYTHING_LLM(req: Request) {
  try {
    const { messages, model, temperature, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    console.log("Making request to AnythingLLM:", ANYTHING_LLM_URL);

    const response = await fetch(`${ANYTHING_LLM_URL}/api/v1/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: messages[0].content
          },
          {
            role: "user",
            content: messages[messages.length - 1].content
          }
        ],
        model,
        temperature,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AnythingLLM API error:', error);
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

