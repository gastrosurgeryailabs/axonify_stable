import { getAuthSession } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import React from 'react';
import QuizMeCard from '@/components/dashboard/QuizMeCard';
import HistoryCard from '@/components/dashboard/HistoryCard';
import HotTopicCard from '../../components/dashboard/HotTopicsCard';
import RecentActivities from '@/components/dashboard/RecentActivities';

type Props = {};

export const metadata = {
  title: 'Dashboard | Axonify',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

const Dashboard = async (props: Props) => {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect('/')
  }
  return <main className='p-8 mx-auto max-w-7xl'>
    <div className='flex items-center'>
      <h2 className="mr-2 text-3xl font-bold tracking-tight">Dashboard</h2>
    </div>
    <div className="grid gap-4 mt-4 md:grid-cols-2">
      <QuizMeCard />
      <HistoryCard />
    </div>
    <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">
      <HotTopicCard />
      <RecentActivities />
    </div>
  </main>
};

export default Dashboard;