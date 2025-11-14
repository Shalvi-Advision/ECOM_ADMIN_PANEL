import type { Subcategory } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { useStoreCode } from 'src/contexts/store-code-context';
import { getSubcategoriesByStore } from 'src/services/subcategories';

import { Scrollbar } from 'src/components/scrollbar';

export default function Page() {
  const { storeCode } = useStoreCode();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchSubcategories = useCallback(async () => {
    if (!storeCode) {
      setSubcategories([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getSubcategoriesByStore({
        store_code: storeCode,
        page,
        limit,
      });
      if (response.success) {
        setSubcategories(response.data);
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  }, [storeCode, page]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <>
      <title>{`Subcategories - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Subcategories</Typography>

          {!storeCode && (
            <Alert severity="warning">
              Please select a store code from the Ecommerce section in the sidebar to view
              subcategories.
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {storeCode && (
            <Card>
              <Scrollbar>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Subcategory Name</TableCell>
                        <TableCell>Subcategory ID</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Category ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : subcategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                            <Typography variant="body2" color="text.secondary">
                              No subcategories found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        subcategories.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell>
                              <Typography variant="subtitle2">{item.sub_category_name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.idsub_category_master}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{item.main_category_name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={item.category_id} size="small" variant="outlined" />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Scrollbar>

              {!loading && subcategories.length > 0 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}
