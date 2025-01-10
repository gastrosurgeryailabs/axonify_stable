'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hourglass } from 'lucide-react';
import React from 'react'
import { differenceInSeconds } from 'date-fns';

type Props = {
    timeStarted: Date;
    timeEnded: string;
}

const TimeTakenCard = ({ timeStarted, timeEnded }: Props) => {
    const timeDiff = differenceInSeconds(new Date(timeEnded), new Date(timeStarted));
    const minutes = Math.floor(timeDiff / 60);
    const seconds = timeDiff % 60;

    return (
        <Card className='md:col-span-3'>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='text-2xl font-bold'>Time Taken</CardTitle>
                <Hourglass />
            </CardHeader>
            <CardContent>
                <div className='text-sm font-medium'>
                    {minutes}m {seconds}s
                </div>
            </CardContent>
        </Card>
    );
};

export default TimeTakenCard;