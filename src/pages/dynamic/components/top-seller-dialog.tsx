import type { TopSeller, TopSellerPayload, TopSellerProduct } from 'src/types/api';

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

import { createTopSeller, updateTopSeller } from 'src/services/top-sellers';

import { Iconify } from 'src/components/iconify';

import StoreCodeSelector from './store-code-selector';

interface TopSellerDialogProps {
  open: boolean;
  topSeller: TopSeller | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TopSellerDialog({ open, topSeller, onClose, onSuccess }: TopSellerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isActive, setIsActive] = useState(true);
  const [sequence, setSequence] = useState(0);
  const [products, setProducts] = useState<TopSellerProduct[]>([]);

  // Load data when editing
  useEffect(() => {
    if (topSeller) {
      setTitle(topSeller.title || '');
      // Combine both store_code and store_codes for backward compatibility
      const codes = topSeller.store_codes || [];
      if (topSeller.store_code && !codes.includes(topSeller.store_code)) {
        codes.push(topSeller.store_code);
      }
      setStoreCodes(codes);
      setBgColor(topSeller.bg_color || '#ffffff');
      setIsActive(topSeller.is_active);
      setSequence(topSeller.sequence || 0);
      setProducts(topSeller.products || []);
    } else {
      // Reset form for create
      setTitle('');
      setStoreCodes([]);
      setBgColor('#ffffff');
      setIsActive(true);
      setSequence(0);
      setProducts([]);
    }
    setError('');
  }, [topSeller, open]);

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
    field: keyof TopSellerProduct | 'badge' | 'tagline' | 'highlight',
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
    if (!bgColor.trim()) {
      setError('Background color is required');
      return false;
    }
    if (products.length === 0 || !products.some((p) => p.p_code.trim())) {
      setError('At least one product with p_code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: TopSellerPayload = {
      title: title.trim(),
      store_codes: storeCodes.length > 0 ? storeCodes : undefined,
      bg_color: bgColor.trim(),
      is_active: isActive,
      sequence,
      products: products.filter((p) => p.p_code.trim()),
    };

    try {
      if (topSeller) {
        await updateTopSeller(topSeller._id, payload);
      } else {
        await createTopSeller(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save top seller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{topSeller ? 'Edit Top Seller' : 'Create Top Seller'}</DialogTitle>

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

          <StoreCodeSelector
            value={storeCodes}
            onChange={setStoreCodes}
            label="Select Store Codes"
            helperText="Select one or more store codes for this top seller section"
          />

          <TextField
            fullWidth
            label="Background Color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            type="color"
            required
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
                        onChange={(e) => handleProductChange(index, 'position', Number(e.target.value))}
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
          {loading ? <CircularProgress size={24} /> : topSeller ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

