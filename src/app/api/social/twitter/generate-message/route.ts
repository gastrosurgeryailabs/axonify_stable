import { NextResponse } from "next/server";
import { strict_output } from "@/lib/gpt";

export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model } = await req.json();

        if (!apiKey) {
            throw new Error("AnythingLLM API key is required");
        }

        const system_prompt = `You are a social media expert who creates engaging Twitter/X posts that drive engagement while being concise and impactful. 
${model.toLowerCase().includes('llama') ? `CRITICAL INSTRUCTIONS FOR LLAMA:
- DO NOT output the actual quiz question
- DO NOT list multiple choice options
- DO NOT use A), B), C) format
- Instead, create an engaging tweet that teases the topic
- Focus on creating curiosity about the quiz
- Keep it short and punchy` : ''}
DO NOT include any placeholder URLs or quiz links - these will be added automatically by the system.`;
        
        const user_prompt = `Generate an engaging tweet for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it concise and impactful (280 characters max)
- Use emojis strategically
- Include relevant hashtags
- Make it attention-grabbing
- Create curiosity WITHOUT revealing quiz questions
- Add clear call-to-action
- Maximum 1-2 short sentences
- Focus on driving engagement
${model.toLowerCase().includes('llama') ? `
IMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a tweet that makes people curious about the quiz
- Example: "🚀 Linux enthusiasts! Ready to test your command-line mastery? Take our quiz and prove your skills! #Linux #OpenSource"` : ''}
- DO NOT include any placeholder quiz links or URLs
- DO NOT use phrases like "[Insert Quiz Link]" or similar

Format the response in a way that's ready to be posted on Twitter/X, strictly adhering to the 280-character limit. The quiz link will be automatically added by the system.`;

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
        console.error("Error generating tweet:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate tweet" },
            { status: 500 }
        );
    }
} 