import type {
  SeasonalCategory,
  SeasonalCategoryItem,
  SeasonalCategoryPayload,
} from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { createSeasonalCategory, updateSeasonalCategory } from 'src/services/seasonal-categories';

import { Iconify } from 'src/components/iconify';
import { ImageUpload } from 'src/components/image-upload';

interface SeasonalCategoryDialogProps {
  open: boolean;
  seasonalCategory: SeasonalCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SeasonalCategoryDialog({
  open,
  seasonalCategory,
  onClose,
  onSuccess,
}: SeasonalCategoryDialogProps) {
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
  const [season, setSeason] = useState<'spring' | 'summer' | 'autumn' | 'fall' | 'winter' | 'holiday' | 'festive' | 'all'>('all');
  const [isActive, setIsActive] = useState(true);
  const [sequence, setSequence] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subcategories, setSubcategories] = useState<SeasonalCategoryItem[]>([]);

  // Load data when editing
  useEffect(() => {
    if (seasonalCategory) {
      setTitle(seasonalCategory.title || '');
      setDescription(seasonalCategory.description || '');
      setStoreCode(seasonalCategory.store_code || '');
      setStoreCodes(seasonalCategory.store_codes || []);
      setDesktopBanner(seasonalCategory.banner_urls?.desktop || '');
      setMobileBanner(seasonalCategory.banner_urls?.mobile || '');
      setBackgroundColor(seasonalCategory.background_color || '#ffffff');
      setRedirectUrl(seasonalCategory.redirect_url || '');
      setSeason(seasonalCategory.season || 'all');
      setIsActive(seasonalCategory.is_active);
      setSequence(seasonalCategory.sequence || 0);
      setStartDate(seasonalCategory.start_date ? new Date(seasonalCategory.start_date).toISOString().split('T')[0] : '');
      setEndDate(seasonalCategory.end_date ? new Date(seasonalCategory.end_date).toISOString().split('T')[0] : '');
      setSubcategories(seasonalCategory.subcategories || []);
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
      setSeason('all');
      setIsActive(true);
      setSequence(0);
      setStartDate('');
      setEndDate('');
      setSubcategories([]);
    }
    setError('');
  }, [seasonalCategory, open]);

  const handleAddStoreCode = () => {
    if (storeCode.trim() && !storeCodes.includes(storeCode.trim())) {
      setStoreCodes([...storeCodes, storeCode.trim()]);
      setStoreCode('');
    }
  };

  const handleRemoveStoreCode = (index: number) => {
    setStoreCodes(storeCodes.filter((_, i) => i !== index));
  };

  const handleAddSubcategory = () => {
    setSubcategories([
      ...subcategories,
      { sub_category_id: '', position: subcategories.length + 1, redirect_url: '', metadata: {} },
    ]);
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubcategoryChange = (
    index: number,
    field: keyof SeasonalCategoryItem | 'badge',
    value: string | number
  ) => {
    const newSubcategories = [...subcategories];
    if (field === 'badge') {
      newSubcategories[index] = {
        ...newSubcategories[index],
        metadata: { ...newSubcategories[index].metadata, badge: value as string },
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

    const payload: SeasonalCategoryPayload = {
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
      season,
      is_active: isActive,
      sequence,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      subcategories: subcategories.filter((s) => s.sub_category_id.trim()),
    };

    try {
      if (seasonalCategory) {
        await updateSeasonalCategory(seasonalCategory._id, payload);
      } else {
        await createSeasonalCategory(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save seasonal category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {seasonalCategory ? 'Edit Seasonal Category' : 'Create Seasonal Category'}
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

          <ImageUpload
            label="Desktop Banner"
            value={desktopBanner}
            onChange={setDesktopBanner}
            required
            folder="seasonal-categories"
            helperText="Upload image or enter URL (max 5MB)"
          />

          <ImageUpload
            label="Mobile Banner"
            value={mobileBanner}
            onChange={setMobileBanner}
            required
            folder="seasonal-categories"
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
            select
            label="Season"
            value={season}
            onChange={(e) =>
              setSeason(
                e.target.value as
                  | 'spring'
                  | 'summer'
                  | 'autumn'
                  | 'fall'
                  | 'winter'
                  | 'holiday'
                  | 'festive'
                  | 'all'
              )
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="spring">Spring</MenuItem>
            <MenuItem value="summer">Summer</MenuItem>
            <MenuItem value="autumn">Autumn</MenuItem>
            <MenuItem value="fall">Fall</MenuItem>
            <MenuItem value="winter">Winter</MenuItem>
            <MenuItem value="holiday">Holiday</MenuItem>
            <MenuItem value="festive">Festive</MenuItem>
          </TextField>

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
            label="Sequence"
            value={sequence}
            onChange={(e) => setSequence(Number(e.target.value))}
            type="number"
          />

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Is Active"
          />

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <span>Subcategories (at least one required)</span>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddSubcategory}
              >
                Add Subcategory
              </Button>
            </Stack>

            <Stack spacing={2}>
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
                        label="Store Code"
                        value={subcategory.store_code || ''}
                        onChange={(e) =>
                          handleSubcategoryChange(index, 'store_code', e.target.value)
                        }
                        sx={{ flex: 1 }}
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
                      label="Redirect URL"
                      value={subcategory.redirect_url || ''}
                      onChange={(e) =>
                        handleSubcategoryChange(index, 'redirect_url', e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Badge (metadata)"
                      value={subcategory.metadata?.badge || ''}
                      onChange={(e) => handleSubcategoryChange(index, 'badge', e.target.value)}
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
          {loading ? <CircularProgress size={24} /> : seasonalCategory ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
