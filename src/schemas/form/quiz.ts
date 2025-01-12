import {z} from 'zod'; // vailidation library

export const quizCreationSchema = z.object({
    topic: z.string().min(4, {message:"Topic must be atleast 4 characters long"}).max(500),
    type: z.enum(['mcq', 'open_ended']),
    amount: z.number().min(1).max(10),
    targetLanguage: z.string().default('en'), // Default to English if not specified
    prompt: z.string().min(10, {message: "Prompt must be at least 10 characters long"}).max(2000)
});

export const checkAnswerSchema = z.object({
    questionId: z.string(),
    userAnswer: z.string(),
})