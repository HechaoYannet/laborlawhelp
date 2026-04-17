'use client'

import { useState, useRef, useEffect } from 'react'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic, MicOff, Send, User, Bot } from 'lucide-react'
import type { CalculationResult } from '@/lib/types'
import {
  extractConsultationInfo,
  mergeConsultationInfo,
  consultationInfoToCaseProfile,
} from '@/features/consultation/services/consultation-profile'
import { useCaseStore } from '@/hooks/use-case-store'

export default function LaborRightsConsultation() {
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [pendingResponse, setPendingResponse] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 顶部 */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <span className="text-white font-bold text-lg">法</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">劳动维权助手</h1>
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
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {/* 思考中状态 */}
          {isThinking && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm min-h-[48px]">
                {displayText ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {displayText}
                    <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Bot className="w-4 h-4" />
                    <span className="text-sm">正在思考...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题，或点击麦克风语音输入..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[48px] max-h-[120px]"
                rows={1}
              />
              {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={toggleListening}
              disabled={!isSupported}
              variant={isListening ? 'destructive' : 'outline'}
              size="icon"
              className={`h-12 w-12 rounded-xl flex-shrink-0 transition-all ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isThinking}
              className="h-12 w-12 rounded-xl flex-shrink-0 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
