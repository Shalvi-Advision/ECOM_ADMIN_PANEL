import type { StoreCode } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { getAllStoreCodes } from 'src/services/stores';
import { useStoreCode } from 'src/contexts/store-code-context';

export function StoreCodeSelector() {
  const { storeCode, setStoreCode } = useStoreCode();
  const [storeCodes, setStoreCodes] = useState<StoreCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStoreCodes = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getAllStoreCodes();
        if (response.success) {
          setStoreCodes(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load store codes');
        console.error('Error fetching store codes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreCodes();
  }, []);

  const handleChange = (event: any) => {
    const selectedCode = event.target.value;
    setStoreCode(selectedCode === '' ? null : selectedCode);
  };

  if (error) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="store-code-select-label">Select Store Code</InputLabel>
        <Select
          labelId="store-code-select-label"
          id="store-code-select"
          value={storeCode || ''}
          label="Select Store Code"
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {storeCodes.map((store) => (
            <MenuItem key={store.store_code} value={store.store_code}>
              {store.store_code} - {store.store_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
