import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { Logo } from 'src/components/logo';
import { getPlatformAdmin, clearPlatformAuth } from 'src/services/platform-auth';

// ----------------------------------------------------------------------

// Minimal shell for the platform (company) console. Deliberately does NOT reuse
// DashboardLayout — no store-admin nav, store selector, or permission context
// belongs here. Just a top bar + the platform page content.

type PlatformLayoutProps = {
  children: ReactNode;
};

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const admin = getPlatformAdmin();

  const handleLogout = () => {
    clearPlatformAuth();
    window.location.href = '/platform/sign-in';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Logo />
          <Typography variant="h6" sx={{ flexShrink: 0 }}>
            Platform Console
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {admin && (
            <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              {admin.name} · {admin.mobile}
            </Typography>
          )}
          <Button color="inherit" variant="outlined" size="small" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {children}
    </Box>
  );
}
