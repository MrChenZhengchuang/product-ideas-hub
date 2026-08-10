declare const CLIENT_API_ORIGIN: string;

const DEFAULT_JAVA_ORIGIN = 'http://127.0.0.1:8080';

export function getJavaApiOrigin() {
  if (typeof CLIENT_API_ORIGIN !== 'undefined' && CLIENT_API_ORIGIN) {
    return CLIENT_API_ORIGIN;
  }

  return DEFAULT_JAVA_ORIGIN;
}

export function getClientApiBase() {
  if (process.env.TARO_ENV === 'h5') {
    return '/api/client';
  }

  return `${getJavaApiOrigin()}/api/client`;
}
