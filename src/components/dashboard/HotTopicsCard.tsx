import React from 'react'
import { prisma } from '@/lib/db'
import HotTopicsClientCard from './HotTopicsClientCard'
import { getAuthSession } from '@/lib/nextauth'

const ADMIN_EMAILS = ['abhaychopada@gmail.com', 'dnyanesh.tech001@gmail.com', 'gastrosurgeryai@gmail.com'];

type Props = {}

const HotTopicsCard = async (props: Props) => {
  const session = await getAuthSession();
  
  // If user is not an admin, don't render the card
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return null;
  }

  const topics = await prisma.topic_count.findMany({})
  const formattedTopics = topics.map(topic => {
    return {
      text: topic.topic,
      value: topic.count
    }
  })
  
  return <HotTopicsClientCard formattedTopics={formattedTopics} />
}

export default HotTopicsCard;