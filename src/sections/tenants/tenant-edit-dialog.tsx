import type { Tenant } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { getTenant, updateTenant } from 'src/services/tenants';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  // Prefer a tenant already in hand (from the details dialog); otherwise fetch by slug.
  tenant?: Tenant | null;
  slug?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  name: string;
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  themeColor: string;
  supportEmail: string;
  supportPhone: string;
  footerText: string;
};

const EMPTY: FormState = {
  name: '',
  appName: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '',
  secondaryColor: '',
  themeColor: '',
  supportEmail: '',
  supportPhone: '',
  footerText: '',
};

function toForm(t: Tenant): FormState {
  const b = t.branding || {};
  return {
    name: t.name || '',
    appName: b.appName || '',
    logoUrl: b.logoUrl || '',
    faviconUrl: b.faviconUrl || '',
    primaryColor: b.primaryColor || '',
    secondaryColor: b.secondaryColor || '',
    themeColor: b.themeColor || '',
    supportEmail: b.supportEmail || '',
    supportPhone: b.supportPhone || '',
    footerText: b.footerText || '',
  };
}

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function TenantEditDialog({ open, tenant, slug, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const effectiveSlug = tenant?.slug || slug || null;

  const load = useCallback(async () => {
    if (tenant) {
      setForm(toForm(tenant));
      return;
    }
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await getTenant(slug);
      if (res.success) setForm(toForm(res.data));
      else setError(res.message || 'Failed to load tenant');
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  }, [tenant, slug]);

  useEffect(() => {
    if (open) {
      setError('');
      load();
    }
  }, [open, load]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (error) setError('');
  };

  const handleSave = useCallback(async () => {
    if (!effectiveSlug) return;
    if (!form.name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    for (const key of ['primaryColor', 'secondaryColor', 'themeColor'] as const) {
      if (form[key].trim() && !HEX_RE.test(form[key].trim())) {
        setError(`Invalid hex color for ${key} (e.g. #1877F2)`);
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      const res = await updateTenant(effectiveSlug, {
        name: form.name.trim(),
        branding: {
          appName: form.appName.trim(),
          logoUrl: form.logoUrl.trim(),
          faviconUrl: form.faviconUrl.trim(),
          primaryColor: form.primaryColor.trim(),
          secondaryColor: form.secondaryColor.trim(),
          themeColor: form.themeColor.trim(),
          supportEmail: form.supportEmail.trim(),
          supportPhone: form.supportPhone.trim(),
          footerText: form.footerText.trim(),
        },
      });
      if (res.success) {
        onSaved();
        onClose();
      } else {
        setError(res.message || 'Failed to update tenant');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant');
    } finally {
      setSaving(false);
    }
  }, [effectiveSlug, form, onSaved, onClose]);

  const busy = saving || loading;

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Tenant</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Tenant Name"
              value={form.name}
              onChange={set('name')}
              disabled={busy}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Divider textAlign="left">
              <Typography variant="overline" color="text.secondary">Branding</Typography>
            </Divider>

            <TextField label="App Name" value={form.appName} onChange={set('appName')} disabled={busy} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Logo URL" value={form.logoUrl} onChange={set('logoUrl')} disabled={busy} fullWidth placeholder="https://…" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Favicon URL" value={form.faviconUrl} onChange={set('faviconUrl')} disabled={busy} fullWidth placeholder="https://…" slotProps={{ inputLabel: { shrink: true } }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Primary Color" value={form.primaryColor} onChange={set('primaryColor')} disabled={busy} fullWidth placeholder="#1877F2" slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Secondary Color" value={form.secondaryColor} onChange={set('secondaryColor')} disabled={busy} fullWidth placeholder="#8E33FF" slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Theme Color" value={form.themeColor} onChange={set('themeColor')} disabled={busy} fullWidth placeholder="#1877F2" slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Support Email" value={form.supportEmail} onChange={set('supportEmail')} disabled={busy} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Support Phone" value={form.supportPhone} onChange={set('supportPhone')} disabled={busy} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>

            <TextField label="Footer Text" value={form.footerText} onChange={set('footerText')} disabled={busy} fullWidth multiline minRows={2} slotProps={{ inputLabel: { shrink: true } }} />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={busy}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={busy}>
          {saving ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
