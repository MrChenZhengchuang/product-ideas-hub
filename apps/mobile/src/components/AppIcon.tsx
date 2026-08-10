import type { CSSProperties } from 'react';

type AppIconName =
  | 'arrow-left'
  | 'search'
  | 'arrow-up-right'
  | 'compass'
  | 'ai'
  | 'bag'
  | 'briefcase'
  | 'message';

type AppIconProps = {
  name: AppIconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function AppIcon({ name, size = 20, className, style }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      style={style}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {name === 'arrow-left' ? (
        <>
          <path d="M14.5 6.5L9 12L14.5 17.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M9.5 12H18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      ) : null}

      {name === 'search' ? (
        <>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 16L20 20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      ) : null}

      {name === 'arrow-up-right' ? (
        <>
          <path d="M7 17L17 7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M9 7H17V15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </>
      ) : null}

      {name === 'compass' ? (
        <>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14.8 9.2L13 14L8.2 15.8L10 11L14.8 9.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        </>
      ) : null}

      {name === 'ai' ? (
        <>
          <rect height="8" rx="2.5" stroke="currentColor" strokeWidth="1.8" width="10" x="7" y="8" />
          <path d="M10 12H10.01M14 12H14.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          <path d="M12 4V6M5 10H7M17 10H19M8 18L7 20M16 18L17 20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      ) : null}

      {name === 'bag' ? (
        <>
          <path d="M7 9H17L16 19H8L7 9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M9.5 9V8C9.5 6.62 10.62 5.5 12 5.5C13.38 5.5 14.5 6.62 14.5 8V9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      ) : null}

      {name === 'briefcase' ? (
        <>
          <rect height="9" rx="2.5" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="8" />
          <path d="M9 8V7.5C9 6.67 9.67 6 10.5 6H13.5C14.33 6 15 6.67 15 7.5V8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M5 12H10M14 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      ) : null}

      {name === 'message' ? (
        <>
          <path d="M6.5 7.5H17.5C18.6 7.5 19.5 8.4 19.5 9.5V14C19.5 15.1 18.6 16 17.5 16H11L7.2 18.8V16H6.5C5.4 16 4.5 15.1 4.5 14V9.5C4.5 8.4 5.4 7.5 6.5 7.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M8.5 11.5H15.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      ) : null}
    </svg>
  );
}
