import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { getQuizUrl } from '@/utils/quizUrl';
import { TextareaWithActions } from "./ui/textarea-with-actions";

interface FacebookSectionProps {
    form: UseFormReturn<any>;
}

const FacebookSection = ({ form }: FacebookSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = getQuizUrl(form.watch('type'), form.watch('gameId'));

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="socialMedia.facebook.message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Post Message</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <TextareaWithActions
                                    placeholder={`Write your Facebook post here. Quiz link: '${quizUrl}'`}
                                    title="Facebook Post"
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
                                            const response = await axios.post('/api/social/facebook/generate-message', {
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
                                                // Remove any prefix like "Message:" if present
                                                message = message.replace(/^\*\*Message:\*\*\s*/i, '');
                                                
                                                // Ensure quiz URL is included
                                                if (!message.includes(quizUrl)) {
                                                    message += `\n\n🎯 Take the challenge here: ${quizUrl}`;
                                                }
                                                
                                                form.setValue("socialMedia.facebook.message", message);
                                            } else {
                                                throw new Error(response.data.error || "Failed to generate post message");
                                            }
                                        } catch (error) {
                                            console.error("Facebook post generation error:", error);
                                            toast({
                                                title: "Generation Failed",
                                                description: error instanceof Error ? error.message : "Failed to generate post message. Please try again.",
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
                                        "Generate Post with AI"
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormDescription>
                            Write a message for your Facebook post. The quiz link will be automatically included in the post.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export default FacebookSection; 