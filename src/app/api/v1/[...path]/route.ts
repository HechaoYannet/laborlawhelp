import type { NextRequest } from 'next/server'

const INTERNAL_API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

function getMiddlewareBaseUrl() {
  const configured =
    process.env.MIDDLEND_BASE_URL ||
    process.env.MIDDLEWARE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MIDDLEND_BASE_URL ||
    process.env.NEXT_PUBLIC_MIDDLEWARE_API_BASE_URL

  return (configured || INTERNAL_API_BASE_URL).replace(/\/$/, '')
}

function buildTargetUrl(request: NextRequest, path: string[]) {
  const target = new URL(`${getMiddlewareBaseUrl()}/${path.join('/')}`)

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value)
  })

  return target
}

function copyHeaders(request: NextRequest) {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (
      lowerKey === 'host' ||
      lowerKey === 'connection' ||
      lowerKey === 'content-length' ||
      lowerKey === 'transfer-encoding'
    ) {
      return
    }

    headers.set(key, value)
  })

  return headers
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const targetUrl = buildTargetUrl(request, path)
  const headers = copyHeaders(request)

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.text(),
    redirect: 'manual',
  })

  const responseHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (
      lowerKey === 'content-length' ||
      lowerKey === 'transfer-encoding' ||
      lowerKey === 'content-encoding'
    ) {
      return
    }
    responseHeaders.set(key, value)
  })

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context)
}
