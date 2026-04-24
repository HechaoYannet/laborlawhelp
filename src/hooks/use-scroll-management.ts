'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DialogueMessage } from '@/lib/types'
import type { SessionToolEvent } from '@/hooks/use-case-store'

export type FollowMode = 'none' | 'bottom' | 'streaming'

interface ScrollMetrics {
  top: number
  bottom: number
  height: number
}

interface BubbleMetrics {
  bubbleBottomVisible: boolean
  bubbleBottomInObservationBand: boolean
  desiredScrollTop: number
}

export function useScrollManagement({
  isThinking,
  displayText,
  messages,
  toolEvents,
  isWideScreen,
  isLandscape,
  isCompactLandscape,
  composerHeight,
  scrollContainerRef,
  streamingBubbleRef,
  messagesEndRef,
  followModeRef,
  shouldFollowStreamingBubbleRef,
  isNearBottomRef,
  programmaticScrollUntilRef,
  userScrollHoldUntilRef,
  lastMessageCountRef,
  lastToolEventCountRef,
  scrollContainerTo,
  getEffectiveViewportBounds,
  getStreamingBubbleMetrics,
  followStreamingBubble,
}: {
  isThinking: boolean
  displayText: string
  messages: DialogueMessage[]
  toolEvents: SessionToolEvent[]
  isWideScreen: boolean
  isLandscape: boolean
  isCompactLandscape: boolean
  composerHeight: number
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  streamingBubbleRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  followModeRef: React.MutableRefObject<FollowMode>
  shouldFollowStreamingBubbleRef: React.MutableRefObject<boolean>
  isNearBottomRef: React.MutableRefObject<boolean>
  programmaticScrollUntilRef: React.MutableRefObject<number>
  userScrollHoldUntilRef: React.MutableRefObject<number>
  lastMessageCountRef: React.MutableRefObject<number>
  lastToolEventCountRef: React.MutableRefObject<number>
  scrollContainerTo: (top: number, behavior?: ScrollBehavior) => void
  getEffectiveViewportBounds: (container: HTMLDivElement) => ScrollMetrics
  getStreamingBubbleMetrics: (container: HTMLDivElement, bubble: HTMLDivElement) => BubbleMetrics
  followStreamingBubble: (behavior?: ScrollBehavior) => boolean
}) {
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // 自动滚动到底部
  useEffect(() => {
    isNearBottomRef.current = isNearBottom
  }, [isNearBottom, isNearBottomRef])

  useEffect(() => {
    const hasNewMessage = messages.length > lastMessageCountRef.current
    const hasNewToolEvent = toolEvents.length > lastToolEventCountRef.current

    if ((hasNewMessage || hasNewToolEvent) && isNearBottomRef.current) {
      followModeRef.current = 'bottom'
      shouldFollowStreamingBubbleRef.current = hasNewMessage && isThinking
      userScrollHoldUntilRef.current = 0

      const container = scrollContainerRef.current
      if (container) {
        programmaticScrollUntilRef.current = Date.now() + 240
        container.scrollTo({ top: container.scrollHeight - container.clientHeight, behavior: 'smooth' })
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    lastMessageCountRef.current = messages.length
    lastToolEventCountRef.current = toolEvents.length
  }, [
    isThinking,
    messages.length,
    toolEvents.length,
    followModeRef,
    shouldFollowStreamingBubbleRef,
    userScrollHoldUntilRef,
    scrollContainerRef,
    programmaticScrollUntilRef,
    messagesEndRef,
    isNearBottomRef,
    lastMessageCountRef,
    lastToolEventCountRef,
  ])

  // 控制"一键到底"按钮显隐规则
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const cancelFollowOnUserIntent = () => {
      // 程序化滚动期间忽略用户事件误触
      if (Date.now() < programmaticScrollUntilRef.current) return
      // 打断正在进行的平滑滚动动画，让用户操控立即生效
      const c = scrollContainerRef.current
      if (c) {
        c.scrollTo({ top: c.scrollTop, behavior: 'auto' })
      }
      followModeRef.current = 'none'
      shouldFollowStreamingBubbleRef.current = false
      userScrollHoldUntilRef.current = Date.now() + 300
    }

    const updateScrollButtonState = () => {
      const hiddenThreshold = isCompactLandscape ? 50 : isLandscape ? 90 : 120
      const showThreshold = isCompactLandscape ? 140 : isLandscape ? 220 : 300
      const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const hasEnoughMessages = messages.length > 3
      const nearBottom = distanceToBottom <= hiddenThreshold

      // 程序化滚动期间，不修改跟随状态
      if (Date.now() < programmaticScrollUntilRef.current) {
        setIsNearBottom(nearBottom)
        isNearBottomRef.current = nearBottom
        if (nearBottom) {
          setUnreadCount(0)
        }
        return
      }

      const isUserHoldActive = Date.now() < userScrollHoldUntilRef.current

      setIsNearBottom(nearBottom)
      isNearBottomRef.current = nearBottom
      if (nearBottom && !isUserHoldActive) {
        followModeRef.current = isThinking ? 'streaming' : 'bottom'
        shouldFollowStreamingBubbleRef.current = isThinking
      } else if (followModeRef.current === 'bottom') {
        followModeRef.current = 'none'
        shouldFollowStreamingBubbleRef.current = false
      }

      if (isThinking && streamingBubbleRef.current && !isUserHoldActive) {
        const { bubbleBottomVisible, bubbleBottomInObservationBand } = getStreamingBubbleMetrics(
          container,
          streamingBubbleRef.current,
        )

        if (!nearBottom && bubbleBottomInObservationBand) {
          followModeRef.current = 'streaming'
          shouldFollowStreamingBubbleRef.current = true
        } else if (!nearBottom && !bubbleBottomVisible && followModeRef.current !== 'bottom') {
          followModeRef.current = 'none'
          shouldFollowStreamingBubbleRef.current = false
        }
      }

      if (nearBottom) {
        setUnreadCount(0)
      }

      if (!hasEnoughMessages) {
        setShowScrollToBottom(false)
        return
      }

      if (distanceToBottom > showThreshold || unreadCount > 0) {
        setShowScrollToBottom(true)
      } else if (nearBottom) {
        setShowScrollToBottom(false)
      }
    }

    container.addEventListener('wheel', cancelFollowOnUserIntent, { passive: true })
    container.addEventListener('touchmove', cancelFollowOnUserIntent, { passive: true })
    container.addEventListener('scroll', updateScrollButtonState)
    updateScrollButtonState()
    return () => {
      container.removeEventListener('wheel', cancelFollowOnUserIntent)
      container.removeEventListener('touchmove', cancelFollowOnUserIntent)
      container.removeEventListener('scroll', updateScrollButtonState)
    }
  }, [
    getStreamingBubbleMetrics,
    isThinking,
    messages.length,
    isLandscape,
    isCompactLandscape,
    unreadCount,
    scrollContainerRef,
    streamingBubbleRef,
    followModeRef,
    shouldFollowStreamingBubbleRef,
    isNearBottomRef,
    programmaticScrollUntilRef,
    userScrollHoldUntilRef,
  ])

  // 未读消息计数（未在底部时新增消息累加）
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && !isNearBottom) {
      setUnreadCount((count) => count + (messages.length - lastMessageCountRef.current))
    }
  }, [messages.length, isNearBottom, lastMessageCountRef])

  // 流式内容变化时跟随气泡：displayText 变化 + ResizeObserver 双重保障
  useEffect(() => {
    if (!isThinking || !displayText) return

    const container = scrollContainerRef.current
    const bubble = streamingBubbleRef.current
    if (!container || !bubble) return

    if (followModeRef.current === 'streaming' || (followModeRef.current === 'bottom' && isNearBottomRef.current)) {
      shouldFollowStreamingBubbleRef.current = true
      followModeRef.current = 'streaming'
      followStreamingBubble('smooth')
      return
    }

    if (Date.now() < userScrollHoldUntilRef.current) {
      return
    }

    const { bubbleBottomInObservationBand } = getStreamingBubbleMetrics(container, bubble)
    if (bubbleBottomInObservationBand) {
      followModeRef.current = 'streaming'
      shouldFollowStreamingBubbleRef.current = true
      followStreamingBubble('smooth')
    }
  }, [
    displayText,
    followStreamingBubble,
    getStreamingBubbleMetrics,
    isThinking,
    scrollContainerRef,
    streamingBubbleRef,
    followModeRef,
    shouldFollowStreamingBubbleRef,
    isNearBottomRef,
    userScrollHoldUntilRef,
  ])

  // 流式气泡 DOM 尺寸变化时即时跟随（绕过 React 批次延迟）
  useEffect(() => {
    const bubble = streamingBubbleRef.current
    if (!bubble || !isThinking) return

    // 气泡刚出现时落底一次
    const container = scrollContainerRef.current
    if (container) {
      const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      if (distanceToBottom > 0) {
        followModeRef.current = 'streaming'
        shouldFollowStreamingBubbleRef.current = true
        followStreamingBubble('instant' as ScrollBehavior)
      }
    }

    const ro = new ResizeObserver(() => {
      if (shouldFollowStreamingBubbleRef.current && followModeRef.current !== 'none') {
        followStreamingBubble('instant' as ScrollBehavior)
      }
    })
    ro.observe(bubble)

    return () => ro.disconnect()
  }, [
    isThinking,
    followStreamingBubble,
    scrollContainerRef,
    streamingBubbleRef,
    followModeRef,
    shouldFollowStreamingBubbleRef,
  ])

  const scrollToBottom = useCallback(() => {
    followModeRef.current = isThinking ? 'streaming' : 'bottom'
    shouldFollowStreamingBubbleRef.current = isThinking
    userScrollHoldUntilRef.current = 0
    const container = scrollContainerRef.current
    if (container) {
      scrollContainerTo(container.scrollHeight - container.clientHeight, 'smooth')
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    setUnreadCount(0)
  }, [
    isThinking,
    followModeRef,
    shouldFollowStreamingBubbleRef,
    userScrollHoldUntilRef,
    scrollContainerRef,
    scrollContainerTo,
    messagesEndRef,
  ])

  return {
    isNearBottom,
    showScrollToBottom,
    unreadCount,
    scrollToBottom,
  }
}
