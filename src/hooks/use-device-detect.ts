'use client'

import { useState, useEffect } from 'react'

export function useDeviceDetect() {
  const [isWideScreen, setIsWideScreen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [isCompactLandscape, setIsCompactLandscape] = useState(false)

  useEffect(() => {
    const wideQuery = window.matchMedia('(min-width: 1280px)')
    const landscapeQuery = window.matchMedia('(orientation: landscape)')
    const compactLandscapeQuery = window.matchMedia('(orientation: landscape) and (max-height: 560px)')

    const syncDeviceState = () => {
      setIsWideScreen(wideQuery.matches)
      setIsLandscape(landscapeQuery.matches)
      setIsCompactLandscape(compactLandscapeQuery.matches)
    }

    syncDeviceState()
    wideQuery.addEventListener('change', syncDeviceState)
    landscapeQuery.addEventListener('change', syncDeviceState)
    compactLandscapeQuery.addEventListener('change', syncDeviceState)

    return () => {
      wideQuery.removeEventListener('change', syncDeviceState)
      landscapeQuery.removeEventListener('change', syncDeviceState)
      compactLandscapeQuery.removeEventListener('change', syncDeviceState)
    }
  }, [])

  return { isWideScreen, isLandscape, isCompactLandscape }
}
