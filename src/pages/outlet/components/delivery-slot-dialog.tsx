import type { DeliverySlot, DeliverySlotPayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
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

import { createDeliverySlot, updateDeliverySlot } from 'src/services/delivery-slots';

interface DeliverySlotDialogProps {
  open: boolean;
  deliverySlot: DeliverySlot | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliverySlotDialog({
  open,
  deliverySlot,
  onClose,
  onSuccess,
}: DeliverySlotDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [idDeliverySlot, setIdDeliverySlot] = useState<number | ''>('');
  const [storeCode, setStoreCode] = useState('');
  const [deliverySlotFrom, setDeliverySlotFrom] = useState('');
  const [deliverySlotTo, setDeliverySlotTo] = useState('');
  const [isActive, setIsActive] = useState<'yes' | 'no'>('yes');

  // Load data when editing
  useEffect(() => {
    if (deliverySlot) {
      setIdDeliverySlot(deliverySlot.iddelivery_slot);
      setStoreCode(deliverySlot.store_code);
      // Convert "09:00:00" to "09:00" for time input
      setDeliverySlotFrom(deliverySlot.delivery_slot_from.substring(0, 5));
      setDeliverySlotTo(deliverySlot.delivery_slot_to.substring(0, 5));
      setIsActive(deliverySlot.is_active);
    } else {
      // Reset form for create
      setIdDeliverySlot('');
      setStoreCode('');
      setDeliverySlotFrom('');
      setDeliverySlotTo('');
      setIsActive('yes');
    }
    setError('');
  }, [deliverySlot, open]);

  const validateForm = (): boolean => {
    // Validate Delivery Slot ID
    if (idDeliverySlot === '' || idDeliverySlot <= 0) {
      setError('Delivery Slot ID is required and must be a positive number');
      return false;
    }

    // Validate store code
    if (!storeCode.trim()) {
      setError('Store Code is required');
      return false;
    }

    // Validate time slots
    if (!deliverySlotFrom.trim()) {
      setError('Delivery Slot From time is required');
      return false;
    }

    if (!deliverySlotTo.trim()) {
      setError('Delivery Slot To time is required');
      return false;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(deliverySlotFrom.trim())) {
      setError('Delivery Slot From must be in HH:MM format (e.g., 09:00)');
      return false;
    }

    if (!timeRegex.test(deliverySlotTo.trim())) {
      setError('Delivery Slot To must be in HH:MM format (e.g., 22:00)');
      return false;
    }

    // Validate that "from" time is before "to" time
    const fromMinutes = parseInt(deliverySlotFrom.split(':')[0], 10) * 60 +
                        parseInt(deliverySlotFrom.split(':')[1], 10);
    const toMinutes = parseInt(deliverySlotTo.split(':')[0], 10) * 60 +
                      parseInt(deliverySlotTo.split(':')[1], 10);

    if (fromMinutes >= toMinutes) {
      setError('Delivery Slot From must be earlier than Delivery Slot To');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    // Convert time format from "09:00" to "09:00:00"
    const payload: DeliverySlotPayload = {
      iddelivery_slot: Number(idDeliverySlot),
      store_code: storeCode.trim(),
      delivery_slot_from: `${deliverySlotFrom.trim()}:00`,
      delivery_slot_to: `${deliverySlotTo.trim()}:00`,
      is_active: isActive,
    };

    try {
      if (deliverySlot) {
        await updateDeliverySlot(deliverySlot._id, payload);
      } else {
        await createDeliverySlot(payload);
      }
      onSuccess();
    } catch (err: any) {
      // Handle unique constraint error
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setError('This Delivery Slot ID already exists');
      } else {
        setError(err.message || 'Failed to save delivery slot');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or positive numbers only
    if (value === '') {
      setIdDeliverySlot('');
    } else {
      const numValue = parseInt(value, 10);
      if (!Number.isNaN(numValue) && numValue > 0) {
        setIdDeliverySlot(numValue);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {deliverySlot ? 'Edit Delivery Slot' : 'Create Delivery Slot'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Delivery Slot ID"
            value={idDeliverySlot}
            onChange={handleIdChange}
            type="number"
            required
            disabled={!!deliverySlot} // Disable editing ID when updating
            helperText={
              deliverySlot
                ? 'ID cannot be changed when editing'
                : 'Unique identifier (positive integer)'
            }
          />

          <TextField
            fullWidth
            label="Store Code"
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
            required
            placeholder="e.g., KALYANEAST"
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Delivery Slot From"
                value={deliverySlotFrom}
                onChange={(e) => setDeliverySlotFrom(e.target.value)}
                required
                type="time"
                placeholder="09:00"
                helperText="24-hour format"
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Delivery Slot To"
                value={deliverySlotTo}
                onChange={(e) => setDeliverySlotTo(e.target.value)}
                required
                type="time"
                placeholder="22:00"
                helperText="24-hour format"
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
          </Grid>

          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              value={isActive}
              label="Status"
              onChange={(e) => setIsActive(e.target.value as 'yes' | 'no')}
            >
              <MenuItem value="yes">Active</MenuItem>
              <MenuItem value="no">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : deliverySlot ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
