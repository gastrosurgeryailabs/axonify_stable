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

export const quizCreationSchema = z.object({
    topic: z.string().min(4, {message:"Topic must be atleast 4 characters long"}).max(500),
    type: z.enum(['mcq', 'open_ended']),
    amount: z.number().min(1).max(10),
    targetLanguage: z.string().default('en'),
    prompt: z.string().min(10, {message: "Prompt must be at least 10 characters long"}).max(2000),
    model: z.string().min(1, {message: "Model selection is required"}), // Changed from workspaceId to model
    newWorkspace: workspaceCreationSchema.optional(), // For creating new workspace
    temperature: z.number().min(0).max(1).default(0.7),
    apiKey: z.string().min(1, {message: "API key is required"}),
    completionMessage: z.string().optional().default("Great job on completing the quiz!")
});

export const checkAnswerSchema = z.object({
    questionId: z.string(),
    userAnswer: z.string(),
})