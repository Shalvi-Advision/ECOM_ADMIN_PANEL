import type { ProvisioningJob, ProvisionTenantInput } from 'src/services/tenants';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import {
  provisionTenant,
  getProvisioningJob,
  getCatalogTemplates,
} from 'src/services/tenants';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STEPS = [
  'Identity',
  'Branding',
  'Integrations',
  'Admin',
  'Catalog',
  'Review & Create',
];

type FormState = {
  name: string;
  slug: string;
  subdomain: string;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  smsBaseUrl: string;
  smsUserId: string;
  smsPassword: string;
  smsSenderId: string;
  smsClientName: string;
  adminName: string;
  adminMobile: string;
  template: string;
  storeCode: string;
};

const INITIAL_FORM: FormState = {
  name: '',
  slug: '',
  subdomain: '',
  appName: '',
  primaryColor: '',
  secondaryColor: '',
  logoUrl: '',
  razorpayKeyId: '',
  razorpayKeySecret: '',
  smsBaseUrl: '',
  smsUserId: '',
  smsPassword: '',
  smsSenderId: '',
  smsClientName: '',
  adminName: '',
  adminMobile: '',
  template: 'grocery',
  storeCode: 'MAIN',
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function buildInput(form: FormState): ProvisionTenantInput {
  const branding: Record<string, string> = {};
  if (form.appName.trim()) branding.appName = form.appName.trim();
  if (form.primaryColor.trim()) branding.primaryColor = form.primaryColor.trim();
  if (form.secondaryColor.trim()) branding.secondaryColor = form.secondaryColor.trim();
  if (form.logoUrl.trim()) branding.logoUrl = form.logoUrl.trim();

  const integrations: ProvisionTenantInput['integrations'] = {};
  if (form.razorpayKeyId.trim()) {
    integrations.razorpay = {
      keyId: form.razorpayKeyId.trim(),
      keySecret: form.razorpayKeySecret.trim(),
    };
  }
  if (form.smsBaseUrl.trim()) {
    integrations.sms = {
      baseUrl: form.smsBaseUrl.trim(),
      userId: form.smsUserId.trim(),
      password: form.smsPassword.trim(),
      ...(form.smsSenderId.trim() ? { senderId: form.smsSenderId.trim() } : {}),
      ...(form.smsClientName.trim() ? { clientName: form.smsClientName.trim() } : {}),
    };
  }

  const input: ProvisionTenantInput = {
    name: form.name.trim(),
    slug: form.slug.trim(),
    subdomain: form.subdomain.trim(),
    adminUser: {
      mobile: form.adminMobile.trim(),
      ...(form.adminName.trim() ? { name: form.adminName.trim() } : {}),
    },
  };

  if (Object.keys(branding).length > 0) input.branding = branding;
  if (Object.keys(integrations).length > 0) input.integrations = integrations;

  const catalog: { template?: string; storeCode?: string } = {};
  if (form.template.trim()) catalog.template = form.template.trim();
  if (form.storeCode.trim()) catalog.storeCode = form.storeCode.trim();
  if (Object.keys(catalog).length > 0) input.catalog = catalog;

  return input;
}

const STEP_STATUS_ICON: Record<ProvisioningJob['steps'][number]['status'], string> = {
  pending: 'solar:clock-circle-bold-duotone',
  running: 'solar:refresh-bold-duotone',
  done: 'solar:check-circle-bold-duotone',
  failed: 'solar:close-circle-bold-duotone',
  rolledback: 'solar:undo-left-round-bold-duotone',
};

const STEP_STATUS_COLOR: Record<
  ProvisioningJob['steps'][number]['status'],
  'success' | 'error' | 'warning' | 'disabled' | 'inherit'
> = {
  pending: 'disabled',
  running: 'warning',
  done: 'success',
  failed: 'error',
  rolledback: 'inherit',
};

export function TenantWizardDialog({ open, onClose, onCreated }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [stepError, setStepError] = useState('');
  const [templates, setTemplates] = useState<string[]>([]);

  const [creating, setCreating] = useState(false);
  const [job, setJob] = useState<ProvisioningJob | null>(null);
  const [createdSlug, setCreatedSlug] = useState('');
  const [createError, setCreateError] = useState('');

  const setField = useCallback(
    (key: keyof FormState) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
        setStepError('');
      },
    []
  );

  // Reset everything whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setForm(INITIAL_FORM);
      setStepError('');
      setCreating(false);
      setJob(null);
      setCreatedSlug('');
      setCreateError('');
    }
  }, [open]);

  // Load catalog templates once the dialog opens.
  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    getCatalogTemplates()
      .then((res) => {
        if (active && res.success && Array.isArray(res.data)) {
          setTemplates(res.data);
        }
      })
      .catch(() => {
        /* non-fatal: keep default 'grocery' */
      });
    return () => {
      active = false;
    };
  }, [open]);

  const validateStep = useCallback(
    (stepIndex: number): string => {
      if (stepIndex === 0) {
        if (!form.name.trim()) return 'Name is required';
        if (!form.slug.trim()) return 'Slug is required';
        if (!/^[a-z0-9-]+$/.test(form.slug.trim()))
          return 'Slug must be lowercase letters, numbers and hyphens only';
        if (!form.subdomain.trim()) return 'Subdomain is required';
        if (!/^[a-z0-9-]+$/.test(form.subdomain.trim()))
          return 'Subdomain must be lowercase letters, numbers and hyphens only';
      }
      if (stepIndex === 2) {
        if (form.razorpayKeyId.trim() && !form.razorpayKeySecret.trim())
          return 'Razorpay key secret is required when key id is set';
        if (form.smsBaseUrl.trim()) {
          if (!form.smsUserId.trim()) return 'SMS user id is required';
          if (!form.smsPassword.trim()) return 'SMS password is required';
        }
      }
      if (stepIndex === 3) {
        if (!form.adminMobile.trim()) return 'Admin mobile is required';
        if (!/^\d{10}$/.test(form.adminMobile.trim()))
          return 'Admin mobile must be a 10-digit number';
      }
      return '';
    },
    [form]
  );

  const handleNext = useCallback(() => {
    const err = validateStep(activeStep);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    setActiveStep((prev) => prev + 1);
  }, [activeStep, validateStep]);

  const handleBack = useCallback(() => {
    setStepError('');
    setActiveStep((prev) => prev - 1);
  }, []);

  // Poll the provisioning job until it settles.
  useEffect(() => {
    if (!createdSlug || !creating) return undefined;
    let active = true;
    const poll = async () => {
      try {
        const res = await getProvisioningJob(createdSlug);
        if (!active) return;
        if (res.success) {
          setJob(res.data);
          if (res.data.status === 'done') {
            setCreating(false);
            onCreated();
            return;
          }
          if (res.data.status === 'failed' || res.data.status === 'rolledback') {
            setCreating(false);
            setCreateError(res.data.error || 'Provisioning failed');
            return;
          }
        }
      } catch {
        /* transient — keep polling */
      }
    };
    poll();
    const timer = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [createdSlug, creating, onCreated]);

  const handleCreate = useCallback(async () => {
    setCreateError('');
    setCreating(true);
    setJob(null);
    try {
      const input = buildInput(form);
      const res = await provisionTenant(input);
      if (res.success) {
        setCreatedSlug(res.data.slug || form.slug.trim());
      } else {
        setCreating(false);
        setCreateError(res.message || 'Failed to create tenant');
      }
    } catch (err: any) {
      setCreating(false);
      setCreateError(err.message || 'Failed to create tenant');
    }
  }, [form]);

  const isLastStep = activeStep === STEPS.length - 1;
  const jobInProgress = creating || (!!job && (job.status === 'pending' || job.status === 'running'));

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={setField('name')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Slug"
              value={form.slug}
              onChange={setField('slug')}
              helperText="Lowercase letters, numbers and hyphens (DNS-safe). e.g. acme-store"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Subdomain"
              value={form.subdomain}
              onChange={setField('subdomain')}
              helperText="Lowercase, DNS-safe. e.g. acme (becomes acme.yourdomain.com)"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              All branding fields are optional.
            </Typography>
            <TextField
              fullWidth
              label="App Name"
              value={form.appName}
              onChange={setField('appName')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Primary Color"
              value={form.primaryColor}
              onChange={setField('primaryColor')}
              placeholder="#1976d2"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Secondary Color"
              value={form.secondaryColor}
              onChange={setField('secondaryColor')}
              placeholder="#9c27b0"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Logo URL"
              value={form.logoUrl}
              onChange={setField('logoUrl')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        );
      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              All integrations are optional. Fill a section&apos;s first field to enable it.
            </Typography>
            <Stack spacing={2}>
              <Typography variant="subtitle2">Razorpay</Typography>
              <TextField
                fullWidth
                label="Key ID"
                value={form.razorpayKeyId}
                onChange={setField('razorpayKeyId')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Key Secret"
                value={form.razorpayKeySecret}
                onChange={setField('razorpayKeySecret')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <Stack spacing={2}>
              <Typography variant="subtitle2">SMS</Typography>
              <TextField
                fullWidth
                label="Base URL"
                value={form.smsBaseUrl}
                onChange={setField('smsBaseUrl')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="User ID"
                value={form.smsUserId}
                onChange={setField('smsUserId')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Password"
                value={form.smsPassword}
                onChange={setField('smsPassword')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Sender ID"
                value={form.smsSenderId}
                onChange={setField('smsSenderId')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Client Name"
                value={form.smsClientName}
                onChange={setField('smsClientName')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Stack>
        );
      case 3:
        return (
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Admin Name"
              value={form.adminName}
              onChange={setField('adminName')}
              helperText="Optional"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Admin Mobile"
              value={form.adminMobile}
              onChange={setField('adminMobile')}
              helperText="10-digit mobile number (required)"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        );
      case 4:
        return (
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel id="catalog-template-label" shrink>
                Template
              </InputLabel>
              <Select
                labelId="catalog-template-label"
                label="Template"
                value={form.template}
                onChange={(event) => setForm((prev) => ({ ...prev, template: event.target.value }))}
              >
                {(templates.length > 0 ? templates : ['grocery']).map((tpl) => (
                  <MenuItem key={tpl} value={tpl}>
                    {tpl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Store Code"
              value={form.storeCode}
              onChange={setField('storeCode')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        );
      case 5:
        return renderReview();
      default:
        return null;
    }
  };

  const renderReview = () => {
    if (job || creating) {
      return (
        <Stack spacing={2}>
          <Typography variant="subtitle1">Provisioning {createdSlug}</Typography>
          {!job && creating && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Starting provisioning…
              </Typography>
            </Stack>
          )}
          {job && (
            <Stack spacing={1}>
              {job.steps.map((s) => (
                <Stack key={s.key} direction="row" spacing={1.5} alignItems="center">
                  <Iconify
                    icon={STEP_STATUS_ICON[s.status] as any}
                    sx={{ color: `${STEP_STATUS_COLOR[s.status]}.main` }}
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {s.key}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.status}
                  </Typography>
                  {s.error && (
                    <Typography variant="caption" color="error">
                      {s.error}
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
          {createError && <Alert severity="error">{createError}</Alert>}
          {job?.status === 'done' && <Alert severity="success">Tenant provisioned.</Alert>}
        </Stack>
      );
    }

    const summary: Array<[string, string]> = [
      ['Name', form.name],
      ['Slug', form.slug],
      ['Subdomain', form.subdomain],
      ['App Name', form.appName || '—'],
      ['Admin Mobile', form.adminMobile],
      ['Admin Name', form.adminName || '—'],
      ['Razorpay', form.razorpayKeyId ? 'configured' : '—'],
      ['SMS', form.smsBaseUrl ? 'configured' : '—'],
      ['Template', form.template],
      ['Store Code', form.storeCode],
    ];
    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Review the details below and create the tenant.
        </Typography>
        <Stack spacing={1}>
          {summary.map(([label, value]) => (
            <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
        {createError && <Alert severity="error">{createError}</Alert>}
      </Stack>
    );
  };

  const handleClose = useCallback(() => {
    if (jobInProgress) return; // don't allow closing mid-provision
    onClose();
  }, [jobInProgress, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Tenant</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ my: 3 }} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2 }}>{renderStepContent()}</Box>

        {stepError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {stepError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={jobInProgress} color="inherit">
          {job?.status === 'done' ? 'Close' : 'Cancel'}
        </Button>
        {activeStep > 0 && !creating && !job && (
          <Button onClick={handleBack} color="inherit">
            Back
          </Button>
        )}
        {!isLastStep && (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        )}
        {isLastStep && !job?.status && (
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Create Tenant'}
          </Button>
        )}
        {isLastStep && (job?.status === 'failed' || job?.status === 'rolledback') && (
          <Button onClick={handleCreate} variant="contained">
            Retry
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
