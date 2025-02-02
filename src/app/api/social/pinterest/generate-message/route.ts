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
- Instead, create an engaging Pinterest description that teases the topic
- Focus on creating curiosity about the quiz
- Keep it SEO-friendly and discoverable` : '';

        const system_prompt = `You are a social media expert who creates engaging Pinterest pin descriptions that drive engagement and discovery through SEO optimization. ${llamaInstructions}`;
        
        const llamaExample = model.toLowerCase().includes('llama') ? 
            `\nIMPORTANT FOR LLAMA:
- DO NOT write out any quiz questions
- DO NOT list any answer options
- DO NOT use A), B), C) format
- Instead, write a description that makes people curious about the quiz
- Example: "🎯 Master Linux Command Line Skills | Interactive Tech Quiz

Level up your Linux expertise with our comprehensive command-line quiz! Perfect for developers, system administrators, and tech enthusiasts looking to validate their skills.

#LinuxTutorial #TechEducation #CommandLine #ProgrammingTips #LearnLinux"` : '';

        const user_prompt = `Generate an engaging Pinterest pin description for a quiz about ${topic}.
Quiz Type: ${type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}
Additional Context: ${userInput || 'None provided'}

Requirements:
- Keep it descriptive and SEO-friendly
- Use relevant keywords naturally
- Include appropriate hashtags
- Make it discoverable
- Focus on value proposition
- Add clear call-to-action
- Maximum 2-3 short paragraphs
- Include relevant education/learning keywords
- Encourage participation WITHOUT revealing quiz content${llamaExample}

Format the response in a way that's ready to be used as a Pinterest pin description.`;

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
        console.error("Error generating Pinterest pin description:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate Pinterest pin description" },
            { status: 500 }
        );
    }
} 