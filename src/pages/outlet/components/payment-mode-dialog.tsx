import type { PaymentMode, PaymentModePayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { createPaymentMode, updatePaymentMode } from 'src/services/payment-modes';

interface PaymentModeDialogProps {
  open: boolean;
  paymentMode: PaymentMode | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModeDialog({
  open,
  paymentMode,
  onClose,
  onSuccess,
}: PaymentModeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [idPaymentMode, setIdPaymentMode] = useState<number | ''>('');
  const [paymentModeName, setPaymentModeName] = useState('');
  const [isEnabled, setIsEnabled] = useState<'Yes' | 'No'>('No');

  // Load data when editing
  useEffect(() => {
    if (paymentMode) {
      setIdPaymentMode(paymentMode.idpayment_mode);
      setPaymentModeName(paymentMode.payment_mode_name);
      setIsEnabled(paymentMode.is_enabled);
    } else {
      // Reset form for create
      setIdPaymentMode('');
      setPaymentModeName('');
      setIsEnabled('No');
    }
    setError('');
  }, [paymentMode, open]);

  const validateForm = (): boolean => {
    // Validate Payment Mode ID
    if (idPaymentMode === '' || idPaymentMode <= 0) {
      setError('Payment Mode ID is required and must be a positive number');
      return false;
    }

    // Validate payment mode name
    if (!paymentModeName.trim()) {
      setError('Payment Mode Name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: PaymentModePayload = {
      idpayment_mode: Number(idPaymentMode),
      payment_mode_name: paymentModeName.trim(),
      is_enabled: isEnabled,
    };

    try {
      if (paymentMode) {
        await updatePaymentMode(paymentMode._id, payload);
      } else {
        await createPaymentMode(payload);
      }
      onSuccess();
    } catch (err: any) {
      // Handle unique constraint error
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setError('This Payment Mode ID already exists');
      } else {
        setError(err.message || 'Failed to save payment mode');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or positive numbers only
    if (value === '') {
      setIdPaymentMode('');
    } else {
      const numValue = parseInt(value, 10);
      if (!Number.isNaN(numValue) && numValue > 0) {
        setIdPaymentMode(numValue);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {paymentMode ? 'Edit Payment Mode' : 'Create Payment Mode'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Payment Mode ID"
            value={idPaymentMode}
            onChange={handleIdChange}
            type="number"
            required
            disabled={!!paymentMode} // Disable editing ID when updating
            helperText={
              paymentMode
                ? 'ID cannot be changed when editing'
                : 'Unique identifier (positive integer)'
            }
          />

          <TextField
            fullWidth
            label="Payment Mode Name"
            value={paymentModeName}
            onChange={(e) => setPaymentModeName(e.target.value)}
            required
            placeholder="e.g., Online Payment, POD, Bank Transfer"
          />

          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              value={isEnabled}
              label="Status"
              onChange={(e) => setIsEnabled(e.target.value as 'Yes' | 'No')}
            >
              <MenuItem value="Yes">Enabled</MenuItem>
              <MenuItem value="No">Disabled</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : paymentMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
