'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Download, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  actionChecklist,
  arbitrationDraft,
  evidenceRows,
} from '@/features/demo/data/dismiss-demo-data'
import { useDismissDemoStore } from '@/features/demo/state/use-dismiss-demo-store'
import { DismissDemoShell } from '@/features/demo/components/dismiss-demo-shell'

export default function DismissDemoDocumentsPage() {
  const router = useRouter()
  const { hydrated, isCompleted } = useDismissDemoStore()

  useEffect(() => {
    if (hydrated && !isCompleted) {
      router.replace('/demo/dismiss')
    }
  }, [hydrated, isCompleted, router])

  if (!hydrated || !isCompleted) {
    return null
  }

  const showDemoCopy = () => {
    window.alert('演示模式：复制功能仅展示样式，未接入真实导出。')
  }

  const showDemoDownload = () => {
    window.alert('演示模式：下载 Word 功能暂未实现。')
  }

  return (
    <DismissDemoShell
      step={4}
      title="文书生成"
      description="固定展示仲裁申请书草稿、证据目录建议与行动清单。"
      prevHref="/demo/dismiss/calculation"
      nextHref="/demo/dismiss/triage"
      nextLabel="下一步：分流转介"
    >
      <Card className="border-slate-200">
        <CardContent className="pt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={showDemoCopy}>
            <Copy className="w-4 h-4 mr-1" />
            复制全文
          </Button>
          <Button variant="outline" onClick={showDemoDownload}>
            <Download className="w-4 h-4 mr-1" />
            下载为 Word
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="application" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="application">仲裁申请书草稿</TabsTrigger>
          <TabsTrigger value="evidence">证据目录建议</TabsTrigger>
          <TabsTrigger value="checklist">行动清单</TabsTrigger>
        </TabsList>

        <TabsContent value="application" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <FileText className="w-4 h-4 text-blue-600" />
                仲裁申请书（固定演示文本）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap leading-7 text-slate-800 font-mono bg-slate-50 border border-slate-200 rounded-xl p-4">
                {arbitrationDraft}
              </pre>
              <p className="mt-4 text-sm">
                请求事项第2项：
                <strong className="text-red-600">按陕西口径，月工资基数以5,600元计算。</strong>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">证据目录建议</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="text-left px-3 py-2 border border-slate-200">序号</th>
                    <th className="text-left px-3 py-2 border border-slate-200">证据名称</th>
                    <th className="text-left px-3 py-2 border border-slate-200">证明目的</th>
                    <th className="text-left px-3 py-2 border border-slate-200">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceRows.map((row) => (
                    <tr key={row.serial} className="bg-white">
                      <td className="px-3 py-2 border border-slate-200">{row.serial}</td>
                      <td className="px-3 py-2 border border-slate-200">{row.name}</td>
                      <td className="px-3 py-2 border border-slate-200">{row.purpose}</td>
                      <td className="px-3 py-2 border border-slate-200">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">行动清单</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionChecklist.map((item, index) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 leading-6">
                  {index + 1}. {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DismissDemoShell>
  )
}
