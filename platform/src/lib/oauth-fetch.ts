// OAuth 出网请求的容错封装：单次超时 + 网络层重试。
// GitHub 从国内服务器访问时会出现间歇性连接超时、TLS 重置，
// 单次抖动会直接让一次登录失败，因此在这里统一做短重试。

const RETRYABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
  'UND_ERR_CLOSED',
])

interface ResilientFetchOptions {
  // 单次请求超时时间，默认 10 秒
  timeoutMs?: number
  // 总尝试次数（含首次），默认 2 次
  attempts?: number
}

// 只有网络层失败才重试；HTTP 4xx/5xx 属于上游明确响应，重试没有意义。
// 自己触发的超时只对幂等请求（GET/HEAD）重试，避免授权码被重复消费。
function isRetryableNetworkError(error: unknown, method: string): boolean {
  if (!(error instanceof Error)) return false

  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return method === 'GET' || method === 'HEAD'
  }

  if (error.name === 'TypeError' && error.message === 'fetch failed') {
    const cause = error.cause as { code?: unknown } | undefined
    return typeof cause?.code === 'string' ? RETRYABLE_NETWORK_CODES.has(cause.code) : true
  }

  return false
}

export function createResilientFetch({
  timeoutMs = 10_000,
  attempts = 2,
}: ResilientFetchOptions = {}): typeof fetch {
  return async (input, init) => {
    const method = (init?.method ?? 'GET').toUpperCase()
    let lastError: unknown

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      if (init?.signal?.aborted) throw init.signal.reason

      const controller = new AbortController()
      const timer = setTimeout(
        () => controller.abort(new DOMException('OAuth request timeout', 'TimeoutError')),
        timeoutMs
      )
      // 保留调用方自己的取消信号（如框架超时）
      const abortFromCaller = () => controller.abort(init?.signal?.reason)
      init?.signal?.addEventListener('abort', abortFromCaller, { once: true })

      try {
        return await fetch(input, { ...init, signal: controller.signal })
      } catch (error) {
        lastError = error
        if (attempt >= attempts || !isRetryableNetworkError(error, method)) throw error
        await new Promise((resolve) => setTimeout(resolve, attempt * 400))
      } finally {
        clearTimeout(timer)
        init?.signal?.removeEventListener('abort', abortFromCaller)
      }
    }

    throw lastError
  }
}
