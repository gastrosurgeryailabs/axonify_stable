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
import { AxiosRequestConfig } from 'axios';
import { useEffect } from 'react';

type Props = {
    topicParam: string;
}

type Input = z.infer<typeof quizCreationSchema>;

interface RequestHeaders {
    [key: string]: string;
}

interface Workspace {
    name: string;
    model: string;
    llm: {
        provider: string;
        model: string;
    };
}

interface WorkspaceResponse {
    workspaces: Array<{
        id: number;
        name: string;
        slug: string;
        chatProvider: string;
        chatModel: string;
        openAiTemp: number;
        openAiHistory: number;
        openAiPrompt: string;
    }>;
}

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

const AI_PROVIDERS = {
    openai: {
        name: "OpenAI",
        models: {
            "gpt-3.5-turbo": 16385,
            "gpt-3.5-turbo-1106": 16385,
            "gpt-4o": 128000,
            "gpt-4o-2024-08-06": 128000,
            "gpt-4o-2024-05-13": 128000,
            "gpt-4o-mini": 128000,
            "gpt-4o-mini-2024-07-18": 128000,
            "gpt-4-turbo": 128000,
            "gpt-4-1106-preview": 128000,
            "gpt-4-turbo-preview": 128000,
            "gpt-4": 8192,
            "gpt-4-32k": 32000,
            "o1-preview": 128000,
            "o1-preview-2024-09-12": 128000,
            "o1-mini": 128000,
            "o1-mini-2024-09-12": 128000
        }
    },
    ollama: {
        name: "Ollama",
        models: {
            "llama2:7b": 8192,    // Minimum 8GB RAM
            "llama2:13b": 16384,  // Minimum 16GB RAM
            "llama2:70b": 32768,  // Minimum 32GB RAM
            "mixtral:8x7b": 32768 // Minimum 32GB RAM
        }
    },
    perplexity: {
        name: "Perplexity",
        models: {
            "llama-3.1-sonar-small-128k-online": 127072,
            "llama-3.1-sonar-large-128k-online": 127072,
            "llama-3.1-sonar-huge-128k-online": 127072,
            "llama-3.1-sonar-small-128k-chat": 131072,
            "llama-3.1-sonar-large-128k-chat": 131072,
            "llama-3.1-8b-instruct": 131072,
            "llama-3.1-70b-instruct": 131072
        }
    },
    fireworks: {
        name: "Fireworks AI",
        models: {
            "accounts/fireworks/models/llama-v3p2-3b-instruct": 131072,
            "accounts/fireworks/models/llama-v3p2-1b-instruct": 131072,
            "accounts/fireworks/models/llama-v3p1-405b-instruct": 131072,
            "accounts/fireworks/models/llama-v3p1-70b-instruct": 131072,
            "accounts/fireworks/models/llama-v3p1-8b-instruct": 131072,
            "accounts/fireworks/models/llama-v3-70b-instruct": 8192
        }
    },
    together: {
        name: "Together AI",
        models: {
            "zero-one-ai/Yi-34B-Chat": 4096,
            "allenai/OLMo-7B-Instruct": 2048,
            "Austism/chronos-hermes-13b": 2048,
            "carson/ml318br": 8192,
            "cognitivecomputations/dolphin-2.5-mixtral-8x7b": 32768,
            "databricks/dbrx-instruct": 32768,
            "deepseek-ai/deepseek-llm-67b-chat": 4096,
            "deepseek-ai/deepseek-coder-33b-instruct": 16384
        }
    },
    groq: {
        name: "Groq",
        models: {
            "gemma2-9b-it": 8192,
            "gemma-7b-it": 8192,
            "llama3-70b-8192": 8192,
            "llama3-8b-8192": 8192,
            "llama-3.1-70b-versatile": 8000,
            "llama-3.1-8b-instant": 8000,
            "mixtral-8x7b-32768": 32768
        }
    },
    deepseek: {
        name: "DeepSeek",
        models: {
            "deepseek-chat": 128000,
            "deepseek-coder": 128000
        }
    },
    xai: {
        name: "xAI",
        models: {
            "grok-beta": 131072
        }
    },
    anthropic: {
        name: "Anthropic",
        models: {
            "claude-3-opus-20240229": 200000,
            "claude-3-sonnet-20240229": 200000,
            "claude-3-haiku-20240307": 200000,
            "claude-2.1": 200000,
            "claude-2.0": 100000,
            "claude-instant-1.2": 100000
        }
    }
};

