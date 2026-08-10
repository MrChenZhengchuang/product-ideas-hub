import Taro from '@tarojs/taro';

const CLIENT_TOKEN_KEY = 'client_token';

export function getClientToken() {
  return Taro.getStorageSync<string>(CLIENT_TOKEN_KEY) || '';
}

export function setClientToken(token: string) {
  Taro.setStorageSync(CLIENT_TOKEN_KEY, token);
}

export function clearClientToken() {
  Taro.removeStorageSync(CLIENT_TOKEN_KEY);
}
