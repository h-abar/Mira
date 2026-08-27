import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CampaignIcon from '@mui/icons-material/Campaign';
import { sendCampaign, type CampaignResult } from '../api/notifications';
import { listClients, type Client } from '../api/clients';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'الحملات التسويقية',
    subtitle: 'أرسل رسائل واتساب لجمهور مستهدف',
    audience: 'الجمهور المستهدف',
    birthday: 'العميلات أصحاب عيد الميلاد هذا الشهر',
    inactive: 'العميلات غير النشطات',
    ids: 'اختيار عميلات محددات',
    inactiveDays: 'عدد أيام عدم النشاط',
    clients: 'اختيار العميلات',
    message: 'نص الرسالة',
    messageHint: 'استخدم {name} لاسم العميلة',
    example: 'عروضنا منتظرة، {name}! تعالي اليوم واحصلي على خصم 20%.',
    send: 'إرسال الحملة',
    sending: 'جارٍ الإرسال...',
    resultTitle: 'نتيجة الحملة',
    target: 'المستهدفات',
    withPhone: 'مع رقم',
    sent: 'تم الإرسال',
    noPhone: 'بدون رقم',
    failed: 'فشل',
    messageRequired: 'أدخل نص الرسالة',
    sentMsg: 'تم إرسال الحملة بنجاح',
  },
  en: {
    title: 'Marketing Campaigns',
    subtitle: 'Send WhatsApp messages to a target audience',
    audience: 'Target Audience',
    birthday: 'Clients with birthday this month',
    inactive: 'Inactive clients',
    ids: 'Select specific clients',
    inactiveDays: 'Inactivity days',
    clients: 'Select clients',
    message: 'Message',
    messageHint: 'Use {name} for the client name',
    example: 'Our offers await, {name}! Come today and get 20% off.',
    send: 'Send Campaign',
    sending: 'Sending...',
    resultTitle: 'Campaign Result',
    target: 'Targeted',
    withPhone: 'With phone',
    sent: 'Sent',
    noPhone: 'No phone',
    failed: 'Failed',
    messageRequired: 'Enter message',
    sentMsg: 'Campaign sent successfully',
  },
} as const;

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Request failed';
};

export default function CampaignsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canWrite = useAuthStore((s) => s.hasPermission('campaigns') || s.hasPermission('notifications'));

  const [audience, setAudience] = useState<'birthday' | 'inactive' | 'ids'>('birthday');
  const [inactiveDays, setInactiveDays] = useState('30');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState<string>(lang === 'ar' ? L.ar.example : L.en.example);
  const [messageError, setMessageError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadClients = async () => {
    try {
      const res = await listClients({ limit: 100 });
      setClients(res.items);
    } catch {
      /* ignore */
    }
  };

  const handleAudienceChange = (a: 'birthday' | 'inactive' | 'ids') => {
    setAudience(a);
    if (a === 'ids') void loadClients();
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setMessageError(l.messageRequired);
      return;
    }
    setSending(true);
    try {
      const res = await sendCampaign({
        audience,
        message: message.trim(),
        ...(audience === 'inactive' ? { inactiveDays: Number(inactiveDays) || 30 } : {}),
        ...(audience === 'ids' ? { clientIds: selectedIds } : {}),
      });
      setResult(res);
      setSnack({ open: true, message: l.sentMsg, severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <PageHeader title={l.title} subtitle={l.subtitle} />

      <Card sx={{ maxWidth: 640, mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>{l.audience}</InputLabel>
              <Select
                value={audience}
                onChange={(e) => handleAudienceChange(e.target.value as typeof audience)}
                label={l.audience}
              >
                <MenuItem value="birthday">{l.birthday}</MenuItem>
                <MenuItem value="inactive">{l.inactive}</MenuItem>
                <MenuItem value="ids">{l.ids}</MenuItem>
              </Select>
            </FormControl>

            {audience === 'inactive' && (
              <TextField
                label={l.inactiveDays}
                type="number"
                value={inactiveDays}
                onChange={(e) => setInactiveDays(e.target.value)}
                fullWidth
              />
            )}

            {audience === 'ids' && (
              <FormControl fullWidth>
                <InputLabel>{l.clients}</InputLabel>
                <Select
                  multiple
                  value={selectedIds}
                  onChange={(e) => setSelectedIds(e.target.value as number[])}
                  label={l.clients}
                  renderValue={(selected) =>
                    selected
                      .map((id) => clients.find((c) => c.id === id)?.name ?? String(id))
                      .join(', ')
                  }
                >
                  {clients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label={l.message}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              minRows={3}
              error={!!messageError}
              helperText={messageError ? messageError : l.messageHint}
              fullWidth
            />

            <Button
              variant="contained"
              startIcon={<CampaignIcon />}
              onClick={() => void handleSend()}
              disabled={sending || !canWrite}
            >
              {sending ? l.sending : l.send}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {result && (
        <Card sx={{ maxWidth: 640 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {l.resultTitle}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={`${l.target}: ${result.targetCount}`} color="primary" />
              <Chip label={`${l.withPhone}: ${result.withPhone}`} />
              <Chip label={`${l.sent}: ${result.sentCount}`} color="success" />
              <Chip label={`${l.noPhone}: ${result.results.filter((r) => r.status === 'NO_PHONE').length}`} color="warning" />
              <Chip label={`${l.failed}: ${result.results.filter((r) => r.status === 'FAILED').length}`} color="error" />
            </Stack>
            <List dense>
              {result.results.slice(0, 20).map((r) => (
                <ListItem key={r.clientId} divider>
                  <ListItemText
                    primary={`#${r.clientId}`}
                    secondary={r.status}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}