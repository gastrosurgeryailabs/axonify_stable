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
- Instead, create an engaging caption that teases the topic
- Focus on creating curiosity about the quiz
- Keep it engaging and Instagram-friendly` : '';

        const system_prompt = `You are a social media expert who creates engaging Instagram captions that drive engagement while maintaining professionalism. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a caption that makes people curious about the quiz
- Example: "🧠 Calling all Linux enthusiasts! We've crafted the ultimate command-line challenge to test your skills. Are you ready to prove your expertise? 💪\n\n#Linux #Programming #TechQuiz #LearnToCode #OpenSource"` : '';

        const user_prompt = `Generate an engaging Instagram post caption for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it concise and engaging
- Use relevant emojis
- Include appropriate hashtags
- Make it Instagram-friendly
- Encourage participation WITHOUT revealing questions
- Highlight the quiz topic and type
- Maximum 2-3 short paragraphs${llamaExample}

Format the response in a way that's ready to be posted on Instagram.`;

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
        console.error("Error generating Instagram caption:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Instagram caption" },
            { status: 500 }
        );
    }
} 