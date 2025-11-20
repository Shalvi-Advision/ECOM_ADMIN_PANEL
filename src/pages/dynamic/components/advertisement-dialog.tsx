import type { Advertisement, AdvertisementPayload, AdvertisementProduct } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { createAdvertisement, updateAdvertisement } from 'src/services/advertisements';

import { Iconify } from 'src/components/iconify';
import { ImageUpload } from 'src/components/image-upload';

import StoreCodeSelector from './store-code-selector';

interface AdvertisementDialogProps {
  open: boolean;
  advertisement: Advertisement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdvertisementDialog({
  open,
  advertisement,
  onClose,
  onSuccess,
}: AdvertisementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [bannerUrl, setBannerUrl] = useState('');
  const [desktopBanner, setDesktopBanner] = useState('');
  const [mobileBanner, setMobileBanner] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sequence, setSequence] = useState(0);
  const [products, setProducts] = useState<AdvertisementProduct[]>([]);
  const [metadataJson, setMetadataJson] = useState('{}');

  // Load data when editing
  useEffect(() => {
    if (advertisement) {
      setTitle(advertisement.title || '');
      setDescription(advertisement.description || '');
      setCategory(advertisement.category || '');
      // Combine both store_code and store_codes for backward compatibility
      const codes = advertisement.store_codes || [];
      if (advertisement.store_code && !codes.includes(advertisement.store_code)) {
        codes.push(advertisement.store_code);
      }
      setStoreCodes(codes);
      setBannerUrl(advertisement.banner_url || '');
      setDesktopBanner(advertisement.banner_urls?.desktop || '');
      setMobileBanner(advertisement.banner_urls?.mobile || '');
      setRedirectUrl(advertisement.redirect_url || '');
      setIsActive(advertisement.is_active);
      setStartDate(advertisement.start_date ? advertisement.start_date.split('T')[0] : '');
      setEndDate(advertisement.end_date ? advertisement.end_date.split('T')[0] : '');
      setSequence(advertisement.sequence || 0);
      setProducts(advertisement.products || []);
      setMetadataJson(JSON.stringify(advertisement.metadata || {}, null, 2));
    } else {
      // Reset form for create
      setTitle('');
      setDescription('');
      setCategory('');
      setStoreCodes([]);
      setBannerUrl('');
      setDesktopBanner('');
      setMobileBanner('');
      setRedirectUrl('');
      setIsActive(true);
      setStartDate('');
      setEndDate('');
      setSequence(0);
      setProducts([]);
      setMetadataJson('{}');
    }
    setError('');
  }, [advertisement, open]);

  const handleAddProduct = () => {
    setProducts([...products, { p_code: '', position: products.length + 1, redirect_url: '' }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (
    index: number,
    field: keyof AdvertisementProduct,
    value: string | number
  ) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!category.trim()) {
      setError('Category is required');
      return false;
    }
    if (!bannerUrl.trim()) {
      setError('Banner URL is required');
      return false;
    }
    if (!startDate) {
      setError('Start date is required');
      return false;
    }
    if (products.length === 0 || !products.some((p) => p.p_code.trim())) {
      setError('At least one product is required');
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

    const payload: AdvertisementPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      store_codes: storeCodes.length > 0 ? storeCodes : undefined,
      banner_url: bannerUrl.trim(),
      banner_urls:
        desktopBanner.trim() && mobileBanner.trim()
          ? {
              desktop: desktopBanner.trim(),
              mobile: mobileBanner.trim(),
            }
          : undefined,
      redirect_url: redirectUrl.trim() || undefined,
      is_active: isActive,
      start_date: new Date(startDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      sequence,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      products: products.filter((p) => p.p_code.trim()),
    };

    try {
      if (advertisement) {
        await updateAdvertisement(advertisement._id, payload);
      } else {
        await createAdvertisement(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save advertisement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {advertisement ? 'Edit Advertisement' : 'Create Advertisement'}
      </DialogTitle>

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
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            helperText="e.g., homepage, banner, popup"
          />

          <StoreCodeSelector
            value={storeCodes}
            onChange={setStoreCodes}
            label="Select Store Codes"
            helperText="Select one or more store codes for this advertisement"
          />

          <ImageUpload
            label="Banner"
            value={bannerUrl}
            onChange={setBannerUrl}
            required
            folder="advertisements"
            helperText="Upload image or enter URL (max 5MB)"
          />

          <Stack direction="row" spacing={2}>
            <ImageUpload
              label="Desktop Banner (Optional)"
              value={desktopBanner}
              onChange={setDesktopBanner}
              folder="advertisements"
              helperText="Optional desktop-specific banner"
            />
            <ImageUpload
              label="Mobile Banner (Optional)"
              value={mobileBanner}
              onChange={setMobileBanner}
              folder="advertisements"
              helperText="Optional mobile-specific banner"
            />
          </Stack>

          <TextField
            fullWidth
            label="Redirect URL"
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              required
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
            helperText="Enter valid JSON, e.g., {&quot;campaign&quot;: &quot;diwali-2025&quot;, &quot;cta&quot;: &quot;Shop Now&quot;}"
          />

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <span>Products (Required)</span>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddProduct}
              >
                Add Product
              </Button>
            </Stack>

            <Stack spacing={2}>
              {products.map((product, index) => (
                <Box
                  key={index}
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        label="Product Code (p_code)"
                        value={product.p_code}
                        onChange={(e) => handleProductChange(index, 'p_code', e.target.value)}
                        required
                        sx={{ flex: 2 }}
                      />
                      <TextField
                        size="small"
                        label="Position"
                        value={product.position}
                        onChange={(e) =>
                          handleProductChange(index, 'position', Number(e.target.value))
                        }
                        type="number"
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                    <TextField
                      size="small"
                      label="Redirect URL"
                      value={product.redirect_url || ''}
                      onChange={(e) => handleProductChange(index, 'redirect_url', e.target.value)}
                      fullWidth
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : advertisement ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
