import React from 'react'
import { prisma } from '@/lib/db'
import HotTopicsClientCard from './HotTopicsClientCard'

type Props = {}

const HotTopicsCard = async (props: Props) => {
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