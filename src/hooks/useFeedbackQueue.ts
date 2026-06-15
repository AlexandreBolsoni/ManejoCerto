import { useMemo } from 'react'
import { useAppData } from './useAppData'

export function useFeedbackQueue() {
  const { feedbackQueue, saveFeedback } = useAppData()

  return useMemo(
    () => ({
      feedbackQueue,
      queuedCount: feedbackQueue.filter((item) => item.status === 'queued').length,
      saveFeedback,
    }),
    [feedbackQueue, saveFeedback],
  )
}
