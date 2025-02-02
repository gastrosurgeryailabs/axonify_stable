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
- Instead, create an engaging Threads post that teases the topic
- Focus on creating curiosity about the quiz
- Keep it conversational and Instagram-like` : '';

        const system_prompt = `You are a social media expert who creates engaging Threads posts that drive engagement while maintaining a conversational, Instagram-like style. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a post that makes people curious about the quiz
- Example: "🚀 Linux enthusiasts, this one's for you!

Think you've mastered the command line? We've created the ultimate challenge to put your skills to the test.

Join our growing tech community and show what you're made of! 💪

#TechSkills #LinuxCommunity #CodingChallenge"` : '';

        const user_prompt = `Generate an engaging Threads post for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it conversational and engaging
- Use emojis appropriately
- Make it attention-grabbing
- Focus on starting conversations
- Use short, impactful sentences
- Add clear call-to-action
- Maximum 2-3 short paragraphs
- Include relevant hashtags
- Encourage participation WITHOUT revealing questions${llamaExample}

Format the response in a way that's ready to be posted on Threads, similar to Instagram style but more conversation-focused.`;

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
        console.error("Error generating Threads post:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Threads post" },
            { status: 500 }
        );
    }
} 