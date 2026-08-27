import { useId } from 'react';
import { useTranslation } from 'react-i18next';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 40 }: LogoProps) {
  const { t } = useTranslation();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gold = `miraGold${uid}`;
  const pink = `miraPink${uid}`;
  const height = Math.round(size * (100 / 120));
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 120 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={t('general.appName')}
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7c948" />
          <stop offset="100%" stopColor="#d4a017" />
        </linearGradient>
        <linearGradient id={pink} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d81b60" />
          <stop offset="100%" stopColor="#7b0c3f" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="8" r="5" fill={`url(#${gold})`} />
      <path
        d="M57 15 L57 19 M63 15 L63 19"
        stroke={`url(#${gold})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M10 80 L10 42 L30 54 L60 18 L90 54 L110 42 L110 80 Z"
        fill={`url(#${pink})`}
        stroke="#5c0830"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="20" r="5" fill={`url(#${gold})`} />
      <circle cx="30" cy="54" r="4" fill={`url(#gold})`} />
      <circle cx="90" cy="54" r="4" fill={`url(#gold})`} />
      <circle cx="10" cy="44" r="4" fill={`url(#gold})`} />
      <circle cx="110" cy="44" r="4" fill={`url(#gold})`} />
      <rect x="10" y="70" width="100" height="12" rx="4" fill={`url(#gold})`} />
      <circle cx="30" cy="76" r="3" fill="#c2185b" />
      <circle cx="60" cy="76" r="3.5" fill="#c2185b" />
      <circle cx="90" cy="76" r="3" fill="#c2185b" />
    </svg>
  );
}