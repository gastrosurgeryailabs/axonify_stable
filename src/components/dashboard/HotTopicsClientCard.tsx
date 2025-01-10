'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'
import dynamic from 'next/dynamic'

const CustomWordCloud = dynamic(() => import('@/components/CustomWordCloud'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[550px]">Loading word cloud...</div>
})

type Props = {
  formattedTopics: {
    text: string;
    value: number;
  }[];
}

const HotTopicsClientCard = ({ formattedTopics }: Props) => {
  return (
    <Card className='col-span-4'>
        <CardHeader>
            <CardTitle className='text-2xl font-bold'>Hot Topics</CardTitle>
            <CardDescription>
                Click on a topic to start a quiz on it!
            </CardDescription>
        </CardHeader>
        <CardContent className='pl-2'>
            <CustomWordCloud formattedTopics={formattedTopics}/>
        </CardContent>
    </Card>
  )
}

export default HotTopicsClientCard; 