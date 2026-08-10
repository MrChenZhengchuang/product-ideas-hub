const CLIENT_TOKEN_KEY = 'client_token';

export function getClientToken() {
  return localStorage.getItem(CLIENT_TOKEN_KEY);
}

export function setClientToken(token: string) {
  localStorage.setItem(CLIENT_TOKEN_KEY, token);
}

export function clearClientToken() {
  localStorage.removeItem(CLIENT_TOKEN_KEY);
}
