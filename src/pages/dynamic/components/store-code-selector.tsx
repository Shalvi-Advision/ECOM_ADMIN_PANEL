import type { StoreCode } from 'src/types/api';

import { useState, useEffect } from 'react';

import {
  Box,
  Chip,
  Alert,
  Stack,
  Checkbox,
  FormGroup,
  FormLabel,
  TextField,
  FormControl,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { getStoreCodes } from 'src/services/store-codes';

interface StoreCodeSelectorProps {
  value: string[]; // Selected store codes
  onChange: (storeCodes: string[]) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
}

export default function StoreCodeSelector({
  value,
  onChange,
  label = 'Select Store Codes',
  helperText,
  error = false,
}: StoreCodeSelectorProps) {
  const [storeCodes, setStoreCodes] = useState<StoreCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch store codes on mount
  useEffect(() => {
    const fetchStoreCodes = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const response = await getStoreCodes();
        if (response.success && Array.isArray(response.data)) {
          setStoreCodes(response.data);
        } else {
          setFetchError('Invalid response format from server');
        }
      } catch (err: any) {
        console.error('Error fetching store codes:', err);
        setFetchError(err.message || 'Failed to fetch store codes');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreCodes();
  }, []);

  // Filter store codes based on search term
  const filteredStoreCodes = storeCodes.filter(
    (store) =>
      store.store_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle checkbox change
  const handleToggle = (storeCode: string) => {
    const currentIndex = value.indexOf(storeCode);
    const newSelected = [...value];

    if (currentIndex === -1) {
      newSelected.push(storeCode);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    onChange(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (value.length === filteredStoreCodes.length) {
      // Deselect all filtered
      const filteredCodes = filteredStoreCodes.map((s) => s.store_code);
      onChange(value.filter((code) => !filteredCodes.includes(code)));
    } else {
      // Select all filtered
      const allFilteredCodes = filteredStoreCodes.map((s) => s.store_code);
      const newSelected = [...new Set([...value, ...allFilteredCodes])];
      onChange(newSelected);
    }
  };

  // Handle remove chip
  const handleRemoveChip = (storeCode: string) => {
    onChange(value.filter((code) => code !== storeCode));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {fetchError}
      </Alert>
    );
  }

  if (storeCodes.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No store codes available. Please add stores first.
      </Alert>
    );
  }

  const allFilteredSelected =
    filteredStoreCodes.length > 0 &&
    filteredStoreCodes.every((store) => value.includes(store.store_code));

  return (
    <Box>
      <FormControl component="fieldset" fullWidth error={error}>
        <FormLabel component="legend" sx={{ mb: 1 }}>
          {label}
        </FormLabel>

        {/* Selected store codes as chips */}
        {value.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            {value.map((code) => {
              const store = storeCodes.find((s) => s.store_code === code);
              return (
                <Chip
                  key={code}
                  label={store ? `${code} - ${store.store_name}` : code}
                  onDelete={() => handleRemoveChip(code)}
                  color="primary"
                  size="small"
                />
              );
            })}
          </Stack>
        )}

        {/* Search filter */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search store codes or names..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Select All checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={allFilteredSelected}
              indeterminate={
                value.length > 0 &&
                value.length < filteredStoreCodes.length &&
                filteredStoreCodes.some((store) => value.includes(store.store_code))
              }
              onChange={handleSelectAll}
            />
          }
          label={
            <Box component="span" sx={{ fontWeight: 600 }}>
              Select All ({value.length}/{storeCodes.length})
            </Box>
          }
        />

        {/* Store codes checkboxes */}
        <FormGroup
          sx={{
            maxHeight: 300,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          {filteredStoreCodes.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              No stores match your search
            </Box>
          ) : (
            filteredStoreCodes.map((store) => (
              <FormControlLabel
                key={store.store_code}
                control={
                  <Checkbox
                    checked={value.includes(store.store_code)}
                    onChange={() => handleToggle(store.store_code)}
                  />
                }
                label={
                  <Box>
                    <Box component="span" sx={{ fontWeight: 500 }}>
                      {store.store_code}
                    </Box>
                    <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                      - {store.store_name}
                    </Box>
                  </Box>
                }
              />
            ))
          )}
        </FormGroup>

        {helperText && (
          <Box sx={{ mt: 1, fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary' }}>
            {helperText}
          </Box>
        )}
      </FormControl>
    </Box>
  );
}
