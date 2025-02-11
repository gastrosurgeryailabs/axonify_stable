import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { getQuizUrl } from '@/lib/utils';

interface InstagramSectionProps {
    form: UseFormReturn<any>;
}

const InstagramSection = ({ form }: InstagramSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = getQuizUrl(form.watch('type'), form.watch('gameId'));

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.instagram.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Post Caption</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={`Write your Instagram caption here. Quiz link: '${quizUrl}'`}
                                    maxLength={2200}
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
                                            const response = await axios.post('/api/social/instagram/generate-message', {
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
                                                message = message.replace(/^\*\*Caption:\*\*\s*/i, '');
                                                
                                                if (message.includes("link in bio")) {
                                                    message = message.replace(
                                                        /👇\s*\*\*Click the link in our bio[^!]*!\*\*\s*👇/,
                                                        `🎯 Take the quiz now: ${quizUrl} 🎯`
                                                    );
                                                } else if (!message.includes(quizUrl)) {
                                                    message += `\n\n✨ Test your knowledge: ${quizUrl}`;
                                                }
                                                
                                                // Add Instagram-style hashtags if not present
                                                if (!message.includes('#InstaLearn')) {
                                                    message += `\n\n#InstaLearn #Education #QuizTime #Learning`;
                                                }
                                                
                                                // Ensure message is within Instagram's limit
                                                if (message.length > 2200) {
                                                    message = message.substring(0, 2197) + "...";
                                                }
                                                
                                                form.setValue("socialMedia.instagram.message", message);
                                            } else {
                                                throw new Error(response.data.error || "Failed to generate caption");
                                            }
                                        } catch (error) {
                                            console.error("Instagram caption generation error:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error instanceof Error ? error.message : "Failed to generate caption. Please try again.",
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
                                        "Generate Caption with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write a caption for your Instagram post. The quiz link will be automatically included in the caption.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

export default InstagramSection; 