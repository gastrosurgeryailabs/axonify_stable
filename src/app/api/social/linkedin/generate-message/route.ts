import { NextResponse } from "next/server";
import { strict_output } from "@/lib/gpt";

export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model } = await req.json();

        if (!apiKey) {
            throw new Error("AnythingLLM API key is required");
        }

        const system_prompt = "You are a social media expert who creates engaging LinkedIn posts that drive engagement while maintaining professionalism.";
        
        const user_prompt = `Generate an engaging LinkedIn post for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it professional yet approachable
- Use line breaks for readability
- Include 3-5 relevant hashtags
- Add a clear call-to-action
- Focus on value and learning opportunities
- Use bullet points or emojis sparingly
- Maximum 2-3 short paragraphs

Format the response in a way that's ready to be posted on LinkedIn.`;

        const response = await fetch(`${process.env.NEXT_PUBLIC_ANYTHING_LLM_URL}/api/v1/openai/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: system_prompt
                    },
                    {
                        role: "user",
                        content: user_prompt
                    }
                ],
                model,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`AnythingLLM API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from AnythingLLM");
        }

        return NextResponse.json({ message: content });
    } catch (error) {
        console.error("Error generating LinkedIn post message:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate LinkedIn post message" },
            { status: 500 }
        );
    }
} 