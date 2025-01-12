import HistoryComponent from '@/components/HistoryComponent'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuthSession } from '@/lib/nextauth'
import { LucideLayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

const HistoryPage = async () => {
  const session = await getAuthSession()
  if (!session?.user) {
    return redirect('/')
  }
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-[400px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className='text-2xl font-bold'>History</CardTitle>
              <Link href='/dashboard' className={buttonVariants()}>
                <LucideLayoutDashboard className='mr-2'/>
                Back to Dashboard
              </Link>
            </div>
          </CardHeader>
          <CardContent className='max-h-[60vh] overflow-y-auto'>
            <HistoryComponent limit={100} userId={session.user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default HistoryPage;