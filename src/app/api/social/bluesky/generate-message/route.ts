import { NextResponse } from "next/server";
import { strict_output } from "@/lib/gpt";

export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model } = await req.json();

        if (!apiKey) {
            throw new Error("AnythingLLM API key is required");
        }

        const system_prompt = "You are a social media expert who creates engaging Bluesky posts that drive engagement while maintaining a balance between casual and professional tone. DO NOT include any placeholder URLs or quiz links - these will be added automatically by the system.";
        
        const user_prompt = `Generate an engaging Bluesky post for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it concise but informative
- Balance casual and professional tone
- Use emojis sparingly
- Make it engaging and shareable
- Focus on value proposition
- Add clear call-to-action
- Maximum 1-2 short paragraphs
- Include 2-3 relevant hashtags
- DO NOT include any placeholder quiz links or URLs
- DO NOT use phrases like "[Insert Quiz Link]" or similar

Format the response in a way that's ready to be posted on Bluesky, considering its 300-character limit. The quiz link will be automatically added by the system.`;

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
        console.error("Error generating Bluesky post:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Bluesky post" },
            { status: 500 }
        );
    }
} 