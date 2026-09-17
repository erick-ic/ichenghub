const MAX_PLATFORM_URL_LENGTH = 2048;

export function normalizePlatformUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_PLATFORM_URL_LENGTH) return undefined;

  const hasHttpProtocol = /^https?:\/\//i.test(trimmed);
  const schemeMatch = trimmed.match(/^([a-z][a-z\d+.-]*):/i);
  // 明确拒绝 javascript:、data:、file: 等协议；域名:端口与 localhost:端口
  // 不视为自定义协议，仍自动补全 https://。
  if (
    schemeMatch &&
    !hasHttpProtocol &&
    !schemeMatch[1].includes('.') &&
    schemeMatch[1].toLowerCase() !== 'localhost'
  ) {
    return undefined;
  }

  const candidate = hasHttpProtocol ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    // 平台入口不应携带内嵌账号密码，避免误保存敏感信息。
    if (url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}
