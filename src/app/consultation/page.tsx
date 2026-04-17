'use client'

import { useState, useRef, useEffect } from 'react'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Send, User, Bot, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { CalculationResult } from '@/lib/types'
import {
  extractConsultationInfo,
  mergeConsultationInfo,
  consultationInfoToCaseProfile,
} from '@/features/consultation/services/consultation-profile'
import { useCaseStore } from '@/hooks/use-case-store'
import type { PanelImperativeHandle } from 'react-resizable-panels'

export default function LaborRightsConsultation() {
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [pendingResponse, setPendingResponse] = useState<string | null>(null)
  const [isWideScreen, setIsWideScreen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [isCompactLandscape, setIsCompactLandscape] = useState(false)
  const [composerHeight, setComposerHeight] = useState(140)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [summaryCopied, setSummaryCopied] = useState(false)
  const [packageCopied, setPackageCopied] = useState(false)

  const {
    messages,
    addMessage,
    clearMessages,
    updateExtractedInfo,
    consultationInfo,
    setConsultationInfo,
    resetConsultationInfo,
    resetExtractedInfo,
  } = useCaseStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null)
  const lastMessageCountRef = useRef(0)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition()

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayText])

  const resizeTextarea = (element?: HTMLTextAreaElement) => {
    const target = element ?? inputRef.current
    if (!target) return

    const maxHeight = isWideScreen ? 260 : isCompactLandscape ? 132 : 180
    target.style.height = 'auto'
    const nextHeight = Math.min(target.scrollHeight, maxHeight)
    target.style.height = `${nextHeight}px`
    target.style.overflowY = target.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  // 输入框自动高度（达到上限后显示滚动条）
  useEffect(() => {
    resizeTextarea()
  }, [inputValue, isWideScreen, isCompactLandscape])

  // 大屏与横屏状态
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

  // 控制“一键到底”按钮显隐规则
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateScrollButtonState = () => {
      const hiddenThreshold = isCompactLandscape ? 50 : isLandscape ? 90 : 120
      const showThreshold = isCompactLandscape ? 140 : isLandscape ? 220 : 300
      const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const hasEnoughMessages = messages.length > 3
      const nearBottom = distanceToBottom <= hiddenThreshold

      setIsNearBottom(nearBottom)
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

    container.addEventListener('scroll', updateScrollButtonState)
    updateScrollButtonState()
    return () => container.removeEventListener('scroll', updateScrollButtonState)
  }, [messages.length, isLandscape, isCompactLandscape, unreadCount])

  // 未读消息计数（未在底部时新增消息累加）
  useEffect(() => {
    if (lastMessageCountRef.current === 0) {
      lastMessageCountRef.current = messages.length
      return
    }

    if (messages.length > lastMessageCountRef.current && !isNearBottom) {
      setUnreadCount((count) => count + (messages.length - lastMessageCountRef.current))
    }

    lastMessageCountRef.current = messages.length
  }, [messages.length, isNearBottom])

  // 打字机效果
  useEffect(() => {
    if (!pendingResponse) return
    
    const text = pendingResponse
    let index = 0
    setDisplayText('')
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(typeInterval)
        setIsThinking(false)
        setDisplayText('')
        setPendingResponse(null)
        addMessage({ role: 'assistant', content: text })
      }
    }, 30)

    return () => clearInterval(typeInterval)
  }, [addMessage, pendingResponse])

  // 语音输入同步到输入框
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript)
    }
  }, [transcript])

  // 初始化问候语
  useEffect(() => {
    clearMessages()
    resetExtractedInfo()
    resetConsultationInfo()
    addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
  }, [addMessage, clearMessages, resetExtractedInfo, resetConsultationInfo])

  // 提取信息
  // 生成回复
  const getAssistantResponse = async (userMessage: string): Promise<string> => {
    // 合并历史消息分析
    const allText = [...messages.map(m => m.content), userMessage].join('\n')
    const lower = allText.toLowerCase()
    
    // 提取信息
    const newInfo = extractConsultationInfo(userMessage)
    
    // 合并到已收集信息
    const info = mergeConsultationInfo(consultationInfo, newInfo)
    setConsultationInfo(info)
    updateExtractedInfo(consultationInfoToCaseProfile(info))

    // 检测是否在描述劳动纠纷
    const isDescribingDispute = /辞|开|不用来|被辞|被开|辞退|裁员|开除/.test(lower)
    const isFirstResponse = messages.length === 1

    // 检测是否在问赔偿
    const isAskingCompensation = /赔偿|补偿|能拿.*少|多少钱|赔.*少/.test(lower)
    const isAskingProcess = /怎么|如何|步骤|流程|需要.*什么|准备.*什么/.test(lower)
    const isAskingLawyer = /律师|找.*人|需要.*请.*律师/.test(lower)

    // 如果用户在问赔偿或流程 - 直接生成计算
    if (isAskingCompensation || isAskingProcess) {
      if (info.entryDate || info.wage) {
        const { calculateCompensation } = await import('@/lib/calculation')
        const calculation: CalculationResult = calculateCompensation(consultationInfoToCaseProfile(info))
        
        return `根据您说的情况，我帮您按西安本地口径做初步测算：

**赔偿项目：**
${calculation.items.filter((i) => i.amount > 0).map((i) => `• ${i.name}：约 ${i.amount.toLocaleString()} 元`).join('\n')}

**合计：约 ${calculation.totalAmount.toLocaleString()} 元**

> 注：以上为系统初步测算，最终以仲裁裁决为准。

${isAskingProcess ? `

**维权基本流程：**
1. 准备材料：身份证、公司工商信息、证据清单
2. 去公司注册地的劳动仲裁委提交申请
3. 等待仲裁委受理和开庭通知
4. 按时参加庭审

**时间提醒：** 仲裁时效1年，从被辞退之日起算。

请问还有什么要了解的吗？` : ''}`
      }
    }

    // 如果用户在问律师
    if (isAskingLawyer) {
      const { evaluateCaseComplexity, recommendLawyers } = await import('@/lib/case-triage')
      const triageResult = evaluateCaseComplexity(consultationInfoToCaseProfile(info))
      recommendLawyers(consultationInfoToCaseProfile(info))

      let suggestion = ''
      if (triageResult.complexity === 'simple') {
        suggestion = '您的案件相对简单，也可以尝试自己处理。但如果担心应对不好，委托律师会更稳妥。'
      } else {
        suggestion = '您的案件有一定复杂度，建议委托专业律师处理。'
      }

      return `${suggestion}

我们平台可以为您推荐西安本地擅长劳动争议的律师，根据您的案件类型精准匹配。需要我帮您推荐吗？`
    }

    // 如果是第一次回复
    if (isFirstResponse) {
      // 检测用户情绪
      const isAngry = /气|怒|恨|不公平|凭什么|委屈|无助/.test(lower)
      
      let greeting = ''
      if (isAngry || isDescribingDispute) {
        greeting = `您好，特别理解您现在又委屈又生气的心情，被突然辞退换谁都会觉得无助。别着急，我会一步步帮您理清楚情况。`
      } else {
        greeting = `您好，我来帮您理清情况。`
      }

      // 如果用户已经描述了很多信息，先确认并追问
      const infoCount = [info.entryDate, info.wage, info.terminationMethod, info.evidence.length > 0, info.previousAction].filter(Boolean).length

      if (infoCount >= 3) {
        // 用户已说很多，确认并补充
        const { calculateCompensation, generateCaseSummary } = await Promise.all([
          import('@/lib/calculation'),
          import('@/lib/dialogue-flow')
        ]).then(m => ({ calculateCompensation: m[0].calculateCompensation, generateCaseSummary: m[1].generateCaseSummary }))

        generateCaseSummary(consultationInfoToCaseProfile(info))
        const calc: CalculationResult = calculateCompensation(consultationInfoToCaseProfile(info))

        return `${greeting}

我帮您整理一下您说的情况：
${info.entryDate ? `• 入职时间：${info.entryDate}` : ''}
${info.wage ? `• 月工资：约${info.wage}元` : ''}
${info.terminationMethod ? `• 辞退方式：${info.terminationMethod === 'verbal' ? '口头' : '书面'}` : ''}
${info.terminationReason ? `• 辞退理由：${info.terminationReason}` : ''}
${info.contract ? `• 合同情况：${info.contract === 'signed' ? '已签' : info.contract === 'lost' ? '签了但找不到' : '未签'}` : ''}
${info.evidence.length > 0 ? `• 您有的证据：${info.evidence.join('、')}` : ''}

按西安口径初步测算，可主张赔偿约 **${calc.totalAmount.toLocaleString()} 元**。

请问还有什么需要补充的吗？比如社保情况、有没有加班费没发这些？`
      }

      // 追问缺失信息
      const questions: string[] = []
      if (!info.entryDate) questions.push('您是什么时候入职的？')
      if (!info.wage) questions.push('您每个月到手工资大概多少？')
      if (!info.terminationMethod) questions.push('他们是口头还是书面通知您的？')
      if (info.terminationMethod && !info.terminationReason) questions.push('有没有说辞退您的理由？')
      if (info.evidence.length === 0) questions.push('您手里有哪些证据？比如工资流水、聊天记录这些？')

      if (questions.length > 0) {
        return `${greeting}\n\n请告诉我：${questions.join('、')}？`
      }
    }

    // 后续对话 - 继续追问缺失信息
    const { calculateCompensation, generateCaseSummary } = await Promise.all([
      import('@/lib/calculation'),
      import('@/lib/dialogue-flow')
    ]).then(m => ({ calculateCompensation: m[0].calculateCompensation, generateCaseSummary: m[1].generateCaseSummary }))

    // 确认本次提供的信息
    const confirmation: string[] = []
    if (newInfo.entryDate) confirmation.push(`入职时间${newInfo.entryDate}`)
    if (newInfo.wage) confirmation.push(`工资${newInfo.wage}元`)
    if (newInfo.terminationMethod) confirmation.push(`辞退方式${newInfo.terminationMethod === 'verbal' ? '口头' : '书面'}`)
    if (newInfo.terminationReason) confirmation.push(`理由${newInfo.terminationReason}`)
    if (newInfo.contract) confirmation.push(`合同${newInfo.contract === 'signed' ? '已签' : newInfo.contract === 'lost' ? '签了但找不到' : '未签'}`)
    if (newInfo.evidence.length > 0) confirmation.push(`证据${newInfo.evidence.join('、')}`)
    if (newInfo.previousAction) confirmation.push(`维权进度${newInfo.previousAction === 'none' ? '未采取任何行动' : newInfo.previousAction === 'negotiation' ? '曾协商' : '已仲裁'}`)

    const confirmText = confirmation.length > 0 ? `好的，我记下了：${confirmation.join('、')}。` : ''

    // 检查还缺什么
    const missing: string[] = []
    if (!info.entryDate && !newInfo.entryDate) missing.push('入职时间')
    if (!info.wage && !newInfo.wage) missing.push('工资')
    if (!info.terminationMethod && !newInfo.terminationMethod) missing.push('辞退方式')
    if (!info.evidence.length && !newInfo.evidence.length) missing.push('证据')
    if (!info.previousAction && !newInfo.previousAction) missing.push('维权进度')

    // 如果信息足够，生成总结
    if (info.entryDate && info.wage && info.terminationMethod && (info.evidence.length > 0 || info.previousAction)) {
      const summary = generateCaseSummary(consultationInfoToCaseProfile(info))
      const calc: CalculationResult = calculateCompensation(consultationInfoToCaseProfile(info))

      return `${confirmText}

我帮您整理一下：
${summary}

按西安口径初步测算，可主张赔偿约 **${calc.totalAmount.toLocaleString()} 元**。

> 注：以上为系统初步测算，最终以仲裁裁决为准，不替代律师复核。

**建议：**
• 先整理好手头的证据（工资流水、聊天记录等）
• 去社保部门打印缴费记录
• 带着材料去公司注册地的劳动仲裁委提交申请
• 注意仲裁时效是1年，从被辞退之日起算

请问还有什么要了解的吗？`
    }

    // 继续追问
    return `${confirmText}${missing.length > 0 ? `\n\n请再告诉我：${missing.join('、')}？` : '\n\n请继续说，还有什么情况？'}`
  }

  // 发送消息
  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || isThinking) return

    addMessage({ role: 'user', content })
    setInputValue('')
    requestAnimationFrame(() => {
      resizeTextarea()
    })
    setIsThinking(true)

    try {
      const response = await getAssistantResponse(content)
      setPendingResponse(response)
    } catch (error) {
      console.error('Error:', error)
      setIsThinking(false)
    }
  }

  // 语音切换
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // 键盘发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUnreadCount(0)
  }

  const toggleDesktopSidebar = () => {
    if (sidebarPanelRef.current?.isCollapsed()) {
      sidebarPanelRef.current.expand()
      return
    }

    sidebarPanelRef.current?.collapse()
  }

  const copySidebarSummary = async () => {
    const exportText = [
      '案件摘要',
      conversationSummary,
      '',
      '关键内容',
      ...keyFacts.map((item) => `- ${item}`),
      '',
      '案件时间线',
      ...timelineItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      '证据与材料待办',
      ...checklistItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      `流程状态：${processStage.label} - ${processStage.hint}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(exportText)
      setSummaryCopied(true)
      window.setTimeout(() => setSummaryCopied(false), 1600)
    } catch (error) {
      console.error('Failed to copy summary:', error)
    }
  }

  const copyArbitrationPackage = async () => {
    const packageText = [
      '仲裁材料包',
      `案件状态：${processStage.label}`,
      '',
      '案件摘要',
      conversationSummary,
      '',
      '关键事实',
      ...keyFacts.map((item) => `- ${item}`),
      '',
      '时间线',
      ...timelineItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      '建议准备材料',
      '- 身份证复印件',
      '- 劳动合同或入职证明',
      '- 工资流水或薪资证明',
      '- 聊天记录、邮件、录音等沟通证据',
      '- 考勤、工牌、工作安排截图',
      '- 离职通知或辞退说明',
      consultationInfo.evidence.length > 0
        ? `- 当前已记录证据：${consultationInfo.evidence.join('、')}`
        : '- 当前证据尚需补齐',
      '',
      '待办清单',
      ...checklistItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      `流程指导：${processStage.hint}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(packageText)
      setPackageCopied(true)
      window.setTimeout(() => setPackageCopied(false), 1600)
    } catch (error) {
      console.error('Failed to copy arbitration package:', error)
    }
  }

  const headerClass = isCompactLandscape ? 'px-3 py-2.5' : 'px-4 py-3 md:px-6 md:py-4'
  const contentMaxWidth = isWideScreen ? 'max-w-4xl' : 'max-w-3xl'
  const bubbleTextClass = isCompactLandscape ? 'text-[13px] leading-5' : 'text-sm leading-relaxed'
  const bubblePaddingClass = isCompactLandscape ? 'px-3 py-2.5' : 'px-4 py-3'
  const avatarClass = isCompactLandscape ? 'w-7 h-7' : 'w-8 h-8'
  const buttonSizeClass = isCompactLandscape ? 'h-9 w-9' : 'h-10 w-10 md:h-11 md:w-11'
  const baseBottomClass = isCompactLandscape ? 'bottom-1.5' : isLandscape ? 'bottom-2' : 'bottom-3 md:bottom-4'
  const keyboardLiftClass =
    keyboardInset > 360
      ? '-translate-y-[22rem]'
      : keyboardInset > 300
        ? '-translate-y-[18rem]'
        : keyboardInset > 240
          ? '-translate-y-[14rem]'
          : keyboardInset > 160
            ? '-translate-y-[10rem]'
            : keyboardInset > 80
              ? '-translate-y-[6rem]'
              : 'translate-y-0'
  const scrollPaddingClass = isCompactLandscape
    ? 'pb-40'
    : composerHeight > 250
      ? 'pb-[25rem] md:pb-[22rem]'
      : composerHeight > 210
        ? 'pb-[22rem] md:pb-[20rem]'
        : 'pb-[19rem] md:pb-[17rem]'
  const showUnreadBadge = unreadCount > 0

  const renderConversation = (layout: 'mobile' | 'desktop') => {
    const gapClass = layout === 'desktop' ? 'gap-4' : isCompactLandscape ? 'gap-2' : 'gap-3'
    const messageWidthClass = layout === 'desktop' ? 'max-w-[72%]' : isWideScreen ? 'max-w-[62%]' : 'max-w-[82%]'
    const avatarSizeClass = layout === 'desktop' ? 'w-9 h-9' : avatarClass
    const assistantIconClass = layout === 'desktop' ? 'w-4.5 h-4.5' : isCompactLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4'
    const textClass = layout === 'desktop' ? 'text-[15px] leading-7' : bubbleTextClass
    const bubbleClass = layout === 'desktop' ? 'px-5 py-4' : bubblePaddingClass
    const thinkingTextClass = layout === 'desktop' ? 'text-sm' : isCompactLandscape ? 'text-xs' : 'text-sm'

    return (
      <>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${gapClass} ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className={`${avatarSizeClass} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}>
                <Bot className={`${assistantIconClass} text-blue-600`} />
              </div>
            )}
            <div
              className={`${messageWidthClass} rounded-2xl ${bubbleClass} ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
              }`}
            >
              <p className={`${textClass} whitespace-pre-wrap`}>{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className={`${avatarSizeClass} rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0`}>
                <User className={`${assistantIconClass} text-slate-600`} />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className={`flex ${gapClass} justify-start`}>
            <div className={`${avatarSizeClass} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}>
              <Bot className={`${assistantIconClass} text-blue-600`} />
            </div>
            <div className={`bg-white border border-slate-200 rounded-2xl rounded-tl-sm ${bubbleClass} shadow-sm min-h-[44px]`}>
              {displayText ? (
                <p className={`${textClass} whitespace-pre-wrap`}>
                  {displayText}
                  <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
                </p>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Bot className={`${assistantIconClass}`} />
                  <span className={thinkingTextClass}>正在思考...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </>
    )
  }

  const collectedFieldCount = [
    consultationInfo.entryDate,
    consultationInfo.wage,
    consultationInfo.terminationMethod,
    consultationInfo.terminationReason,
    consultationInfo.contract,
    consultationInfo.evidence.length > 0,
    consultationInfo.previousAction,
  ].filter(Boolean).length

  const desktopMissingItems = [
    !consultationInfo.entryDate ? '入职时间' : null,
    !consultationInfo.wage ? '月工资' : null,
    !consultationInfo.terminationMethod ? '辞退方式' : null,
    !consultationInfo.evidence.length ? '证据' : null,
  ].filter((item): item is string => item !== null)

  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')

  const summarizeText = (text: string) => {
    const compactText = text.replace(/\s+/g, ' ').trim()
    if (compactText.length <= 96) return compactText
    return `${compactText.slice(0, 96)}...`
  }

  const conversationSummary = latestAssistantMessage
    ? summarizeText(latestAssistantMessage.content)
    : '等待系统生成会话总结。'

  const processStage = (() => {
    if (!consultationInfo.entryDate || !consultationInfo.wage || !consultationInfo.terminationMethod) {
      return {
        label: '信息收集中',
        hint: '继续补充入职时间、工资和辞退方式。',
      }
    }

    if (!consultationInfo.evidence.length) {
      return {
        label: '证据整理中',
        hint: '补齐证据后更适合进入赔偿测算。',
      }
    }

    if (!consultationInfo.previousAction) {
      return {
        label: '维权进度待确认',
        hint: '说明是否协商、仲裁过，便于判断下一步。',
      }
    }

    return {
      label: '可进入测算与方案',
      hint: '现在可以继续问赔偿、流程或律师建议。',
    }
  })()

  const keyFacts = [
    consultationInfo.entryDate ? `入职：${consultationInfo.entryDate}` : '入职时间未补充',
    consultationInfo.wage ? `工资：约 ${consultationInfo.wage} 元` : '工资未补充',
    consultationInfo.terminationMethod
      ? `辞退：${consultationInfo.terminationMethod === 'verbal' ? '口头通知' : '书面通知'}`
      : '辞退方式未补充',
    consultationInfo.evidence.length > 0 ? `证据：${consultationInfo.evidence.join('、')}` : '证据未补充',
  ]

  const timelineItems = [
    {
      title: '当前提问',
      detail: latestUserMessage ? summarizeText(latestUserMessage.content) : '等待新的问题输入。',
      active: true,
    },
    {
      title: '入职时间',
      detail: consultationInfo.entryDate ? `已识别 ${consultationInfo.entryDate}` : '待补充入职时间。',
      active: Boolean(consultationInfo.entryDate),
    },
    {
      title: '辞退/离职',
      detail: consultationInfo.terminationMethod
        ? consultationInfo.terminationMethod === 'verbal'
          ? '已识别口头通知。'
          : '已识别书面通知。'
        : '待补充辞退方式。',
      active: Boolean(consultationInfo.terminationMethod),
    },
    {
      title: '证据情况',
      detail: consultationInfo.evidence.length > 0 ? `${consultationInfo.evidence.length} 项证据已记录。` : '待补充证据。',
      active: consultationInfo.evidence.length > 0,
    },
    {
      title: '维权进度',
      detail: consultationInfo.previousAction
        ? consultationInfo.previousAction === 'none'
          ? '尚未采取行动。'
          : consultationInfo.previousAction === 'negotiation'
            ? '已进入协商阶段。'
            : '已进入仲裁阶段。'
        : '待确认目前进度。',
      active: Boolean(consultationInfo.previousAction),
    },
  ]

  const checklistItems = [
    {
      title: '补充入职时间',
      detail: consultationInfo.entryDate ? `已记录 ${consultationInfo.entryDate}` : '建议明确到年月，便于计算在职时长。',
      done: Boolean(consultationInfo.entryDate),
    },
    {
      title: '确认月工资',
      detail: consultationInfo.wage ? `已记录约 ${consultationInfo.wage} 元` : '建议确认到手工资和工资结构。',
      done: Boolean(consultationInfo.wage),
    },
    {
      title: '整理证据材料',
      detail: consultationInfo.evidence.length > 0 ? `已记录 ${consultationInfo.evidence.length} 项证据` : '建议优先准备工资流水、聊天记录、考勤等。',
      done: consultationInfo.evidence.length > 0,
    },
    {
      title: '说明维权进度',
      detail: consultationInfo.previousAction
        ? consultationInfo.previousAction === 'none'
          ? '尚未采取行动。'
          : consultationInfo.previousAction === 'negotiation'
            ? '已协商过。'
            : '已进入仲裁。'
        : '建议说明是否找过公司、劳动监察或仲裁。',
      done: Boolean(consultationInfo.previousAction),
    },
  ]

  const hasMeaningfulInfo = collectedFieldCount > 0 || Boolean(latestUserMessage)

  return (
    <>
      <div className="hidden h-dvh lg:block bg-slate-50 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="h-dvh w-full">
          <ResizablePanel
            panelRef={sidebarPanelRef}
            collapsible
            collapsedSize="72px"
            defaultSize="28%"
            minSize="18%"
            maxSize="42%"
            onResize={(panelSize) => setIsSidebarCollapsed(panelSize.asPercentage <= 6)}
            className="min-w-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white"
          >
            <div className="flex h-full flex-col border-r border-white/10">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
                <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <span className="text-lg font-semibold">法</span>
                  </div>
                  {!isSidebarCollapsed && (
                    <div>
                      <h1 className="text-lg font-semibold tracking-wide">劳动维权助手</h1>
                      <p className="mt-1 text-xs text-slate-300">西安地区 · 桌面咨询模式</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={toggleDesktopSidebar}
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  aria-label={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                  {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {isSidebarCollapsed ? (
                  <div className="flex h-full flex-col items-center justify-between py-4 text-center">
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">
                        {processStage.label}
                      </div>
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <span className="text-2xl font-semibold text-white">{collectedFieldCount}</span>
                        <span className="text-[11px] uppercase tracking-[0.25em]">facts</span>
                      </div>
                    </div>

                    <Button
                      onClick={toggleDesktopSidebar}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      aria-label="展开侧边栏"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {!hasMeaningfulInfo && (
                      <>
                        <div className="rounded-3xl border border-sky-300/30 bg-sky-500/10 p-5 shadow-xl shadow-black/10">
                          <p className="text-sm font-medium text-slate-100">开始咨询引导</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">
                            你可以先描述劳动关系、工资、辞退方式。输入后我会自动提炼关键信息并生成流程建议。
                          </p>
                        </div>

                        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                          <p className="text-sm font-medium text-slate-100">建议优先补充</p>
                          <div className="space-y-2 text-sm text-slate-300">
                            <div className="rounded-2xl bg-white/5 px-4 py-3">1. 入职时间（例：2022年3月）</div>
                            <div className="rounded-2xl bg-white/5 px-4 py-3">2. 月工资（例：到手 8000 元）</div>
                            <div className="rounded-2xl bg-white/5 px-4 py-3">3. 辞退方式（口头/书面/突然不让上班）</div>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                          <p className="text-sm font-medium text-slate-100">可直接发送示例</p>
                          <div className="space-y-2 text-sm leading-6 text-slate-300">
                            <div className="rounded-2xl bg-white/5 px-4 py-3">我 2023 年 2 月入职，月工资 9000，今天被口头辞退，能主张哪些赔偿？</div>
                            <div className="rounded-2xl bg-white/5 px-4 py-3">我有工资流水和聊天记录，下一步仲裁流程怎么走？</div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">案件进度</p>
                      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                        <div>
                          <p className="text-xs text-slate-300">已采集信息</p>
                          <p className="mt-1 text-2xl font-semibold text-white">{collectedFieldCount}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200 ring-1 ring-emerald-400/20">
                          {processStage.label}
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-300">{processStage.hint}</p>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">会话总结</p>
                        <Button
                          onClick={copySidebarSummary}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-white/15 bg-white/5 px-3 text-xs text-white hover:bg-white/10 hover:text-white"
                        >
                          {summaryCopied ? '已复制' : '复制摘要'}
                        </Button>
                      </div>
                      <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
                        {conversationSummary}
                      </p>
                      <div className="rounded-2xl bg-black/10 px-4 py-3 text-xs leading-6 text-slate-300">
                        最新诉求：{latestUserMessage ? summarizeText(latestUserMessage.content) : '等待用户输入。'}
                      </div>
                      <div className="rounded-2xl bg-black/10 px-4 py-3 text-xs leading-6 text-slate-300">
                        最新输出：{latestAssistantMessage ? summarizeText(latestAssistantMessage.content) : '等待系统回复。'}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">案件时间线</p>
                      <div className="space-y-3">
                        {timelineItems.map((item, index) => (
                          <div key={item.title} className="flex gap-3">
                            <div className="flex flex-col items-center pt-1">
                              <span
                                className={`h-3 w-3 rounded-full ${
                                  item.active ? 'bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-white/20'
                                }`}
                              />
                              {index < timelineItems.length - 1 && <span className="mt-2 h-full w-px bg-white/10" />}
                            </div>
                            <div className="flex-1 rounded-2xl bg-white/5 px-4 py-3">
                              <p className="text-sm font-medium text-slate-100">{item.title}</p>
                              <p className="mt-1 text-xs leading-6 text-slate-300">{item.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">证据与材料待办</p>
                      <div className="space-y-2">
                        {checklistItems.map((item) => (
                          <div
                            key={item.title}
                            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                              item.done ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.done ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-inherit">{item.title}</p>
                                <p className="mt-1 text-xs leading-6 text-inherit/80">{item.detail}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">仲裁材料包</p>
                        <Button
                          onClick={copyArbitrationPackage}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-white/15 bg-white/5 px-3 text-xs text-white hover:bg-white/10 hover:text-white"
                        >
                          {packageCopied ? '已复制' : '复制材料包'}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm leading-6 text-slate-300">
                        <div className="rounded-2xl bg-white/5 px-4 py-3">一键汇总摘要、关键事实、时间线与待办清单。</div>
                        <div className="rounded-2xl bg-white/5 px-4 py-3">可直接发给律师，或作为仲裁申请前的准备稿。</div>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">关键内容</p>
                      <div className="space-y-2 text-sm text-slate-300">
                        {keyFacts.map((item) => (
                          <div key={item} className="rounded-2xl bg-white/5 px-4 py-3 leading-6">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">流程状态指导</p>
                      <div className="space-y-2 text-sm text-slate-300 leading-6">
                        {desktopMissingItems.length > 0 ? (
                          desktopMissingItems.map((item) => (
                            <div key={item} className="rounded-2xl bg-white/5 px-4 py-3">
                              请补充：{item}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
                            关键信息较完整，可以继续问赔偿、流程或律师建议。
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">推荐动作</p>
                      <div className="space-y-2 text-sm text-slate-300 leading-6">
                        <div className="rounded-2xl bg-white/5 px-4 py-3">补齐证据后，先看赔偿测算。</div>
                        <div className="rounded-2xl bg-white/5 px-4 py-3">确认仲裁时效，尽量不要拖延。</div>
                        <div className="rounded-2xl bg-white/5 px-4 py-3">复杂案件优先评估是否需要律师。</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isSidebarCollapsed && (
                <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-400">
                  本平台提供的信息仅供参考，不构成正式法律意见。
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-2 bg-slate-200/60 transition-colors hover:bg-blue-200/70" />

          <ResizablePanel defaultSize="72%" minSize="58%" className="min-w-0">
            <section className="flex h-full min-w-0 flex-col bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_36%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))]">
              <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/75 px-8 py-5 shadow-sm backdrop-blur-md">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">劳动维权咨询</h2>
                  <p className="mt-1 text-sm text-slate-500">桌面端专用布局 · 可拖拽侧边栏 · 动态会话摘要</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  在线咨询
                </div>
              </header>

              <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto overscroll-contain px-8 py-6 pb-8">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                  {renderConversation('desktop')}
                </div>

                <div
                  className={`pointer-events-none absolute right-8 bottom-32 transition-all duration-300 ease-out ${
                    showScrollToBottom ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-2 opacity-0'
                  }`}
                >
                  <div className="relative pointer-events-auto">
                    <Button
                      onClick={scrollToBottom}
                      size="icon"
                      className="h-11 w-11 rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50"
                      aria-label="一键到底"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                    {showUnreadBadge && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-blue-600 px-1 text-center text-[11px] leading-5 text-white shadow">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/80 bg-white/90 px-8 py-5 shadow-[0_-20px_50px_rgba(15,23,42,0.08)] backdrop-blur-md">
                <div ref={composerRef} className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                    <div className="space-y-3">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value)
                          resizeTextarea(e.currentTarget)
                        }}
                        onKeyDown={handleKeyDown}
                        onInput={(e) => resizeTextarea(e.currentTarget)}
                        placeholder="输入您的问题，按 Enter 发送，Shift+Enter 换行"
                        className="min-h-[84px] max-h-[180px] w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>输入框会自动增高，超过限制后支持内部滚动。</span>
                        {isListening && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-red-600">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            正在语音识别
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={toggleListening}
                        disabled={!isSupported}
                        variant={isListening ? 'destructive' : 'outline'}
                        size="icon"
                        className={`h-11 w-11 rounded-full transition-all ${
                          isListening ? 'border-red-500 bg-red-500 text-white hover:bg-red-600' : 'bg-white'
                        }`}
                      >
                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>

                      <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isThinking}
                        size="icon"
                        className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex flex-col h-dvh bg-gradient-to-b from-slate-50 to-white overflow-hidden lg:hidden">
      {/* 顶部 */}
      <header className={`flex items-center justify-between ${headerClass} bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`${isCompactLandscape ? 'w-8 h-8' : 'w-9 h-9 md:w-10 md:h-10'} rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center`}>
            <span className={`${isCompactLandscape ? 'text-sm' : 'text-base md:text-lg'} text-white font-bold`}>法</span>
          </div>
          <div>
            <h1 className={`${isCompactLandscape ? 'text-sm' : 'text-base md:text-lg'} font-semibold text-slate-800`}>劳动维权助手</h1>
            <p className="text-xs text-slate-500">西安地区 · 智能咨询</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
            在线
          </span>
        </div>
      </header>

      {/* 消息区域 */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto overscroll-contain px-3 md:px-5 ${isCompactLandscape ? 'py-3' : 'py-5 md:py-6'} ${scrollPaddingClass}`}
      >
        <div className={`mx-auto ${isCompactLandscape ? 'space-y-3' : 'space-y-4'} ${contentMaxWidth}`}>
          {renderConversation('mobile')}
        </div>
      </div>

      {/* 底部悬浮交互层（按钮与输入卡联动） */}
      <div className={`fixed left-0 right-0 z-40 px-3 md:px-5 pointer-events-none ${baseBottomClass} ${keyboardLiftClass} transition-transform duration-300 ease-out`}>
        <div className={`mx-auto ${contentMaxWidth}`}>
          <div className={`flex flex-col items-end ${isCompactLandscape ? 'gap-2' : 'gap-2.5 md:gap-3'}`}>
            <div className={`relative z-10 transition-all duration-300 ease-out ${
              showScrollToBottom ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}>
              <Button
                onClick={scrollToBottom}
                size="icon"
                className={`${isCompactLandscape ? 'h-9 w-9' : 'h-10 w-10'} rounded-full bg-white text-slate-600 border border-slate-200 shadow-lg hover:bg-slate-50`}
                aria-label="一键到底"
              >
                <ChevronDown className={isCompactLandscape ? 'h-4 w-4' : 'h-5 w-5'} />
              </Button>
              {showUnreadBadge && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] leading-5 px-1 text-center shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <div ref={composerRef} className={`w-full pointer-events-auto relative rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md ${isCompactLandscape ? 'px-2.5 py-2.5' : 'px-3 py-3 md:px-4 md:py-4'} shadow-xl shadow-slate-300/40`}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                resizeTextarea(e.currentTarget)
              }}
              onKeyDown={handleKeyDown}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              placeholder="输入您的问题，或点击麦克风语音输入..."
              className={`w-full resize-none rounded-xl border border-slate-300 bg-slate-50 ${isCompactLandscape ? 'px-3 py-2.5 text-[13px] leading-5 min-h-[44px] max-h-[130px]' : 'px-4 py-3 text-sm md:text-base leading-6 min-h-[56px] max-h-[220px]'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              rows={1}
            />

            <div className={`mt-2 flex items-center justify-end ${isCompactLandscape ? 'gap-1.5' : 'gap-2'}`}>
              {isListening && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              <Button
                onClick={toggleListening}
                disabled={!isSupported}
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                className={`${buttonSizeClass} rounded-full transition-all ${
                  isListening ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'bg-white'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>

              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking}
                size="icon"
                className={`${buttonSizeClass} rounded-full bg-blue-600 hover:bg-blue-700`}
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
