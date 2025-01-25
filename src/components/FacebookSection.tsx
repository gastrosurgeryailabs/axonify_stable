import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface FacebookSectionProps {
    form: UseFormReturn<any>;
}

const FacebookSection = ({ form }: FacebookSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const quizUrl = form.watch('gameId') ? 
        `https://axonify.vercel.app/play/${form.watch('type')}/${form.watch('gameId')}` 
        : '';

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
                                <Textarea
                                    placeholder={`Write your Facebook post here. Quiz link: '${quizUrl}'`}
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
                                                quizUrl,
                                                messageType: "direct_link"
                                            });
                                            
                                            if (response.data.message) {
                                                let message = response.data.message;
                                                // Remove any prefix like "Message:" if present
                                                message = message.replace(/^\*\*Message:\*\*\s*/i, '');
                                                
                                                // Ensure quiz URL is included
                                                if (!message.includes(quizUrl)) {
                                                    message += `\n\n🎯 Take the challenge here: ${quizUrl}`;
                                                }
                                                
                                                form.setValue("socialMedia.facebook.message", message);
                                            }
                                        } catch (error) {
                                            toast({
                                                title: "Generation Failed",
                                                description: "Failed to generate post message. Please try again.",
                                                variant: "destructive",
                                            });
                                        } finally {
                                            setIsGenerating(false);
                                        }
                                    }}
                                >
                                    {isGenerating ? "Generating..." : "Generate Post with AI"}
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