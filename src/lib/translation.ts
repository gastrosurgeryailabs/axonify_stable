import axios from 'axios';

const TRANSLATE_API_URL = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text: string, targetLanguage: string): Promise<string> {
    try {
        const params = new URLSearchParams({
            client: 'gtx',
            sl: 'auto',
            tl: targetLanguage,
            dt: 't',
            q: text
        });

        const response = await axios.get(`${TRANSLATE_API_URL}?${params}`);
        
        // The response structure is different from the API version
        // It returns an array where the first element contains the translations
        const translations = response.data[0];
        if (!translations || !Array.isArray(translations)) {
            throw new Error('Invalid translation response');
        }

        // Combine all translated parts
        const translatedText = translations
            .map(t => t[0])
            .filter(Boolean)
            .join(' ');

        return translatedText || text;
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Return original text if translation fails
    }
}

export async function translateQuizContent(content: any, targetLanguage: string) {
    if (targetLanguage === 'en') return content; // Skip translation if target is English

    if (Array.isArray(content)) {
        return Promise.all(content.map(async (item) => {
            const translatedItem = { ...item };
            
            // Translate question
            translatedItem.question = await translateText(item.question, targetLanguage);
            
            // Translate answer
            translatedItem.answer = await translateText(item.answer, targetLanguage);
            
            // Translate options for MCQ
            if (item.option1) {
                translatedItem.option1 = await translateText(item.option1, targetLanguage);
                translatedItem.option2 = await translateText(item.option2, targetLanguage);
                translatedItem.option3 = await translateText(item.option3, targetLanguage);
            }
            
            return translatedItem;
        }));
    }
    
    return content;
} 