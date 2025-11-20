import type { PopularCategory, PopularCategoryItem, PopularCategoryPayload } from 'src/types/api';

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

import { parsePopularCategoryItems } from 'src/utils/csv-parser';

import { createPopularCategory, updatePopularCategory } from 'src/services/popular-categories';

import { Iconify } from 'src/components/iconify';
import { CSVUpload } from 'src/components/csv-upload';
import { ImageUpload } from 'src/components/image-upload';

import StoreCodeSelector from './store-code-selector';

interface PopularCategoryDialogProps {
  open: boolean;
  popularCategory: PopularCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PopularCategoryDialog({
  open,
  popularCategory,
  onClose,
  onSuccess,
}: PopularCategoryDialogProps) {
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
  const [subcategories, setSubcategories] = useState<PopularCategoryItem[]>([]);

  // Load data when editing
  useEffect(() => {
    if (popularCategory) {
      setTitle(popularCategory.title || '');
      setDescription(popularCategory.description || '');
      // Combine both store_code and store_codes for backward compatibility
      const codes = popularCategory.store_codes || [];
      if (popularCategory.store_code && !codes.includes(popularCategory.store_code)) {
        codes.push(popularCategory.store_code);
      }
      setStoreCodes(codes);
      setDesktopBanner(popularCategory.banner_urls?.desktop || '');
      setMobileBanner(popularCategory.banner_urls?.mobile || '');
      setBackgroundColor(popularCategory.background_color || '#ffffff');
      setRedirectUrl(popularCategory.redirect_url || '');
      setIsActive(popularCategory.is_active);
      setSequence(popularCategory.sequence || 0);
      setSubcategories(popularCategory.subcategories || []);
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
      setSubcategories([]);
    }
    setError('');
  }, [popularCategory, open]);

  const handleAddSubcategory = () => {
    setSubcategories([
      ...subcategories,
      { sub_category_id: '', position: subcategories.length + 1, metadata: {}, redirect_url: '' },
    ]);
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (content: string) => {
    try {
      const parsedItems = parsePopularCategoryItems(content);
      if (parsedItems.length === 0) {
        setError('No valid subcategories found in CSV');
        return;
      }
      setSubcategories(parsedItems);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file');
    }
  };

  const handleSubcategoryChange = (
    index: number,
    field: keyof PopularCategoryItem | 'badge' | 'highlight',
    value: string | number | boolean
  ) => {
    const newSubcategories = [...subcategories];
    if (field === 'badge' || field === 'highlight') {
      newSubcategories[index] = {
        ...newSubcategories[index],
        metadata: { ...newSubcategories[index].metadata, [field]: value },
      };
    } else {
      newSubcategories[index] = { ...newSubcategories[index], [field]: value };
    }
    setSubcategories(newSubcategories);
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
    if (subcategories.length === 0 || !subcategories.some((s) => s.sub_category_id.trim())) {
      setError('At least one subcategory is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: PopularCategoryPayload = {
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
      subcategories: subcategories.filter((s) => s.sub_category_id.trim()),
    };

    try {
      if (popularCategory) {
        await updatePopularCategory(popularCategory._id, payload);
      } else {
        await createPopularCategory(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save popular category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {popularCategory ? 'Edit Popular Category' : 'Create Popular Category'}
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

          <StoreCodeSelector
            value={storeCodes}
            onChange={setStoreCodes}
            label="Select Store Codes"
            helperText="Select one or more store codes for this popular category"
          />

          <ImageUpload
            label="Desktop Banner"
            value={desktopBanner}
            onChange={setDesktopBanner}
            required
            folder="popular-categories"
            helperText="Upload image or enter URL (max 5MB)"
          />

          <ImageUpload
            label="Mobile Banner"
            value={mobileBanner}
            onChange={setMobileBanner}
            required
            folder="popular-categories"
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
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <span>Subcategories (Required)</span>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddSubcategory}
              >
                Add Subcategory
              </Button>
            </Stack>

            <CSVUpload
              onUpload={handleCSVUpload}
              onError={(err) => setError(err)}
              templateName="popular-category-subcategories.csv"
              label="Bulk Import Subcategories via CSV"
              helperText="Upload a CSV file to add multiple subcategories at once. This will replace existing subcategories."
            />

            <Stack spacing={2} sx={{ mt: 2 }}>
              {subcategories.map((subcategory, index) => (
                <Box
                  key={index}
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        label="Sub Category ID"
                        value={subcategory.sub_category_id}
                        onChange={(e) =>
                          handleSubcategoryChange(index, 'sub_category_id', e.target.value)
                        }
                        required
                        sx={{ flex: 2 }}
                      />
                      <TextField
                        size="small"
                        label="Position"
                        value={subcategory.position}
                        onChange={(e) =>
                          handleSubcategoryChange(index, 'position', Number(e.target.value))
                        }
                        type="number"
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveSubcategory(index)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                    <TextField
                      size="small"
                      label="Store Code"
                      value={subcategory.store_code || ''}
                      onChange={(e) =>
                        handleSubcategoryChange(index, 'store_code', e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Redirect URL"
                      value={subcategory.redirect_url || ''}
                      onChange={(e) =>
                        handleSubcategoryChange(index, 'redirect_url', e.target.value)
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        label="Badge (metadata)"
                        value={subcategory.metadata?.badge || ''}
                        onChange={(e) => handleSubcategoryChange(index, 'badge', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={subcategory.metadata?.highlight || false}
                            onChange={(e) =>
                              handleSubcategoryChange(index, 'highlight', e.target.checked)
                            }
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
          {loading ? (
            <CircularProgress size={24} />
          ) : popularCategory ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
