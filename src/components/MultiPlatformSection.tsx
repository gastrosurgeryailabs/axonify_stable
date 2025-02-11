import { useState, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getQuizUrl } from '@/lib/utils';

interface MultiPlatformSectionProps {
    form: UseFormReturn<any>;
}

type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'pinterest' | 'youtube' | 'mastodon' | 'threads' | 'bluesky';

const MultiPlatformSection = ({ form }: MultiPlatformSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = getQuizUrl(form.watch('type'), form.watch('gameId'));

    // Reset all social media content
    const resetContent = useCallback(() => {
        // Reset multiplatform content
        form.setValue("socialMedia.multiplatform.message", "");

        // Reset platform-specific content
        const platforms = form.getValues("socialMedia.selectedPlatforms") as SocialPlatform[];
        platforms.forEach((platform: SocialPlatform) => {
            form.setValue(`socialMedia.${platform}.message`, "");
        });

        toast({
            title: "Content Reset",
            description: "All generated social media content has been cleared.",
            variant: "default",
        });
    }, [form, toast]);

    // Watch for quiz re-initialization
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            // Reset content when quiz is re-initialized or gameId changes
            if (name === 'initialized' || name === 'gameId') {
                resetContent();
            }
        });
        return () => subscription.unsubscribe();
    }, [form, resetContent]);

    const generatePlatformSpecificContent = async (baseMessage: string) => {
        const platforms = form.getValues("socialMedia.selectedPlatforms") as SocialPlatform[];
        const errors: string[] = [];
        const successes: string[] = [];

        // Generate content for each platform
        for (const platform of platforms) {
            try {
                const response = await axios.post(`/api/social/${platform}/generate-message`, {
                    topic: form.getValues("topic"),
                    type: form.getValues("type"),
                    userInput: baseMessage, // Use the generic message as input
                    apiKey: form.getValues("apiKey"),
                    model: form.getValues("model"),
                    serverUrl: form.getValues("serverUrl"),
                    quizUrl
                });

                if (response.data.success) {
                    // Handle different response formats and clean up markdown
                    let message = response.data.message || response.data.caption;
                    if (message) {
                        // Clean up any markdown formatting
                        message = message
                            .replace(/^\*\*[^*]+\*\*\s*/gm, '')  // Remove headers
                            .replace(/\*\*([^*]+)\*\*/g, '$1')   // Remove bold
                            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
                            .replace(/\[[^\]]+\]/g, '')          // Remove brackets
                            .replace(/\n{3,}/g, '\n\n')         // Normalize newlines
                            .trim();

                        // Ensure quiz URL is included
                        if (!message.includes(quizUrl)) {
                            message += `\n\n${quizUrl}`;
                        }

                        form.setValue(`socialMedia.${platform}.message`, message);
                        successes.push(platform);
                    } else {
                        errors.push(`${platform}: No content received`);
                    }
                } else {
                    errors.push(`${platform}: ${response.data.error}`);
                }
            } catch (error: any) {
                console.error(`Error generating ${platform} content:`, error);
                errors.push(`${platform}: ${error.response?.data?.error || error.message || 'Failed to generate content'}`);
            }
        }

        return { errors, successes };
    };

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.multiplatform.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex justify-between items-center">
                            <span>Multi-Platform Content</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={resetContent}
                                disabled={isGenerating}
                                className="h-8"
                            >
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Reset Content
                            </Button>
                        </FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your content here. It will be adapted for each selected platform. Quiz link: '${quizUrl}'`}
                                    {...field}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    disabled={isGenerating || !form.watch('initialized')}
                                    onClick={async () => {
                                        try {
                                            setIsGenerating(true);
                                            
                                            // First, generate the generic message
                                            const genericResponse = await axios.post('/api/social/multiplatform/generate-message', {
                                                topic: form.getValues("topic"),
                                                type: form.getValues("type"),
                                                userInput: field.value || "",
                                                apiKey: form.getValues("apiKey"),
                                                serverUrl: form.getValues("serverUrl"),
                                                model: form.getValues("model"),
                                                quizUrl,
                                                selectedPlatforms: form.getValues("socialMedia.selectedPlatforms")
                                            });
                                            
                                            if (genericResponse.data.success && genericResponse.data.message) {
                                                // Set the generic message
                                                form.setValue("socialMedia.multiplatform.message", genericResponse.data.message);
                                                
                                                // Generate platform-specific versions
                                                const { errors, successes } = await generatePlatformSpecificContent(genericResponse.data.message);

                                                if (errors.length > 0) {
                                                    toast({
                                                        title: errors.length === form.getValues("socialMedia.selectedPlatforms").length ? "Generation Failed" : "Partial Success",
                                                        description: errors.length === form.getValues("socialMedia.selectedPlatforms").length 
                                                            ? "Failed to generate content for all platforms: " + errors.join("; ")
                                                            : `Generated for: ${successes.join(", ")}. Failed for: ${errors.join("; ")}`,
                                                        variant: "destructive",
                                                    });
                                                } else {
                                                    toast({
                                                        title: "Success",
                                                        description: `Generated content for: ${successes.join(", ")}`,
                                                        variant: "default",
                                                    });
                                                }
                                            } else {
                                                throw new Error(genericResponse.data.error || "Failed to generate generic message");
                                            }
                                        } catch (error: any) {
                                            console.error("Error generating content:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error.response?.data?.error || error.message || "Failed to generate content. Please try again.",
                                                variant: "destructive",
                                            });
                                        } finally {
                                            setIsGenerating(false);
                                        }
                                    }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate Content with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write content that will work across all selected platforms. The AI will help create platform-specific versions below.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Platform-Specific Messages Section */}
            {form.watch("socialMedia.selectedPlatforms")?.length > 0 && (
                <div className="space-y-4 mt-8">
                    <h4 className="text-sm font-medium">Platform-Specific Messages</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        {form.watch("socialMedia.selectedPlatforms").map((platform: string) => (
                            <Card key={platform}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium capitalize">
                                        {platform} Version
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name={`socialMedia.${platform}.message`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={`${platform} specific content will appear here`}
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MultiPlatformSection; 