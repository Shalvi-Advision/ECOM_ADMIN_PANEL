import type { BestSeller, BestSellerPayload, BestSellerProduct } from 'src/types/api';

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

import { createBestSeller, updateBestSeller } from 'src/services/best-sellers';

import { Iconify } from 'src/components/iconify';

interface BestSellerDialogProps {
  open: boolean;
  bestSeller: BestSeller | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BestSellerDialog({ open, bestSeller, onClose, onSuccess }: BestSellerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [desktopBanner, setDesktopBanner] = useState('');
  const [mobileBanner, setMobileBanner] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sequence, setSequence] = useState(0);
  const [products, setProducts] = useState<BestSellerProduct[]>([]);

  // Load data when editing
  useEffect(() => {
    if (bestSeller) {
      setTitle(bestSeller.title || '');
      setDescription(bestSeller.description || '');
      setStoreCode(bestSeller.store_code || '');
      setStoreCodes(bestSeller.store_codes || []);
      setDesktopBanner(bestSeller.banner_urls?.desktop || '');
      setMobileBanner(bestSeller.banner_urls?.mobile || '');
      setBackgroundColor(bestSeller.background_color || '#ffffff');
      setRedirectUrl(bestSeller.redirect_url || '');
      setIsActive(bestSeller.is_active);
      setSequence(bestSeller.sequence || 0);
      setProducts(bestSeller.products || []);
    } else {
      // Reset form for create
      setTitle('');
      setDescription('');
      setStoreCode('');
      setStoreCodes([]);
      setDesktopBanner('');
      setMobileBanner('');
      setBackgroundColor('#ffffff');
      setRedirectUrl('');
      setIsActive(true);
      setSequence(0);
      setProducts([]);
    }
    setError('');
  }, [bestSeller, open]);

  const handleAddStoreCode = () => {
    if (storeCode.trim() && !storeCodes.includes(storeCode.trim())) {
      setStoreCodes([...storeCodes, storeCode.trim()]);
      setStoreCode('');
    }
  };

  const handleRemoveStoreCode = (index: number) => {
    setStoreCodes(storeCodes.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    setProducts([
      ...products,
      { p_code: '', position: products.length + 1, metadata: {}, redirect_url: '' },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (
    index: number,
    field: keyof BestSellerProduct | 'badge' | 'tagline' | 'highlight',
    value: string | number | boolean
  ) => {
    const newProducts = [...products];
    if (field === 'badge' || field === 'tagline' || field === 'highlight') {
      newProducts[index] = {
        ...newProducts[index],
        metadata: { ...newProducts[index].metadata, [field]: value },
      };
    } else {
      newProducts[index] = { ...newProducts[index], [field]: value };
    }
    setProducts(newProducts);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!desktopBanner.trim()) {
      setError('Desktop banner URL is required');
      return false;
    }
    if (!mobileBanner.trim()) {
      setError('Mobile banner URL is required');
      return false;
    }
    if (!backgroundColor.trim()) {
      setError('Background color is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: BestSellerPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      store_code: storeCode.trim() || undefined,
      store_codes: storeCodes.length > 0 ? storeCodes : undefined,
      banner_urls: {
        desktop: desktopBanner.trim(),
        mobile: mobileBanner.trim(),
      },
      background_color: backgroundColor.trim(),
      redirect_url: redirectUrl.trim() || undefined,
      is_active: isActive,
      sequence,
      products: products.filter((p) => p.p_code.trim()),
    };

    try {
      if (bestSeller) {
        await updateBestSeller(bestSeller._id, payload);
      } else {
        await createBestSeller(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save best seller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{bestSeller ? 'Edit Best Seller' : 'Create Best Seller'}</DialogTitle>

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

          <TextField
            fullWidth
            label="Desktop Banner URL"
            value={desktopBanner}
            onChange={(e) => setDesktopBanner(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Mobile Banner URL"
            value={mobileBanner}
            onChange={(e) => setMobileBanner(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Background Color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            type="color"
            required
          />

          <TextField
            fullWidth
            label="Redirect URL"
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
          />

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

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <span>Products</span>
              <Button size="small" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleAddProduct}>
                Add Product
              </Button>
            </Stack>

            <Stack spacing={2}>
              {products.map((product, index) => (
                <Box key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
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
                        onChange={(e) => handleProductChange(index, 'position', Number(e.target.value))}
                        type="number"
                        sx={{ flex: 1 }}
                      />
                      <IconButton size="small" color="error" onClick={() => handleRemoveProduct(index)}>
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
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        label="Badge (metadata)"
                        value={product.metadata?.badge || ''}
                        onChange={(e) => handleProductChange(index, 'badge', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Tagline (metadata)"
                        value={product.metadata?.tagline || ''}
                        onChange={(e) => handleProductChange(index, 'tagline', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={product.metadata?.highlight || false}
                            onChange={(e) => handleProductChange(index, 'highlight', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Highlight"
                      />
                    </Stack>
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
          {loading ? <CircularProgress size={24} /> : bestSeller ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