const QuizCreation = ({topicParam}: Props) => {
    const router = useRouter();
    const { toast } = useToast();
    const [finished, setFinished] = React.useState(false);
    const [showLoader, setShowLoader] = React.useState(false);
    const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = React.useState(false);
    const [isCreatingWorkspace, setIsCreatingWorkspace] = React.useState(false);
    
    const form = useForm<Input>({
        resolver: zodResolver(quizCreationSchema),
        defaultValues: {
            amount: 3,
            topic: topicParam || "",
            type: "mcq",
            targetLanguage: "en",
            model: "",
            newWorkspace: undefined,
            temperature: 0.7,
            prompt: "Generate questions that are clear and engaging. For technical topics, ensure explanations are beginner-friendly. Include real-world examples where applicable.",
            apiKey: "",
            completionMessage: "Great job on completing the quiz!"
        }
    });

    // Function to fetch available workspaces
    const fetchWorkspaces = async (apiKey: string) => {
        try {
            setIsLoadingWorkspaces(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_ANYTHING_LLM_URL || 'http://localhost:3001'}/api/v1/workspaces`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to fetch workspaces: ${errorText}`);
            }

            const data = await response.json() as WorkspaceResponse;
            console.log('Fetched workspaces:', data);
            
            if (!data.workspaces || !Array.isArray(data.workspaces)) {
                throw new Error('Invalid response format from server');
            }

            // Transform the workspace data to match our expected format
            const transformedWorkspaces: Workspace[] = data.workspaces.map((workspace) => ({
                name: workspace.name,
                model: workspace.slug,
                llm: {
                    provider: workspace.chatProvider,
                    model: workspace.chatModel
                }
            }));

            console.log('Transformed workspaces:', transformedWorkspaces);
            setWorkspaces(transformedWorkspaces);
            
            // Set the first workspace as default if available
            if (transformedWorkspaces.length > 0) {
                form.setValue('model', transformedWorkspaces[0].model);
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to fetch workspaces. Please check your API key.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingWorkspaces(false);
        }
    };

    // Function to create a new workspace
    const createWorkspace = async (workspaceData: any, apiKey: string) => {
        try {
            setIsCreatingWorkspace(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_ANYTHING_LLM_URL || 'http://localhost:3001'}/api/v1/workspaces`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: workspaceData.name,
                    chatModel: workspaceData.chatModel,
                    chatProvider: workspaceData.chatProvider,
                    chatMode: workspaceData.chatMode,
                    openAiTemp: workspaceData.openAiTemp,
                    openAiHistory: workspaceData.openAiHistory,
                    openAiPrompt: workspaceData.openAiPrompt
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create workspace: ${errorText}`);
            }

            const data = await response.json();
            // Refresh workspaces list
            await fetchWorkspaces(apiKey);
            // Select the newly created workspace - use the workspace slug/model
            const workspaceModel = data.workspace?.slug || data.workspace?.id || `${data.workspace?.name.toLowerCase().replace(/\s+/g, '-')}`;
            form.setValue('model', workspaceModel);
            
            toast({
                title: "Success",
                description: "Workspace created successfully!",
            });
        } catch (error) {
            console.error('Error creating workspace:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create workspace. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsCreatingWorkspace(false);
        }
    };

    // Watch for API key changes
    const apiKey = form.watch('apiKey');
    useEffect(() => {
        if (apiKey && apiKey.length > 0) {
            fetchWorkspaces(apiKey);
        }
    }, [apiKey]);

    const {mutate: getQuestions, isPending} = useMutation({
        mutationFn: async (formData: Input) => {
            console.log("Mutation starting with workspace:", formData.model);
            try {
                const config: AxiosRequestConfig = {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };
                
                if (formData.apiKey) {
                    config.headers = {
                        ...config.headers,
                        'Authorization': `Bearer ${formData.apiKey}`
                    };
                }

                // Create the request payload with all required fields
                const payload = {
                    amount: formData.amount,
                    topic: formData.topic,
                    type: formData.type,
                    targetLanguage: formData.targetLanguage,
                    prompt: formData.prompt,
                    model: formData.model,
                    apiKey: formData.apiKey,
                    temperature: formData.temperature,
                    completionMessage: formData.completionMessage
                };

                console.log("Sending request with payload:", payload);
                const response = await axios.post('/api/game', payload, config);
                console.log("API response:", response.data);
                if (!response.data || !response.data.gameId) {
                    throw new Error('Invalid response from server');
                }
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const errorMessage = error.response?.data?.error;
                    console.error("API error:", error.response?.data);
                    
                    if (
                        error.response?.status === 401 ||
                        error.response?.status === 403 ||
                        (errorMessage && (
                            errorMessage.toLowerCase().includes('api key') ||
                            errorMessage.toLowerCase().includes('authentication')
                        ))
                    ) {
                        throw new Error('Invalid AnythingLLM API key. Please check your API key and try again.');
                    }

                    if (error.response?.status === 429 || error.response?.status === 503) {
                        throw new Error('We\'re experiencing high traffic. Please try again in a few seconds.');
                    }
                    
                    throw new Error(errorMessage || 'Failed to create quiz. Please try again in a few moments.');
                }
                throw error;
            }
        },
        onError: (error: Error) => {
            setShowLoader(false);
            toast({
                title: "Quiz Generation Failed",
                description: error.message,
                variant: "destructive",
                duration: 5000,
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

    async function onSubmit(input: Input) {
        console.log("Form submitted with raw input:", input);
        
        try {
            // If creating a new workspace
            if (input.model === 'new' && input.newWorkspace) {
                const result = await createWorkspace(input.newWorkspace, input.apiKey);
                // Wait for the workspace to be created and get its ID
                await fetchWorkspaces(input.apiKey);
                // Get the latest form values after workspace creation
                input = form.getValues();
            }

            // Ensure we have a valid model
            if (!input.model || input.model === 'new') {
                toast({
                    title: "Error",
                    description: "Please select a workspace before creating a quiz.",
                    variant: "destructive",
                });
                return;
            }

            console.log("Form values at submission:", input);
            
            // Create submission data with all required fields
            const submissionData: Input = {
                ...input,
                model: input.model,
                amount: Number(input.amount),
                temperature: Number(input.temperature),
                type: input.type,
                topic: input.topic,
                targetLanguage: input.targetLanguage,
                prompt: input.prompt,
                apiKey: input.apiKey,
                completionMessage: input.completionMessage || "Great job on completing the quiz!"
        };
        
        console.log("Final submission data:", submissionData);
        setShowLoader(true);
        getQuestions(submissionData);
        } catch (error) {
            console.error("Form submission error:", error);
            toast({
                title: "Error",
                description: "Failed to submit the form. Please try again.",
                variant: "destructive",
            });
            setShowLoader(false);
        }
    }

    if (showLoader) {
        return <LoadingQuestions finished={finished}/>;
    }

    return (
        <div className="flex justify-center items-start min-h-[calc(100vh-8rem)]">
            <Card className="w-full max-w-[800px] my-4">
                <CardHeader className="sticky top-0 bg-card z-10 border-b">
                    <CardTitle className="text-2xl font-bold">Quiz Creation</CardTitle>
                    <CardDescription>Choose a topic and workspace</CardDescription>
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
                                name="completionMessage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Completion Message</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Enter a message to show when the quiz is completed..." 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This message will be shown to the user when they complete the quiz.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quiz Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a quiz type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                                                        <SelectItem value="open_ended">Open Ended</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Select the type of questions for your quiz.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex-1">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Questions</FormLabel>
                                        <FormControl>
                                            <Input
                                                        {...field}
                                                type="number"
                                                        min={1}
                                                        max={10}
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                                        placeholder="Enter amount..."
                                            />
                                        </FormControl>
                                        <FormDescription>
                                                    Choose the number of questions (1-10).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                            <FormField
                                control={form.control}
                                name="targetLanguage"
                                render={({ field }) => (
                                    <FormItem>
                                                <FormLabel>Target Language</FormLabel>
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
                                                    Select the language for your quiz questions and answers.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="apiKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>AnythingLLM API Key</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="password"
                                                placeholder="Enter your AnythingLLM API key" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Your AnythingLLM API key for generating quiz questions. This will be used securely and not stored.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <FormField
                                        control={form.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select Model</FormLabel>
                                                <Select 
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        if (value === "new") {
                                                            form.setValue('newWorkspace', {
                                                                name: "",
                                                                chatModel: "gpt-4",
                                                                chatProvider: "openai",
                                                                chatMode: "chat",
                                                                openAiTemp: 0.7,
                                                                openAiHistory: 20,
                                                                openAiPrompt: "You are a highly knowledgeable AI assistant focused on providing accurate and detailed information."
                                                            });
                                                        } else {
                                                            form.setValue('newWorkspace', undefined);
                                                        }
                                                    }}
                                                    value={field.value}
                                                    disabled={isLoadingWorkspaces}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue 
                                                                placeholder={isLoadingWorkspaces ? "Loading models..." : "Select a model"}
                                                            >
                                                                {field.value === "new" 
                                                                    ? "+ Create New Workspace"
                                                                    : workspaces.find(w => w.model === field.value)
                                                                        ? `${workspaces.find(w => w.model === field.value)?.name} (${workspaces.find(w => w.model === field.value)?.llm.provider} / ${workspaces.find(w => w.model === field.value)?.llm.model})`
                                                                        : "Select a model"
                                                                }
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {workspaces.map((workspace) => {
                                                            // Check if the model exists in the provider's model list
                                                            const isValidModel = workspace.llm.provider in AI_PROVIDERS && 
                                                                workspace.llm.model in AI_PROVIDERS[workspace.llm.provider as keyof typeof AI_PROVIDERS].models;
                                                            
                                                            return (
                                                                <SelectItem 
                                                                    key={workspace.model} 
                                                                    value={workspace.model}
                                                                >
                                                                    {workspace.name} ({workspace.llm.provider} / {workspace.llm.model})
                                                                </SelectItem>
                                                            );
                                                        })}
                                                        <SelectItem value="new">+ Create New Workspace</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    {workspaces.length === 0 
                                                        ? "Enter your API key to see available models" 
                                                        : "Select a model or create a new workspace"}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex-1">
                                    <FormField
                                        control={form.control}
                                        name="temperature"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Temperature</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min={0}
                                                        max={1}
                                                        {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                                        placeholder="Enter temperature (0-1)..."
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Controls randomness in responses (0 = deterministic, 1 = creative).
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {form.watch('model') === 'new' && (
                                <div className="space-y-4 border rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">Create New Workspace</h3>
                                    
                                    <FormField
                                        control={form.control}
                                        name="newWorkspace.name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Workspace Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Enter workspace name..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="newWorkspace.chatProvider"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Provider</FormLabel>
                                                <Select 
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        // Reset model when provider changes
                                                        form.setValue('newWorkspace.chatModel', '');
                                                    }} 
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a provider" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                                                            <SelectItem key={key} value={key}>
                                                                {provider.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Select the AI provider for your workspace
                                                </FormDescription>
                                                <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                        name="newWorkspace.chatModel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <Select 
                                                    onValueChange={field.onChange} 
                                            value={field.value}
                                                    disabled={!form.watch('newWorkspace.chatProvider')}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a model" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                        {form.watch('newWorkspace.chatProvider') && 
                                                            Object.entries(AI_PROVIDERS[form.watch('newWorkspace.chatProvider') as keyof typeof AI_PROVIDERS].models)
                                                                .map(([modelName, contextSize]) => (
                                                                    <SelectItem key={modelName} value={modelName}>
                                                                        {modelName} ({(contextSize / 1000).toFixed(1)}k tokens)
                                                                    </SelectItem>
                                                                ))
                                                        }
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                                    Select the model to use (context window size shown in parentheses)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                                    <FormField
                                        control={form.control}
                                        name="newWorkspace.openAiTemp"
                                render={({ field }) => (
                                    <FormItem>
                                                <FormLabel>Temperature</FormLabel>
                                        <FormControl>
                                            <Input
                                                        type="number"
                                                        step="0.1"
                                                        min={0}
                                                        max={1}
                                                {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                                    <FormField
                                        control={form.control}
                                        name="newWorkspace.openAiPrompt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>System Prompt</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Enter system prompt..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        className="w-full mt-4"
                                        disabled={isCreatingWorkspace || !form.watch('newWorkspace.name') || !form.watch('newWorkspace.chatModel')}
                                        onClick={async () => {
                                            const workspaceData = form.getValues('newWorkspace');
                                            const apiKey = form.getValues('apiKey');
                                            if (workspaceData && apiKey) {
                                                await createWorkspace(workspaceData, apiKey);
                                            }
                                        }}
                                    >
                                        {isCreatingWorkspace ? "Creating Workspace..." : "Create Workspace"}
                                    </Button>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isPending || isCreatingWorkspace}
                                >
                                    {isCreatingWorkspace ? "Creating Workspace..." : "Create Quiz"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default QuizCreation;