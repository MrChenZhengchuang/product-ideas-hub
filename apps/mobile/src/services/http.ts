import Taro from '@tarojs/taro';
import { getClientApiBase } from '@/constants/api';

type RequestOptions = Omit<Taro.request.Option, 'url'> & {
  path: string;
};

export async function http<T>({ path, ...options }: RequestOptions) {
  const response = await Taro.request<T>({
    url: `${getClientApiBase()}${path}`,
    header: {
      ...(options.data ? { 'Content-Type': 'application/json' } : {}),
      ...(options.header || {})
    },
    ...options
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error((response.data as { message?: string })?.message || `Request failed: ${response.statusCode}`);
  }

  return response.data;
}
