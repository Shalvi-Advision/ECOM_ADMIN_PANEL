import type { User } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { getAllUsers } from 'src/services/users';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getAllUsers({ page: 1, limit: 100 });
        if (response.success) {
          setUsers(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <title>{`Users - ${CONFIG.appName}`}</title>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Users</Typography>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Verified</TableCell>
                      <TableCell>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user._id || user.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar alt={user.name || 'User'}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">{user.name || 'N/A'}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {user.email || 'N/A'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{user.mobile || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role ? user.role.toUpperCase() : 'USER'}
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              variant="outlined"
                              label={user.isVerified ? 'Verified' : 'Pending'}
                              color={user.isVerified ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {user.createdAt ? formatDate(user.createdAt) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </Card>
        </Stack>
      </Container>
    </>
  );
}

