import type { Tenant, TenantStatus } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { CONFIG } from 'src/config-global';
import { clearPlatformAuth } from 'src/services/platform-auth';
import { getTenants, deleteTenant, resumeTenant, suspendTenant } from 'src/services/tenants';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { DomainDialog } from 'src/sections/tenants/domain-dialog';
import { TenantEditDialog } from 'src/sections/tenants/tenant-edit-dialog';
import { TenantWizardDialog } from 'src/sections/tenants/tenant-wizard-dialog';
import { TenantDetailsDialog } from 'src/sections/tenants/tenant-details-dialog';

// ----------------------------------------------------------------------

// A 401 from a control-plane call means the platform session is gone/invalid.
// Bounce to the platform sign-in (the route guard owns the rest).
function redirectToPlatformSignIn() {
  clearPlatformAuth();
  window.location.href = '/platform/sign-in';
}

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<TenantStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  provisioning: 'warning',
  suspended: 'error',
  deleted: 'default',
};

type DomainStatus = NonNullable<Tenant['domainStatus']>;

const DOMAIN_STATUS_COLOR: Record<
  DomainStatus,
  'success' | 'warning' | 'info' | 'error' | 'default'
> = {
  none: 'default',
  pending: 'warning',
  approved: 'info',
  live: 'success',
  failed: 'error',
};

type PendingAction = { tenant: Tenant; action: 'suspend' | 'resume' | 'delete' } | null;

export default function Page() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pending, setPending] = useState<PendingAction>(null);
  // Type-to-confirm guard for the destructive Delete (it drops the tenant DB).
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [domainSlug, setDomainSlug] = useState<string | null>(null);
  const [detailsSlug, setDetailsSlug] = useState<string | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTenants();
      if (response.success) {
        setTenants(response.data);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.statusCode === 401) {
        redirectToPlatformSignIn();
      } else {
        setError(err.message || 'Failed to load tenants');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const confirmAction = useCallback(async () => {
    if (!pending) return;
    try {
      setBusy(true);
      setError('');
      if (pending.action === 'suspend') {
        await suspendTenant(pending.tenant.slug);
      } else if (pending.action === 'resume') {
        await resumeTenant(pending.tenant.slug);
      } else {
        await deleteTenant(pending.tenant.slug);
      }
      setPending(null);
      setConfirmText('');
      await fetchTenants();
    } catch (err: any) {
      if (err?.status === 401 || err?.statusCode === 401) {
        redirectToPlatformSignIn();
        return;
      }
      setError(err.message || `Failed to ${pending.action} tenant`);
    } finally {
      setBusy(false);
    }
  }, [pending, fetchTenants]);

  return (
    <>
      <title>{`Tenants - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Tenants</Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon={'solar:refresh-bold-duotone' as any} />}
                onClick={fetchTenants}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon={'mingcute:add-line' as any} />}
                onClick={() => setWizardOpen(true)}
              >
                Create Tenant
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Slug</TableCell>
                      <TableCell>Subdomain</TableCell>
                      <TableCell>Custom Domain</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : tenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No tenants found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenants.map((tenant) => (
                        <TableRow key={tenant.slug} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {tenant.branding?.appName || tenant.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{tenant.slug}</TableCell>
                          <TableCell>{tenant.subdomain}</TableCell>
                          <TableCell>
                            {tenant.domainStatus && tenant.domainStatus !== 'none' ? (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2">{tenant.customDomain || '—'}</Typography>
                                <Chip
                                  size="small"
                                  label={tenant.domainStatus}
                                  color={DOMAIN_STATUS_COLOR[tenant.domainStatus]}
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Stack>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={tenant.status}
                              color={STATUS_COLOR[tenant.status] || 'default'}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                color="inherit"
                                variant="outlined"
                                startIcon={<Iconify icon={'solar:eye-bold-duotone' as any} />}
                                onClick={() => setDetailsSlug(tenant.slug)}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                color="inherit"
                                variant="outlined"
                                disabled={tenant.status === 'deleted'}
                                startIcon={<Iconify icon={'solar:pen-bold-duotone' as any} />}
                                onClick={() => setEditTenant(tenant)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                color="inherit"
                                variant="outlined"
                                disabled={tenant.status === 'deleted'}
                                startIcon={<Iconify icon={'solar:global-bold-duotone' as any} />}
                                onClick={() => setDomainSlug(tenant.slug)}
                              >
                                Domain
                              </Button>
                              {tenant.status === 'suspended' ? (
                                <Button
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  onClick={() => setPending({ tenant, action: 'resume' })}
                                >
                                  Resume
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  disabled={tenant.status === 'deleted'}
                                  onClick={() => setPending({ tenant, action: 'suspend' })}
                                >
                                  Suspend
                                </Button>
                              )}
                              <Button
                                size="small"
                                color="error"
                                variant="contained"
                                disabled={tenant.status === 'deleted'}
                                onClick={() => setPending({ tenant, action: 'delete' })}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </Card>
        </Stack>
      </Container>

      <Dialog
        open={!!pending}
        onClose={() => {
          if (busy) return;
          setPending(null);
          setConfirmText('');
        }}
      >
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{pending?.action} tenant</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pending?.action === 'suspend' &&
              `Suspend "${pending?.tenant.name}"? Its storefront and admin will stop working until resumed.`}
            {pending?.action === 'resume' &&
              `Resume "${pending?.tenant.name}"? Its storefront and admin will become reachable again.`}
            {pending?.action === 'delete' &&
              `Delete "${pending?.tenant.name}"? This permanently drops its database (${pending?.tenant.dbName}) and all its data. This CANNOT be undone.`}
          </DialogContentText>
          {pending?.action === 'delete' && (
            <>
              <DialogContentText sx={{ mt: 2 }}>
                Type the tenant slug <strong>{pending?.tenant.slug}</strong> to confirm:
              </DialogContentText>
              <TextField
                fullWidth
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={pending?.tenant.slug}
                disabled={busy}
                sx={{ mt: 1 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPending(null);
              setConfirmText('');
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmAction}
            disabled={
              busy ||
              (pending?.action === 'delete' && confirmText.trim() !== pending?.tenant.slug)
            }
            color={pending?.action === 'resume' ? 'success' : 'error'}
            variant="contained"
          >
            {busy ? <CircularProgress size={20} /> : <Box component="span">Confirm</Box>}
          </Button>
        </DialogActions>
      </Dialog>

      <TenantWizardDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={() => {
          setWizardOpen(false);
          fetchTenants();
        }}
      />

      <DomainDialog
        open={!!domainSlug}
        tenant={tenants.find((t) => t.slug === domainSlug) ?? null}
        onClose={() => setDomainSlug(null)}
        onChanged={fetchTenants}
      />

      <TenantDetailsDialog
        open={!!detailsSlug}
        slug={detailsSlug}
        onClose={() => setDetailsSlug(null)}
        onEdit={(t) => {
          setDetailsSlug(null);
          setEditTenant(t);
        }}
      />

      <TenantEditDialog
        open={!!editTenant}
        tenant={editTenant}
        onClose={() => setEditTenant(null)}
        onSaved={fetchTenants}
      />
    </>
  );
}
