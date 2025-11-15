import type { Banner, BannerPayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { createBanner, updateBanner } from 'src/services/banners';

import { Iconify } from 'src/components/iconify';
import { ImageUpload } from 'src/components/image-upload';

interface BannerDialogProps {
  open: boolean;
  banner: Banner | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BannerDialog({ open, banner, onClose, onSuccess }: BannerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionType, setActionType] = useState<'category' | 'product' | 'url' | 'none'>('none');
  const [actionValue, setActionValue] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [sequence, setSequence] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [metadataJson, setMetadataJson] = useState('{}');

  // Load data when editing
  useEffect(() => {
    if (banner) {
      setTitle(banner.title || '');
      setSectionName(banner.section_name || '');
      setImageUrl(banner.image_url || '');
      setActionType(banner.action?.type || 'none');
      setActionValue(banner.action?.value || '');
      setStoreCode(banner.store_code || '');
      setStoreCodes(banner.store_codes || []);
      setIsActive(banner.is_active);
      setSequence(banner.sequence || 0);
      setStartDate(banner.start_date ? banner.start_date.split('T')[0] : '');
      setEndDate(banner.end_date ? banner.end_date.split('T')[0] : '');
      setMetadataJson(JSON.stringify(banner.metadata || {}, null, 2));
    } else {
      // Reset form for create
      setTitle('');
      setSectionName('');
      setImageUrl('');
      setActionType('none');
      setActionValue('');
      setStoreCode('');
      setStoreCodes([]);
      setIsActive(true);
      setSequence(0);
      setStartDate('');
      setEndDate('');
      setMetadataJson('{}');
    }
    setError('');
  }, [banner, open]);

  const handleAddStoreCode = () => {
    if (storeCode.trim() && !storeCodes.includes(storeCode.trim())) {
      setStoreCodes([...storeCodes, storeCode.trim()]);
      setStoreCode('');
    }
  };

  const handleRemoveStoreCode = (index: number) => {
    setStoreCodes(storeCodes.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!sectionName.trim()) {
      setError('Section Name is required');
      return false;
    }
    if (!imageUrl.trim()) {
      setError('Image URL is required');
      return false;
    }
    if (actionType !== 'none' && !actionValue.trim()) {
      setError(`Action value is required for action type "${actionType}"`);
      return false;
    }

    // Validate metadata JSON
    try {
      JSON.parse(metadataJson);
    } catch {
      setError('Metadata must be valid JSON');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    let metadata;
    try {
      metadata = JSON.parse(metadataJson);
    } catch {
      metadata = {};
    }

    const payload: BannerPayload = {
      title: title.trim(),
      section_name: sectionName.trim(),
      image_url: imageUrl.trim(),
      action: {
        type: actionType,
        value: actionType !== 'none' ? actionValue.trim() : undefined,
      },
      store_code: storeCode.trim() || undefined,
      store_codes: storeCodes.length > 0 ? storeCodes : undefined,
      is_active: isActive,
      sequence,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    try {
      if (banner) {
        await updateBanner(banner._id, payload);
      } else {
        await createBanner(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{banner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Section Name"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            required
            helperText="e.g., home_top, home_middle, category_banner"
          />

          <ImageUpload
            label="Banner Image"
            value={imageUrl}
            onChange={setImageUrl}
            required
            folder="banners"
            helperText="Upload image or enter URL (max 5MB)"
          />

          <FormControl fullWidth required>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={actionType}
              label="Action Type"
              onChange={(e) => setActionType(e.target.value as any)}
            >
              <MenuItem value="none">None (Display Only)</MenuItem>
              <MenuItem value="category">Navigate to Category</MenuItem>
              <MenuItem value="product">Navigate to Product</MenuItem>
              <MenuItem value="url">Open URL</MenuItem>
            </Select>
          </FormControl>

          {actionType !== 'none' && (
            <TextField
              fullWidth
              label={
                actionType === 'category'
                  ? 'Category ID'
                  : actionType === 'product'
                    ? 'Product SKU'
                    : 'URL'
              }
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              required
              helperText={
                actionType === 'category'
                  ? 'e.g., woodenware'
                  : actionType === 'product'
                    ? 'e.g., SKU44112'
                    : 'e.g., https://example.com/offers'
              }
            />
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Store Code (Single)"
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              helperText="Single store code or use the array below"
            />
          </Stack>

          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Add Store Code to Array"
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStoreCode();
                  }
                }}
              />
              <Button variant="outlined" onClick={handleAddStoreCode}>
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {storeCodes.map((code, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  <span>{code}</span>
                  <IconButton size="small" onClick={() => handleRemoveStoreCode(index)}>
                    <Iconify icon="mingcute:close-line" width={16} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
            <TextField
              fullWidth
              label="End Date (Optional)"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              type="date"
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
          </Stack>

          <TextField
            fullWidth
            label="Sequence"
            value={sequence}
            onChange={(e) => setSequence(Number(e.target.value))}
            type="number"
          />

          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Is Active"
          />

          <TextField
            fullWidth
            label="Metadata (JSON)"
            value={metadataJson}
            onChange={(e) => setMetadataJson(e.target.value)}
            multiline
            rows={3}
            helperText="Enter valid JSON, e.g., {&quot;campaign&quot;: &quot;new-arrivals-2025&quot;}"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : banner ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
