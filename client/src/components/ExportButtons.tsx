import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import { downloadExport } from '../api/export';

interface ExportButtonsProps {
  /** API endpoint path, e.g. '/accounting/invoices/export' */
  endpoint: string;
  /** Extra query params (date filters, category, etc.) */
  params?: Record<string, string | number | undefined>;
  /** Optional tooltip prefix */
  labelPrefix?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ExportButtons({
  endpoint,
  params = {},
  size = 'small',
}: ExportButtonsProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    setLoading(format);
    try {
      await downloadExport(endpoint, { ...params, format, lang });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Stack direction="row" spacing={0} alignItems="center" sx={{ flexShrink: 0 }}>
      <Tooltip title={lang === 'ar' ? 'تصدير Excel' : 'Export Excel'}>
        <span>
          <IconButton
            size={size}
            onClick={() => handleExport('excel')}
            disabled={loading !== null}
            color="primary"
          >
            <GridOnIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}>
        <span>
          <IconButton
            size={size}
            onClick={() => handleExport('pdf')}
            disabled={loading !== null}
            color="primary"
          >
            <PictureAsPdfIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
