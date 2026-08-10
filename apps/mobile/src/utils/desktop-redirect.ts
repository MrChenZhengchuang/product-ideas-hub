import { DESKTOP_MIN_WIDTH, getClientWebOrigin } from '@/constants/site';

const PREFER_MOBILE_KEY = 'product-ideas:prefer-mobile';

const MOBILE_TO_DESKTOP: Record<string, string | ((query: URLSearchParams) => string)> = {
  '/pages/home/index': '/',
  '/pages/trends/index': '/trends',
  '/pages/publish/index': '/publish',
  '/pages/me/index': '/me',
  '/pages/auth/index': '/auth',
  '/pages/about/index': '/about',
  '/pages/change-password/index': '/change-password',
  '/pages/project-detail/index': (query) => {
    const id = query.get('id');
    return id ? `/projects/${id}` : '/';
  }
};

let redirecting = false;

function getMobileRoutePath() {
  const hash = window.location.hash.replace(/^#/, '');

  if (hash) {
    return hash.split('?')[0];
  }

  return window.location.pathname;
}

function getMobileRouteQuery() {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');

  if (queryIndex >= 0) {
    return new URLSearchParams(hash.slice(queryIndex + 1));
  }

  return new URLSearchParams(window.location.search);
}

export function isPreferMobileView() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('mobile') === '1') {
    sessionStorage.setItem(PREFER_MOBILE_KEY, '1');
    return true;
  }

  return sessionStorage.getItem(PREFER_MOBILE_KEY) === '1';
}

export function shouldRedirectToDesktop() {
  if (process.env.TARO_ENV !== 'h5') {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  if (isPreferMobileView()) {
    return false;
  }

  return window.innerWidth >= DESKTOP_MIN_WIDTH;
}

export function resolveDesktopPath() {
  const mobilePath = getMobileRoutePath();
  const query = getMobileRouteQuery();
  const mapped = MOBILE_TO_DESKTOP[mobilePath];

  if (!mapped) {
    return '/';
  }

  return typeof mapped === 'function' ? mapped(query) : mapped;
}

export function buildDesktopUrl() {
  const desktopPath = resolveDesktopPath();
  const origin = getClientWebOrigin();

  if (!origin) {
    return desktopPath;
  }

  return `${origin}${desktopPath}`;
}

export function redirectToDesktopSite() {
  if (redirecting) {
    return;
  }

  redirecting = true;
  window.location.replace(buildDesktopUrl());
}

export function initDesktopRedirect() {
  if (process.env.TARO_ENV !== 'h5' || typeof window === 'undefined') {
    return () => undefined;
  }

  const check = () => {
    if (shouldRedirectToDesktop()) {
      redirectToDesktopSite();
    }
  };

  check();

  window.addEventListener('resize', check);

  return () => {
    window.removeEventListener('resize', check);
  };
}
