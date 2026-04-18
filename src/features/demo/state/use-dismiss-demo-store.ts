'use client'

import { useEffect, useMemo, useState } from 'react'
import { demoQuestions, presetAnswers } from '@/features/demo/data/dismiss-demo-data'

const STORAGE_KEY = 'dismiss-demo-state-v1'

interface DismissDemoState {
  answers: number[]
}

const initialState: DismissDemoState = {
  answers: [],
}

function readState(): DismissDemoState {
  if (typeof window === 'undefined') {
    return initialState
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return initialState
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DismissDemoState>
    const answers = Array.isArray(parsed.answers)
      ? parsed.answers.filter((value) => Number.isInteger(value) && value >= 0)
      : []

    return { answers }
  } catch {
    return initialState
  }
}

export function useDismissDemoStore() {
  const [state, setState] = useState<DismissDemoState>(initialState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(readState())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [hydrated, state])

  const currentQuestionIndex = state.answers.length
  const totalQuestions = demoQuestions.length
  const isCompleted = state.answers.length >= totalQuestions

  const answeredPairs = useMemo(() => {
    return state.answers
      .map((answerIndex, questionIndex) => {
        const question = demoQuestions[questionIndex]
        if (!question) {
          return null
        }

        const option = question.options[answerIndex] ?? '未选择'
        return {
          questionId: question.id,
          question: question.question,
          answerIndex,
          answer: option,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  }, [state.answers])

  const selectAnswer = (answerIndex: number) => {
    setState((previous) => {
      if (previous.answers.length >= totalQuestions) {
        return previous
      }

      return {
        ...previous,
        answers: [...previous.answers, answerIndex],
      }
    })
  }

  const resetDemo = () => {
    setState(initialState)
  }

  const fillPresetAnswers = () => {
    setState({ answers: presetAnswers })
  }

  return {
    hydrated,
    answers: state.answers,
    answeredPairs,
    currentQuestionIndex,
    totalQuestions,
    isCompleted,
    selectAnswer,
    resetDemo,
    fillPresetAnswers,
  }
}
