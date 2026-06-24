import type { Tenant } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { getTenant } from 'src/services/tenants';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  slug: string | null;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', width: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ flexGrow: 1, minWidth: 0, typography: 'body2', wordBreak: 'break-word' }}>
        {children ?? <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
      </Box>
    </Stack>
  );
}

function ColorSwatch({ value }: { value?: string }) {
  if (!value) return <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>;
  const hex = value.startsWith('#') ? value : `#${value}`;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 18, height: 18, borderRadius: 0.5, bgcolor: hex, border: 1, borderColor: 'divider' }} />
      <span>{hex}</span>
    </Stack>
  );
}

export function TenantDetailsDialog({ open, slug, onClose, onEdit }: Props) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await getTenant(slug);
      if (res.success) setTenant(res.data);
      else setError(res.message || 'Failed to load tenant');
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (open && slug) {
      setTenant(null);
      load();
    }
  }, [open, slug, load]);

  const b = tenant?.branding || {};
  const checklist = tenant?.goLiveChecklist || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tenant Details</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ my: 1 }}>
            {error}
          </Alert>
        )}

        {tenant && !loading && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Avatar src={b.logoUrl || undefined} variant="rounded" sx={{ width: 48, height: 48 }}>
                {(tenant.name || '?').charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{tenant.name}</Typography>
                <Chip
                  size="small"
                  label={tenant.status}
                  color={tenant.status === 'active' ? 'success' : tenant.status === 'suspended' ? 'error' : 'default'}
                  sx={{ textTransform: 'capitalize', mt: 0.5 }}
                />
              </Box>
            </Stack>

            <Divider textAlign="left">
              <Typography variant="overline" color="text.secondary">Routing</Typography>
            </Divider>
            <Row label="Slug">{tenant.slug}</Row>
            <Row label="Subdomain">{tenant.subdomain ? `${tenant.subdomain}.shalvi.in` : null}</Row>
            <Row label="Custom Domain">
              {tenant.customDomain ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{tenant.customDomain}</span>
                  {tenant.domainStatus && tenant.domainStatus !== 'none' && (
                    <Chip size="small" label={tenant.domainStatus} sx={{ textTransform: 'capitalize' }} />
                  )}
                </Stack>
              ) : null}
            </Row>
            <Row label="Database">{tenant.dbName}</Row>

            <Divider textAlign="left" sx={{ mt: 1 }}>
              <Typography variant="overline" color="text.secondary">Branding</Typography>
            </Divider>
            <Row label="App Name">{b.appName}</Row>
            <Row label="Logo URL">
              {b.logoUrl ? <Link href={b.logoUrl} target="_blank" rel="noopener">{b.logoUrl}</Link> : null}
            </Row>
            <Row label="Favicon URL">
              {b.faviconUrl ? <Link href={b.faviconUrl} target="_blank" rel="noopener">{b.faviconUrl}</Link> : null}
            </Row>
            <Row label="Primary Color"><ColorSwatch value={b.primaryColor} /></Row>
            <Row label="Secondary Color"><ColorSwatch value={b.secondaryColor} /></Row>
            <Row label="Theme Color"><ColorSwatch value={b.themeColor} /></Row>
            <Row label="Support Email">{b.supportEmail}</Row>
            <Row label="Support Phone">{b.supportPhone}</Row>
            <Row label="Footer Text">{b.footerText}</Row>

            <Divider textAlign="left" sx={{ mt: 1 }}>
              <Typography variant="overline" color="text.secondary">Go-live checklist</Typography>
            </Divider>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ py: 0.5 }}>
              {(['razorpay', 'sms', 'catalog', 'adminUser'] as const).map((key) => (
                <Chip
                  key={key}
                  size="small"
                  variant="outlined"
                  color={checklist[key] ? 'success' : 'default'}
                  label={`${key}: ${checklist[key] ? 'done' : 'pending'}`}
                />
              ))}
            </Stack>

            {(tenant.createdAt || tenant.updatedAt) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {tenant.createdAt && `Created ${new Date(tenant.createdAt).toLocaleString()}`}
                {tenant.updatedAt && ` · Updated ${new Date(tenant.updatedAt).toLocaleString()}`}
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button onClick={() => tenant && onEdit(tenant)} variant="contained" disabled={!tenant}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
