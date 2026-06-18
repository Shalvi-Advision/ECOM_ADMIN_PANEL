import type { Tenant } from 'src/types/api';
import type { DomainResult } from 'src/services/tenants';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import {
  setTenantDomain,
  approveTenantDomain,
  markTenantDomainLive,
} from 'src/services/tenants';

// ----------------------------------------------------------------------

type DomainStatus = NonNullable<Tenant['domainStatus']>;

const STATUS_CHIP_COLOR: Record<DomainStatus, 'warning' | 'info' | 'success' | 'error' | 'default'> =
  {
    none: 'default',
    pending: 'warning',
    approved: 'info',
    live: 'success',
    failed: 'error',
  };

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type Props = {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
  onChanged: () => void;
};

export function DomainDialog({ open, tenant, onClose, onChanged }: Props) {
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cname, setCname] = useState<DomainResult['cname'] | null>(null);
  const [instructions, setInstructions] = useState('');

  const status: DomainStatus = tenant?.domainStatus || 'none';
  const hasDomain = !!tenant?.customDomain;
  const slug = tenant?.slug;

  // Reset transient state when the dialog (re)opens or switches tenant — but NOT
  // on every status refresh, so a freshly generated CNAME survives onChanged().
  useEffect(() => {
    if (open) {
      setDomain(tenant?.customDomain || '');
      setBusy(false);
      setError('');
      setCname(null);
      setInstructions('');
    }
    // Intentionally keyed on slug only: re-running on customDomain changes would
    // wipe a freshly generated CNAME when onChanged() refreshes the row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slug]);

  const handleSetDomain = useCallback(async () => {
    if (!tenant) return;
    const trimmed = domain.trim();
    if (!trimmed) {
      setError('Enter a domain (e.g. shop.patelmart.com)');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await setTenantDomain(tenant.slug, trimmed);
      if (res.success) {
        setCname(res.data.cname || null);
        setInstructions(res.data.instructions || '');
        onChanged();
      } else {
        setError(res.message || 'Failed to set domain');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set domain');
    } finally {
      setBusy(false);
    }
  }, [tenant, domain, onChanged]);

  const handleApprove = useCallback(async () => {
    if (!tenant) return;
    setBusy(true);
    setError('');
    try {
      const res = await approveTenantDomain(tenant.slug);
      if (res.success) {
        onChanged();
      } else {
        setError(res.message || 'Failed to approve domain');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve domain');
    } finally {
      setBusy(false);
    }
  }, [tenant, onChanged]);

  const handleMarkLive = useCallback(async () => {
    if (!tenant) return;
    setBusy(true);
    setError('');
    try {
      const res = await markTenantDomainLive(tenant.slug);
      if (res.success) {
        onChanged();
      } else {
        setError(res.message || 'Failed to mark domain live');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark domain live');
    } finally {
      setBusy(false);
    }
  }, [tenant, onChanged]);

  const renderCname = () => {
    if (!cname && !instructions) return null;
    return (
      <Alert severity="info">
        <AlertTitle>Add this CNAME record</AlertTitle>
        {instructions && (
          <Typography variant="body2" sx={{ mb: cname ? 1.5 : 0 }}>
            {instructions}
          </Typography>
        )}
        {cname && (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1,
              fontSize: 13,
              overflowX: 'auto',
              bgcolor: 'background.neutral',
              fontFamily: 'monospace',
            }}
          >
            {`${cname.host}  ->  ${cname.target}`}
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          Once DNS resolves, return here and Approve the domain.
        </Typography>
      </Alert>
    );
  };

  const renderBody = () => {
    if (!tenant) return null;

    // Just-set (pending) result with fresh CNAME, or no domain yet → form.
    if (status === 'none' || !hasDomain) {
      return (
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Register a custom domain for <strong>{tenant.name}</strong>. We&apos;ll mark it pending
            and give you a CNAME record to add at your DNS provider.
          </Typography>
          <TextField
            fullWidth
            label="Custom Domain"
            value={domain}
            onChange={(event) => {
              setDomain(event.target.value);
              if (error) setError('');
            }}
            placeholder="shop.patelmart.com"
            disabled={busy}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {renderCname()}
        </Stack>
      );
    }

    if (status === 'pending') {
      return (
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">{tenant.customDomain}</Typography>
            <Chip size="small" color={STATUS_CHIP_COLOR[status]} label={capitalize(status)} />
          </Stack>
          {cname || instructions ? (
            renderCname()
          ) : (
            <Alert severity="info">
              <AlertTitle>Pending DNS</AlertTitle>
              <Typography variant="body2">
                Point a CNAME for <strong>{tenant.customDomain}</strong> to your edge host (as shown
                when the domain was set). Approve only once DNS resolves.
              </Typography>
            </Alert>
          )}
          <Alert severity="warning">
            Approving issues the certificate on first hit. Confirm the CNAME resolves before
            approving.
          </Alert>
        </Stack>
      );
    }

    if (status === 'approved') {
      return (
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">{tenant.customDomain}</Typography>
            <Chip size="small" color={STATUS_CHIP_COLOR[status]} label={capitalize(status)} />
          </Stack>
          <Alert severity="info">
            The domain is approved. Once the certificate is confirmed serving over HTTPS, mark it
            live.
          </Alert>
        </Stack>
      );
    }

    if (status === 'live') {
      return (
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">{tenant.customDomain}</Typography>
            <Chip size="small" color={STATUS_CHIP_COLOR[status]} label={capitalize(status)} />
          </Stack>
          <Alert severity="success">
            <strong>{tenant.customDomain}</strong> is live.
          </Alert>
        </Stack>
      );
    }

    // failed
    return (
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1">{tenant.customDomain}</Typography>
          <Chip size="small" color={STATUS_CHIP_COLOR[status]} label={capitalize(status)} />
        </Stack>
        <Alert severity="error">
          The domain failed. Re-set it below to retry from pending.
        </Alert>
        <TextField
          fullWidth
          label="Custom Domain"
          value={domain}
          onChange={(event) => {
            setDomain(event.target.value);
            if (error) setError('');
          }}
          placeholder="shop.patelmart.com"
          disabled={busy}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        {renderCname()}
      </Stack>
    );
  };

  const handleClose = useCallback(() => {
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  const showSaveButton = status === 'none' || !hasDomain || status === 'failed';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Custom Domain</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>{renderBody()}</Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy} color="inherit">
          Close
        </Button>
        {showSaveButton && (
          <Button onClick={handleSetDomain} variant="contained" disabled={busy}>
            {busy ? <CircularProgress size={20} /> : 'Save & Generate CNAME'}
          </Button>
        )}
        {status === 'pending' && hasDomain && (
          <Button onClick={handleApprove} variant="contained" color="success" disabled={busy}>
            {busy ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        )}
        {status === 'approved' && (
          <Button onClick={handleMarkLive} variant="contained" color="success" disabled={busy}>
            {busy ? <CircularProgress size={20} /> : 'Mark Live'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
