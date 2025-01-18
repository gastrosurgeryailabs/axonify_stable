import { getAuthSession } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import React from 'react';
import QuizMeCard from '@/components/dashboard/QuizMeCard';
import HistoryCard from '@/components/dashboard/HistoryCard';
import HotTopicCard from '../../components/dashboard/HotTopicsCard';
import CompanyDetailsCard from '@/components/dashboard/CompanyDetailsCard';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, HeartPulse } from 'lucide-react';
import Image from 'next/image';

const ADMIN_EMAILS = ['abhaychopada@gmail.com', 'dnyanesh.tech001@gmail.com'];

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

  const isAdmin = session.user.email && ADMIN_EMAILS.includes(session.user.email);

  return (
    <main className='min-h-screen bg-gray-50/50 dark:bg-gray-950'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header Section with Welcome Message */}
        <div className='flex flex-col items-center justify-center mb-16'>
          <div className="flex items-center gap-6 mb-6">
            <HeartPulse className="w-8 h-8 text-gray-700 dark:text-gray-300" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {isAdmin ? "Admin Dashboard" : "Welcome to AxonCare"}
            </h2>
          </div>
          {!isAdmin && (
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl text-lg">
              Your trusted healthcare learning platform
            </p>
          )}
        </div>

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="grid gap-4 mt-4 md:grid-cols-2">
              <QuizMeCard />
              <HistoryCard />
            </div>
            <div className="mt-4">
              <HotTopicCard />
            </div>
          </>
        )}

        {/* Regular user section */}
        {!isAdmin && (
          <div className="flex flex-col items-center gap-12">
            {/* Assessment History Card */}
            <div className="w-full max-w-5xl group">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-900">
                <CardContent className='p-0'>
                  {/* History Header Section */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 p-12 relative overflow-hidden">
                    {/* Decorative Pattern */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.03),transparent)] opacity-100"></div>
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/50 to-transparent"></div>
                    
                    <div className="relative">
                      <div className="flex items-center justify-center mb-6">
                        <Clock className="w-10 h-10 mr-4 text-gray-600" />
                        <h2 className="text-3xl font-bold text-center tracking-tight text-gray-800">Assessment History</h2>
                      </div>
                      <p className="text-base text-center text-gray-600 max-w-[600px] mx-auto leading-relaxed">
                        Track your healthcare learning progress and review your past assessment results
                      </p>
                    </div>
                  </div>

                  {/* History Content Section */}
                  <div className="p-10 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-900">
                    <HistoryCard />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* About Section */}
            <div className="w-full max-w-5xl group">
              <CompanyDetailsCard />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;