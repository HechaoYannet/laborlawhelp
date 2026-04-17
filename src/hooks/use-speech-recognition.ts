'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// Speech Recognition types
interface ISpeechRecognitionEvent extends Event {
  results: ISpeechRecognitionResultList
  resultIndex: number
}

interface ISpeechRecognitionResultList {
  length: number
  item(index: number): ISpeechRecognitionResult
  [index: number]: ISpeechRecognitionResult
}

interface ISpeechRecognitionResult {
  length: number
  item(index: number): ISpeechRecognitionAlternative
  [index: number]: ISpeechRecognitionAlternative
  isFinal: boolean
}

interface ISpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface IWindow {
  SpeechRecognition: new () => ISpeechRecognition
  webkitSpeechRecognition: new () => ISpeechRecognition
}

interface UseSpeechRecognitionReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const isProcessingRef = useRef(false)

  useEffect(() => {
    // Check browser support
    const hasSupport = typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(hasSupport)

    if (!hasSupport) return

    // Get Speech Recognition API
    const win = window as unknown as IWindow
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition
    
    if (!SpeechRecognitionCtor) return

    const recognition: ISpeechRecognition = new SpeechRecognitionCtor()

    // Configure - 启用连续模式，支持长时间录音
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      finalTranscriptRef.current = ''
      isProcessingRef.current = false
    }

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      // 防止重复处理
      if (isProcessingRef.current) return
      
      let finalTranscript = ''
      let interimTranscript = ''

      // 只处理最新的一批结果
      const results = event.results
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      // 如果有最终结果，更新 transcript
      if (finalTranscript) {
        isProcessingRef.current = true
        finalTranscriptRef.current = finalTranscript
        setTranscript(finalTranscript)
      } else if (interimTranscript) {
        // 中间结果也显示，但不作为最终结果
        setTranscript(interimTranscript)
      }
    }

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setError(getErrorMessage(event.error))
      setIsListening(false)
      isProcessingRef.current = false
    }

    recognition.onend = () => {
      setIsListening(false)
      isProcessingRef.current = false
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('语音识别暂不可用，请检查浏览器权限设置')
      return
    }

    try {
      // 如果已经在运行，直接返回
      if (isListening) {
        return
      }
      
      // 重置状态
      setTranscript('')
      finalTranscriptRef.current = ''
      isProcessingRef.current = false
      setError(null)
      
      recognitionRef.current.start()
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError('启动语音识别失败')
    }
  }, [isSupported, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    finalTranscriptRef.current = ''
  }, [])

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'permission-denied':
      return '请允许麦克风权限后重试'
    case 'no-speech':
      return '未检测到语音，请重试'
    case 'network':
      return '网络错误，请检查网络连接'
    case 'audio-capture':
      return '未检测到麦克风设备'
    default:
      return '语音识别出错，请重试'
  }
}
