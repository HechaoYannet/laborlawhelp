'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Scale,
  Shield,
  FileText,
  Calculator,
  Users,
  Building2,
  PlayCircle,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900">劳动维权助手</h1>
              <p className="text-xs text-slate-500">您的权益，我来守护</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              首页
            </Link>
            <Link href="/consultation?demo=dismiss" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              演示流程
            </Link>
            <Link href="/consultation" className="text-sm font-medium text-blue-600">
              劳动者维权
            </Link>
            <Link href="/hr-risk" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              企业HR合规
            </Link>
          </nav>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 英雄区域 */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200 px-4 py-1">
            <Scale className="w-3 h-3 mr-1" />
            专注劳动法咨询与维权服务
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            让每一位劳动者
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              都能维护自己的权益
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            我们理解您面对劳动纠纷时的无助与困惑。通过智能引导，帮您理清案情、
            测算赔偿、准备材料，让维权之路不再迷茫。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultation">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                <Scale className="w-5 h-5 mr-2" />
                我要维权
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/hr-risk">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Building2 className="w-5 h-5 mr-2" />
                企业HR合规
              </Button>
            </Link>
          </div>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* 演示卡片 */}
          <Card className="border-sky-200 bg-gradient-to-b from-sky-50 to-white hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25">
                <PlayCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">违法辞退（陕西口径演示）</CardTitle>
                <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-200">演示</Badge>
              </div>
              <CardDescription>全前端固定链路，适用于评审与合作方现场讲解</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">8步固定问诊</p>
                  <p className="text-sm text-slate-500">点击选项自动推进，完整回显</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">陕西口径测算展示</p>
                  <p className="text-sm text-slate-500">税前与到手对比一屏呈现</p>
                </div>
              </div>
              <Link href="/consultation?demo=dismiss">
                <Button className="w-full mt-4 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700">
                  进入演示流程
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 劳动者端卡片 */}
          <Card className="border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl">劳动者维权</CardTitle>
              <CardDescription>为普通劳动者提供一站式维权服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">AI案情提炼</p>
                  <p className="text-sm text-slate-500">智能引导，整理关键信息</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">赔偿计算</p>
                  <p className="text-sm text-slate-500">本地化口径，精确测算</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">文书生成</p>
                  <p className="text-sm text-slate-500">仲裁申请、证据目录等</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">律师推荐</p>
                  <p className="text-sm text-slate-500">精准匹配，专业对接</p>
                </div>
              </div>
              <Link href="/consultation">
                <Button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  开始维权咨询
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 企业HR端卡片 */}
          <Card className="border-amber-200 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl">企业HR合规</CardTitle>
              <CardDescription>为中小企业提供用工风险预警</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">录用通知留痕</p>
                  <p className="text-sm text-slate-500">规避Offer发放风险</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">试用期合规</p>
                  <p className="text-sm text-slate-500">规范试用期的评估与解除</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">离职证据留存</p>
                  <p className="text-sm text-slate-500">规范离职程序，防范纠纷</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">调岗调薪程序</p>
                  <p className="text-sm text-slate-500">合规变更劳动合同</p>
                </div>
              </div>
              <Link href="/hr-risk">
                <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  风险评估
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 适用场景 */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">适用场景</CardTitle>
              <CardDescription>覆盖常见劳动争议类型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { tag: '违法解除', desc: '被口头辞退、无故裁员' },
                { tag: '工资拖欠', desc: '拖欠工资、扣发工资' },
                { tag: '未签合同', desc: '入职未签合同、合同丢失' },
                { tag: '加班费争议', desc: '未支付加班工资' },
                { tag: '社保欠缴', desc: '未缴、少缴社保' },
                { tag: '工伤赔偿', desc: '工伤认定及待遇' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Badge variant="outline" className="bg-white">{item.tag}</Badge>
                  <span className="text-sm text-slate-600">{item.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 使用流程 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">使用流程</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: '描述情况', desc: '通过文字或语音描述您遇到的劳动问题', icon: '💬' },
              { step: 2, title: '案情分析', desc: 'AI引导您补充关键信息，整理成结构化案情卡', icon: '📋' },
              { step: 3, title: '获得方案', desc: '获得赔偿测算、文书材料、维权步骤', icon: '📝' },
              { step: 4, title: '顺利维权', desc: '按指引准备材料，提交仲裁或委托律师', icon: '✅' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-blue-500/25">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 免责声明 */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">免责声明</h3>
                <p className="text-sm text-slate-600">
                  本平台提供的服务仅供参考，不构成正式的法律意见。实际维权结果受多种因素影响，
                  包括证据完整性、仲裁员判断、地区差异等。建议在正式维权前咨询专业劳动法律师，
                  或委托律师代理复杂案件。本平台不对任何直接或间接损失承担责任。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 底部 */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-700">劳动维权助手</span>
            </div>
            <p className="text-sm text-slate-500">
              让每一位劳动者都能维护自己的合法权益
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
