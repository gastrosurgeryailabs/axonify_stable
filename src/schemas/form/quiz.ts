import {z} from 'zod'; // vailidation library

export const workspaceCreationSchema = z.object({
    name: z.string().min(1, {message: "Workspace name is required"}),
    chatModel: z.string().min(1, {message: "Chat model is required"}),
    chatProvider: z.string().default("openai"),
    chatMode: z.string().default("chat"),
    openAiTemp: z.number().min(0).max(1).default(0.7),
    openAiHistory: z.number().min(1).default(20),
    openAiPrompt: z.string().default("You are a highly knowledgeable AI assistant focused on providing accurate and detailed information.")
});

export const socialMediaSchema = z.object({
    selectedPlatforms: z.array(z.enum([
        'instagram', 
        'facebook', 
        'linkedin', 
        'twitter', 
        'tiktok', 
        'pinterest', 
        'youtube', 
        'mastodon', 
        'threads',
        'bluesky'
    ])).default([]),
    multiplatform: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    instagram: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    facebook: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    linkedin: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    twitter: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    tiktok: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    pinterest: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    youtube: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    mastodon: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    threads: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional(),
    bluesky: z.object({
        message: z.string().optional(),
        generateWithAI: z.boolean().default(false)
    }).optional()
});

export const quizCreationSchema = z.object({
    topic: z.string().min(2, {message:"Topic must be atleast 2 characters long"}).max(500),
    type: z.enum(['mcq', 'open_ended']),
    amount: z.number().min(1).max(10),
    targetLanguage: z.string().default('en'),
    prompt: z.string().min(10, {message: "Prompt must be at least 10 characters long"}).max(2000),
    explanationPrompt: z.string().min(10, {message: "Explanation prompt must be at least 10 characters long"}).max(2000).optional().default("Provide clear, concise explanations for why the answer is correct. Include relevant facts and context that help understand the concept."),
    model: z.string().min(1, {message: "Model selection is required"}),
    newWorkspace: workspaceCreationSchema.optional(),
    temperature: z.number().min(0).max(1).default(0.7),
    apiKey: z.string().min(1, {message: "API key is required"}),
    serverUrl: z.string().min(1, {message: "Server URL is required"}),
    completionMessage: z.string().optional().default("Great job on completing the quiz!"),
    socialMedia: socialMediaSchema.optional(),
    gameId: z.string().optional(),
    initialized: z.boolean().optional().default(false)
});

export const checkAnswerSchema = z.object({
    questionId: z.string(),
    userAnswer: z.string(),
})