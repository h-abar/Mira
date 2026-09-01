import { IconButton, Stack, Tooltip, SvgIcon } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import type { SalonSocial } from '../../api/public';

function SnapchatIcon(props: { fontSize?: 'small' | 'medium' }) {
  return (
    <SvgIcon fontSize={props.fontSize ?? 'small'} viewBox="0 0 24 24">
      <path d="M12.04 2c-2.2 0-4.3.9-5.7 2.55C4.7 6.3 4.2 8.55 4.55 10.8c.12.75-.18 1.2-.72 1.55-.5.32-.78.85-.7 1.4.08.58.55 1.05 1.15 1.18.42.1.7.45.78.88.18.95.7 1.78 1.48 2.35 1.05.78 2.4 1.2 3.78 1.32.22 1.02.7 1.55 1.72 1.55s1.5-.53 1.72-1.55c1.38-.12 2.73-.54 3.78-1.32.78-.57 1.3-1.4 1.48-2.35.08-.43.36-.78.78-.88.6-.13 1.07-.6 1.15-1.18.08-.55-.2-1.08-.7-1.4-.54-.35-.84-.8-.72-1.55.35-2.25-.15-4.5-1.79-6.25C16.34 2.9 14.24 2 12.04 2z" />
    </SvgIcon>
  );
}

function TikTokIcon(props: { fontSize?: 'small' | 'medium' }) {
  return (
    <SvgIcon fontSize={props.fontSize ?? 'small'} viewBox="0 0 24 24">
      <path d="M14.5 3c.4 2.6 1.9 4.4 4.5 4.7v2.6c-1.5 0-2.9-.5-4.1-1.3v6.7c0 3.3-2.6 5.8-6 5.8S3 19 3 15.7 5.6 10 9 10c.4 0 .8 0 1.2.1v2.7c-.4-.1-.8-.2-1.2-.2-1.8 0-3.2 1.4-3.2 3.1S7.2 18.8 9 18.8s3.2-1.4 3.2-3.1V3h2.3z" />
    </SvgIcon>
  );
}

const ITEMS: Array<{
  key: keyof SalonSocial;
  labelAr: string;
  labelEn: string;
  color: string;
  Icon: typeof InstagramIcon | typeof SnapchatIcon;
}> = [
  { key: 'instagram', labelAr: 'إنستغرام', labelEn: 'Instagram', color: '#E1306C', Icon: InstagramIcon },
  { key: 'tiktok', labelAr: 'تيك توك', labelEn: 'TikTok', color: '#111111', Icon: TikTokIcon },
  { key: 'snapchat', labelAr: 'سناب شات', labelEn: 'Snapchat', color: '#FFFC00', Icon: SnapchatIcon },
  { key: 'facebook', labelAr: 'فيسبوك', labelEn: 'Facebook', color: '#1877F2', Icon: FacebookIcon },
  { key: 'whatsapp', labelAr: 'واتساب', labelEn: 'WhatsApp', color: '#25D366', Icon: WhatsAppIcon },
];

interface SocialLinksProps {
  social?: SalonSocial | null;
  variant?: 'light' | 'dark';
  isAr?: boolean;
}

export default function SocialLinks({ social, variant = 'dark', isAr = true }: SocialLinksProps) {
  const isDark = variant === 'dark';

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {ITEMS.map(({ key, labelAr, labelEn, color, Icon }) => {
        const href = social?.[key] ?? null;
        const label = isAr ? labelAr : labelEn;
        const button = (
          <IconButton
            component={href ? 'a' : 'button'}
            href={href || undefined}
            target={href ? '_blank' : undefined}
            rel={href ? 'noopener noreferrer' : undefined}
            disabled={!href}
            aria-label={label}
            sx={{
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(194, 24, 91, 0.08)',
              color: key === 'snapchat' && isDark ? '#FFFC00' : color,
              opacity: href ? 1 : 0.45,
              '&:hover': href
                ? { background: color, color: key === 'snapchat' ? '#111' : '#fff' }
                : undefined,
            }}
          >
            <Icon fontSize="small" />
          </IconButton>
        );
        return (
          <Tooltip
            key={key}
            title={href ? label : isAr ? `${label} — أضيفي الرابط من الإعدادات` : `${label} — add the link in Settings`}
          >
            <span>{button}</span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
