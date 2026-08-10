import { useEffect, type ReactNode } from 'react';
import { initDesktopRedirect } from '@/utils/desktop-redirect';
import './app.scss';

type AppProps = {
  children: ReactNode;
};

export default function App({ children }: AppProps) {
  useEffect(() => initDesktopRedirect(), []);

  return children;
}
