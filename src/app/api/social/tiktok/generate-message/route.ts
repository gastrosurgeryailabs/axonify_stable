import { NextResponse } from "next/server";
import { strict_output } from "@/lib/gpt";

export async function POST(req: Request) {
    try {
        const { topic, type, userInput, apiKey, model } = await req.json();

        if (!apiKey) {
            throw new Error("AnythingLLM API key is required");
        }

        const llamaInstructions = model.toLowerCase().includes('llama') ? 
            `CRITICAL INSTRUCTIONS FOR LLAMA:
- DO NOT output the actual quiz questions
- DO NOT list multiple choice options
- DO NOT use A), B), C) format
- Instead, create an engaging TikTok caption that teases the topic
- Focus on creating curiosity about the quiz
- Keep it trendy and TikTok-friendly` : '';

        const system_prompt = `You are a social media expert who creates engaging TikTok captions that drive engagement while maintaining professionalism. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a caption that makes people curious about the quiz
- Example: "🧠 Linux pros! Time to level up your command game! Watch this and get ready to test your skills! 🚀\n\n#LearnOnTikTok #EduTok #TechTok #LinuxCommunity"` : '';

        const user_prompt = `Generate an engaging TikTok caption for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it trendy and engaging
- Use relevant emojis generously
- Include trending TikTok hashtags
- Make it attention-grabbing
- Use short, punchy sentences
- Add hook at the beginning
- Maximum 2-3 short paragraphs
- Include #LearnOnTikTok and #EduTok
- Encourage participation WITHOUT revealing questions${llamaExample}

Format the response in a way that's ready to be posted on TikTok.`;

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
        console.error("Error generating TikTok caption:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate TikTok caption" },
            { status: 500 }
        );
    }
}