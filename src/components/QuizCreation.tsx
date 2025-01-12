'use client';

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useForm } from 'react-hook-form';
import { quizCreationSchema } from '@/schemas/form/quiz';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { BookOpen, CopyCheck } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import LoadingQuestions from './LoadingQuestions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {ShareButton }from './ShareButton';
import { Textarea } from './ui/textarea';

type Props = {
    topicParam: string;
}

type Input = z.infer<typeof quizCreationSchema>;

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ur', name: 'Urdu' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ms', name: 'Malay' },
    { code: 'tr', name: 'Turkish' },
    { code: 'fa', name: 'Persian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'cs', name: 'Czech' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'ro', name: 'Romanian' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'et', name: 'Estonian' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'sw', name: 'Swahili' },
    { code: 'tl', name: 'Filipino' }
].sort((a, b) => a.name.localeCompare(b.name));

const QuizCreation = ({topicParam}: Props) => {
    const router = useRouter();
    const { toast } = useToast();
    const [finished, setFinished] = React.useState(false);
    const [showLoader, setShowLoader] = React.useState(false);
    
    const form = useForm<Input>({
        resolver: zodResolver(quizCreationSchema),
        defaultValues: {
            amount: 3,
            topic: topicParam || "",
            type: "mcq",
            targetLanguage: "en",
            model: "gpt-3.5-turbo",
            prompt: "You are a helpful AI that is able to generate questions and answers. Each question should be clear and complete. For MCQ, provide one correct answer and three plausible but incorrect options. For open-ended questions, mark important technical terms with [[term]] syntax.",
            apiKey: ""
        }
    });

    const {mutate: getQuestions, isPending} = useMutation({
        mutationFn: async (formData: Input) => {
            console.log("Mutation starting with model:", formData.model);
            try {
                const response = await axios.post('/api/game', formData);
                console.log("API response:", response.data);
                if (!response.data || !response.data.gameId) {
                    throw new Error('Invalid response from server');
                }
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const errorMessage = error.response?.data?.error;
                    console.error("API error:", error.response?.data);
                    
                    // Check for API key related errors
                    if (
                        error.response?.status === 401 ||
                        error.response?.status === 403 ||
                        (errorMessage && (
                            errorMessage.toLowerCase().includes('api key') ||
                            errorMessage.toLowerCase().includes('authentication')
                        ))
                    ) {
                        throw new Error('Invalid API key. Please check your API key and try again.');
                    }
                    
                    throw new Error(errorMessage || error.message || 'Failed to create quiz');
                }
                throw error;
            }
        },
        onError: (error: Error) => {
            setShowLoader(false);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
            console.error("Quiz creation error:", error);
        },
        onSuccess: (data) => {
            setFinished(true);
            setTimeout(() => {
                const gameType = form.getValues("type");
                const urlGameType = gameType === 'open_ended' ? 'open-ended' : gameType;
                router.push(`/play/${urlGameType}/${data.gameId}`);
            }, 1000);
        }
    });

    function onSubmit(input: Input) {
        console.log("Form submitted with raw input:", input);
        const formValues = form.getValues();
        console.log("Form values at submission:", formValues);
        
        // Ensure we're using the latest values
        const submissionData = {
            ...formValues,
            model: formValues.model || "gpt-3.5-turbo", // Fallback just in case
        };
        
        console.log("Final submission data:", submissionData);
        setShowLoader(true);
        getQuestions(submissionData);
    }

    if (showLoader) {
        return <LoadingQuestions finished={finished}/>;
    }

    return (
        <div>
            <Card className="w-[400px] md:w-[600px] lg:w-[800px]">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Quiz Creation</CardTitle>
                    <CardDescription>Choose a topic</CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="topic"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Topic</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter a topic..." {...field} className="text-lg" />
                                        </FormControl>
                                        <FormDescription>
                                            Please provide a topic for your quiz.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="prompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quiz Prompt</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Enter system prompt for question generation..." 
                                                className="min-h-[100px]"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Customize your quiz by writing specific instructions for how the questions should be generated.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Questions</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter an amount..."
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            You can choose up to 10 questions.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetLanguage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quiz Language</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a language" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {LANGUAGES.map((lang) => (
                                                    <SelectItem key={lang.code} value={lang.code}>
                                                        {lang.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Choose the language for your quiz questions and answers.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    form.setValue("type", "mcq");
                                                }}
                                                className="w-1/2 rounded-none rounded-l-lg"
                                                variant={field.value === "mcq" ? "default" : "secondary"}
                                            >
                                                <CopyCheck className="w-4 h-4 mr-2" /> Multiple Choice
                                            </Button>
                                            <Separator orientation="vertical" />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    form.setValue("type", "open_ended");
                                                }}
                                                className="w-1/2 rounded-none rounded-r-lg"
                                                variant={field.value === "open_ended" ? "default" : "secondary"}
                                            >
                                                <BookOpen className="w-4 h-4 mr-2" /> Open Ended
                                            </Button>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <Select 
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                            }} 
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a model" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                                <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Choose the model to generate your quiz questions. More advanced models may provide better results but could be slower.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="apiKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>API Key</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter your API key..."
                                                {...field}
                                                required
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Please provide your API key to generate quiz questions.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col gap-4">
                                <Button disabled={isPending} type="submit" className="w-full">
                                    Submit
                                </Button>
                                <ShareButton topic={form.getValues("topic")} gameId="" />
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default QuizCreation;