'use client';

import { getTopicImage } from '@/lib/unsplash';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

type Props = {
    topic: string;
};

const TopicImage = ({ topic }: Props) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                setLoading(true);
                setError(false);
                const url = await getTopicImage(topic);
                setImageUrl(url);
            } catch (e) {
                console.error('Error in TopicImage:', e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [topic]);

    if (loading) {
        return (
            <div className="w-full h-32 sm:h-40 md:h-48 bg-slate-200 animate-pulse rounded-lg">
                <div className="flex items-center justify-center h-full text-slate-500">
                    Loading image...
                </div>
            </div>
        );
    }

    if (error) {
        return null;
    }

    return (
        <div className="relative w-full h-32 sm:h-40 md:h-48 mt-4 overflow-hidden rounded-lg">
            <Image
                src={imageUrl}
                alt={`Image related to ${topic}`}
                fill
                className="object-cover transition-opacity duration-300 hover:opacity-90"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 1200px"
            />
        </div>
    );
};

export default TopicImage; 