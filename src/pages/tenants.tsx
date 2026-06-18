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
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { CONFIG } from 'src/config-global';
import { getTenants, resumeTenant, suspendTenant } from 'src/services/tenants';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<TenantStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  provisioning: 'warning',
  suspended: 'error',
  deleted: 'default',
};

type PendingAction = { tenant: Tenant; action: 'suspend' | 'resume' } | null;

export default function Page() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTenants();
      if (response.success) {
        setTenants(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants');
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
      } else {
        await resumeTenant(pending.tenant.slug);
      }
      setPending(null);
      await fetchTenants();
    } catch (err: any) {
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
            <Button
              variant="outlined"
              startIcon={<Iconify icon={'solar:refresh-bold-duotone' as any} />}
              onClick={fetchTenants}
            >
              Refresh
            </Button>
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
                          <TableCell>{tenant.customDomain || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={tenant.status}
                              color={STATUS_COLOR[tenant.status] || 'default'}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell align="right">
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

      <Dialog open={!!pending} onClose={() => !busy && setPending(null)}>
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{pending?.action} tenant</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pending?.action === 'suspend'
              ? `Suspend "${pending?.tenant.name}"? Its storefront and admin will stop working until resumed.`
              : `Resume "${pending?.tenant.name}"? Its storefront and admin will become reachable again.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={confirmAction}
            disabled={busy}
            color={pending?.action === 'suspend' ? 'error' : 'success'}
            variant="contained"
          >
            {busy ? <CircularProgress size={20} /> : <Box component="span">Confirm</Box>}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
