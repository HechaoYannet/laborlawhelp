'use client'

import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'

export function useComposer({
  isWideScreen,
  isCompactLandscape,
  inputValue,
}: {
  isWideScreen: boolean
  isCompactLandscape: boolean
  inputValue: string
}) {
  const [composerHeight, setComposerHeight] = useState(140)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const composerRef = useRef<HTMLDivElement>(null)
  const desktopInputRef = useRef<HTMLTextAreaElement>(null)
  const mobileInputRef = useRef<HTMLTextAreaElement>(null)

  const resizeTextarea = useCallback((element?: HTMLTextAreaElement | null) => {
    const target = element ?? desktopInputRef.current ?? mobileInputRef.current
    if (!target) return

    const maxHeight = isWideScreen ? 260 : isCompactLandscape ? 132 : 180
    target.style.height = 'auto'
    const nextHeight = Math.min(target.scrollHeight, maxHeight)
    target.style.height = `${nextHeight}px`
    target.style.overflowY = target.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [isCompactLandscape, isWideScreen])

  const resizeAllTextareas = useCallback(() => {
    resizeTextarea(desktopInputRef.current)
    resizeTextarea(mobileInputRef.current)
  }, [resizeTextarea])

  // 输入框自动高度（达到上限后显示滚动条）
  useLayoutEffect(() => {
    resizeAllTextareas()
  }, [inputValue, isCompactLandscape, isWideScreen, resizeAllTextareas])

  // 监听输入卡片高度，动态留白避免消息与输入区重叠
  useEffect(() => {
    const composer = composerRef.current
    if (!composer) return

    const syncComposerHeight = () => {
      const rect = composer.getBoundingClientRect()
      setComposerHeight(Math.ceil(rect.height))
    }

    syncComposerHeight()
    const observer = new ResizeObserver(syncComposerHeight)
    observer.observe(composer)
    window.addEventListener('resize', syncComposerHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncComposerHeight)
    }
  }, [])

  // 软键盘弹起时抬升输入卡片，防止被遮挡
  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) return

    const syncKeyboardInset = () => {
      const rawInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      const isLikelyKeyboard = rawInset > 70
      setKeyboardInset(isLikelyKeyboard ? rawInset : 0)
    }

    syncKeyboardInset()
    vv.addEventListener('resize', syncKeyboardInset)
    vv.addEventListener('scroll', syncKeyboardInset)

    return () => {
      vv.removeEventListener('resize', syncKeyboardInset)
      vv.removeEventListener('scroll', syncKeyboardInset)
    }
  }, [])

  return {
    composerHeight,
    keyboardInset,
    composerRef,
    desktopInputRef,
    mobileInputRef,
    resizeTextarea,
    resizeAllTextareas,
  }
}
