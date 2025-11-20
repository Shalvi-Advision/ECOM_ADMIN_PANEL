import type { ChangeEvent } from 'react';

import { useRef, useState } from 'react';

import { Box, Alert, Stack, Button, Typography } from '@mui/material';

import { downloadCSVTemplate } from 'src/utils/csv-parser';

import { Iconify } from 'src/components/iconify';

interface CSVUploadProps {
  onUpload: (content: string) => void;
  onError?: (error: string) => void;
  templateName: string;
  label?: string;
  helperText?: string;
  accept?: string;
}

export function CSVUpload({
  onUpload,
  onError,
  templateName,
  label = 'Upload CSV File',
  helperText = 'Upload a CSV file to bulk import items',
  accept = '.csv',
}: CSVUploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      const errorMsg = 'Please upload a CSV file';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 5MB';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onUpload(content);
      }
    };
    reader.onerror = () => {
      const errorMsg = 'Failed to read file';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    };
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(templateName);
  };

  const handleClear = () => {
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Button
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleButtonClick}
          >
            Choose File
          </Button>

          <Button
            variant="text"
            size="small"
            startIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>

          {fileName && (
            <Button
              variant="text"
              size="small"
              color="error"
              startIcon={<Iconify icon="mingcute:close-line" />}
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </Stack>

        {fileName && (
          <Alert severity="success" icon={<Iconify icon="eva:checkmark-fill" />}>
            <Typography variant="body2">
              <strong>Selected:</strong> {fileName}
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {helperText && !error && (
          <Typography variant="caption" color="text.secondary">
            {helperText}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
