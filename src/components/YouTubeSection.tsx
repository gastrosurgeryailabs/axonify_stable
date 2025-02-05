import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface YouTubeSectionProps {
    form: UseFormReturn<any>;
}

const YouTubeSection = ({ form }: YouTubeSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = form.watch('gameId') ? 
        `https://axonify.vercel.app/play/${form.watch('type')}/${form.watch('gameId')}` 
        : '';

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.youtube.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Video Description</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your YouTube video description here. Quiz link: '${quizUrl}'`}
                                    maxLength={5000}
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
                                            const response = await axios.post('/api/social/youtube/generate-message', {
                                                topic: form.getValues("topic"),
                                                type: form.getValues("type"),
                                                userInput: field.value || "",
                                                apiKey: form.getValues("apiKey"),
                                                model: form.getValues("model"),
                                                serverUrl: form.getValues("serverUrl"),
                                                quizUrl,
                                                messageType: "direct_link"
                                            });
                                            
                                            if (response.data.success && response.data.message) {
                                                let message = response.data.message;
                                                message = message.replace(/^\*\*Description:\*\*\s*/i, '');
                                                
                                                if (message.includes("link in bio")) {
                                                    message = message.replace(
                                                        /👇\s*\*\*Click the link in our bio[^!]*!\*\*\s*👇/,
                                                        `🎯 Take the quiz now: ${quizUrl} 🎯`
                                                    );
                                                } else if (!message.includes(quizUrl)) {
                                                    message += `\n\n🎯 Test your knowledge with our interactive quiz: ${quizUrl}`;
                                                }
                                                
                                                // Ensure message is within YouTube's limit
                                                if (message.length > 5000) {
                                                    message = message.substring(0, 4997) + "...";
                                                }
                                                
                                                form.setValue("socialMedia.youtube.message", message);
                                            } else {
                                                throw new Error(response.data.error || "Failed to generate video description");
                                            }
                                        } catch (error) {
                                            console.error("YouTube description generation error:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error instanceof Error ? error.message : "Failed to generate video description. Please try again.",
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
                                        "Generate Description with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write a description for your YouTube video. The quiz link will be automatically included in the description.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

export default YouTubeSection; 