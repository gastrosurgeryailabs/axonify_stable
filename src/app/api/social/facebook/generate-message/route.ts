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
- Instead, create an engaging Facebook post that teases the topic
- Focus on creating curiosity about the quiz
- Keep it conversational and engaging` : '';

        const system_prompt = `You are a social media expert who creates engaging Facebook posts that drive engagement while maintaining professionalism. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a post that makes people curious about the quiz
- Example: "🐧 Calling all Linux enthusiasts! 

Think you know your way around the command line? We've put together an exciting challenge to test your Linux expertise! 

Join our community of tech enthusiasts and see how you stack up. Whether you're a beginner or a seasoned pro, this quiz has something for everyone! 🚀"` : '';

        const user_prompt = `Generate an engaging Facebook post for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it informative but conversational
- Use emojis appropriately
- Include a clear call-to-action
- Make it shareable and engaging
- Add engaging questions to encourage participation WITHOUT revealing quiz content
- Maximum 2-3 short paragraphs${llamaExample}

Format the response in a way that's ready to be posted on Facebook.`;

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
        console.error("Error generating Facebook post message:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Facebook post message" },
            { status: 500 }
        );
    }
} 