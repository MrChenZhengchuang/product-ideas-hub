declare const CLIENT_WEB_ORIGIN: string;

/** 与官网 `apps/client` 的 `@media (max-width: 768px)` 保持一致 */
export const DESKTOP_MIN_WIDTH = 769;

const DEFAULT_DEV_CLIENT_WEB_ORIGIN = 'http://127.0.0.1:5173';

/** 返回 PC 官网 origin；`null` 表示与当前站点同源，仅跳转路径 */
export function getClientWebOrigin(): string | null {
  if (typeof CLIENT_WEB_ORIGIN !== 'undefined') {
    if (!CLIENT_WEB_ORIGIN) {
      return null;
    }

    return CLIENT_WEB_ORIGIN.replace(/\/$/, '');
  }

  return DEFAULT_DEV_CLIENT_WEB_ORIGIN;
}
