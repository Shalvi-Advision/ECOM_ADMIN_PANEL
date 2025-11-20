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

import { parseBestSellerProducts } from 'src/utils/csv-parser';

import { createBestSeller, updateBestSeller } from 'src/services/best-sellers';

import { Iconify } from 'src/components/iconify';
import { CSVUpload } from 'src/components/csv-upload';
import { ImageUpload } from 'src/components/image-upload';

import StoreCodeSelector from './store-code-selector';

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
      // Combine both store_code and store_codes for backward compatibility
      const codes = bestSeller.store_codes || [];
      if (bestSeller.store_code && !codes.includes(bestSeller.store_code)) {
        codes.push(bestSeller.store_code);
      }
      setStoreCodes(codes);
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

  const handleAddProduct = () => {
    setProducts([
      ...products,
      { p_code: '', position: products.length + 1, metadata: {}, redirect_url: '' },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (content: string) => {
    try {
      const parsedProducts = parseBestSellerProducts(content);
      if (parsedProducts.length === 0) {
        setError('No valid products found in CSV');
        return;
      }
      setProducts(parsedProducts);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file');
    }
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

          <StoreCodeSelector
            value={storeCodes}
            onChange={setStoreCodes}
            label="Select Store Codes"
            helperText="Select one or more store codes for this best seller section"
          />

          <ImageUpload
            label="Desktop Banner"
            value={desktopBanner}
            onChange={setDesktopBanner}
            required
            folder="best-sellers"
            helperText="Upload image or enter URL (max 5MB)"
          />

          <ImageUpload
            label="Mobile Banner"
            value={mobileBanner}
            onChange={setMobileBanner}
            required
            folder="best-sellers"
            helperText="Upload image or enter URL (max 5MB)"
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

            <CSVUpload
              onUpload={handleCSVUpload}
              onError={(err) => setError(err)}
              templateName="best-seller-products.csv"
              label="Bulk Import Products via CSV"
              helperText="Upload a CSV file to add multiple products at once. This will replace existing products."
            />

            <Stack spacing={2} sx={{ mt: 2 }}>
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
