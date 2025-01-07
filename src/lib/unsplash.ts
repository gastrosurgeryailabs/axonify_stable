import axios from 'axios';

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

// Fallback images for different categories
const FALLBACK_IMAGES: { [key: string]: string } = {
    default: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    science: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31',
    history: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1',
    geography: 'https://images.unsplash.com/photo-1524661135-423995f22d0b',
    art: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
};

export const getTopicImage = async (topic: string): Promise<string> => {
    try {
        // Check if API key is configured
        if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'your_access_key_here') {
            console.warn('Unsplash API key not configured properly');
            return getFallbackImage(topic);
        }

        const response = await axios.get(
            `https://api.unsplash.com/search/photos`,
            {
                params: {
                    query: topic,
                    per_page: 1,
                },
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
            }
        );

        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0].urls.regular;
        }
        
        return getFallbackImage(topic);
    } catch (error) {
        console.error('Error fetching image:', error);
        return getFallbackImage(topic);
    }
};

function getFallbackImage(topic: string): string {
    // Convert topic to lowercase for matching
    const lowercaseTopic = topic.toLowerCase();
    
    // Check if the topic contains any of our category keywords
    for (const [category, url] of Object.entries(FALLBACK_IMAGES)) {
        if (lowercaseTopic.includes(category)) {
            return url;
        }
    }
    
    // Return default fallback if no category matches
    return FALLBACK_IMAGES.default;
} 