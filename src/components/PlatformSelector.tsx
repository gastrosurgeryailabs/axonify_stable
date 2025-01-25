import { FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { UseFormReturn } from "react-hook-form";

interface PlatformSelectorProps {
    form: UseFormReturn<any>;
}

const PlatformSelector = ({ form }: PlatformSelectorProps) => {
    return (
        <FormField
            control={form.control}
            name="socialMedia.selectedPlatform"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Select Platform</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a social media platform" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="twitter">Twitter/X</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="pinterest">Pinterest</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="mastodon">Mastodon</SelectItem>
                            <SelectItem value="threads">Threads</SelectItem>
                            <SelectItem value="bluesky">Bluesky</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )}
        />
    );
};

export default PlatformSelector; 