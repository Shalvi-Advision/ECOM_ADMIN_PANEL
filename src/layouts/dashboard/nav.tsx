import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { StoreCodeSelector } from '../components/store-code-selector';

import type { NavItem } from '../nav-config-dashboard';

// ----------------------------------------------------------------------

type NavSharedProps = {
  data: NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  slots,
  layoutQuery,
}: NavSharedProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
}: NavSharedProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, sx }: NavSharedProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const ancestorPaths = useMemo(() => {
    const paths: string[] = [];
    const collect = (items: NavItem[]) => {
      items.forEach((item) => {
        if (item.children?.length) {
          if (
            pathname === item.path ||
            item.children.some((child) => pathname.startsWith(child.path))
          ) {
            paths.push(item.path);
          }
          collect(item.children);
        }
      });
    };
    collect(data);
    return paths;
  }, [data, pathname]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      ancestorPaths.forEach((path) => {
        next[path] = true;
      });
      return next;
    });
  }, [ancestorPaths]);

  const renderItems = (items: NavItem[], depth = 0) =>
    items.map((item) => {
      const childMatch =
        item.children?.some((child) => pathname.startsWith(child.path)) ?? false;
      const hasChildren = Boolean(item.children?.length);
      const isOpen = hasChildren ? openGroups[item.path] ?? false : false;
      const isActived = pathname === item.path || childMatch;

      return (
        <Box component="li" key={`${item.path}-${item.title}`}>
          <ListItem disableGutters disablePadding>
            <ListItemButton
              disableGutters
              component={RouterLink}
              href={item.path}
              sx={[
                (theme) => ({
                  pl: 2 + depth * 2,
                  py: 1,
                  gap: 2,
                  pr: 1.5,
                  borderRadius: 0.75,
                  typography: 'body2',
                  fontWeight: 'fontWeightMedium',
                  color: theme.vars.palette.text.secondary,
                  minHeight: 44,
                  ...(isActived && {
                    fontWeight: 'fontWeightSemiBold',
                    color: theme.vars.palette.primary.main,
                    bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                    '&:hover': {
                      bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
                    },
                  }),
                }),
              ]}
            >
              <Box component="span" sx={{ width: 24, height: 24 }}>
                {item.icon}
              </Box>

              <Box component="span" sx={{ flexGrow: 1 }}>
                {item.title}
              </Box>

              {item.info && item.info}

              {hasChildren && (
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpenGroups((prev) => ({
                      ...prev,
                      [item.path]: !isOpen,
                    }));
                  }}
                >
                  <Iconify
                    icon={isOpen ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                  />
                </IconButton>
              )}
            </ListItemButton>
          </ListItem>

          {item.children && isOpen && (
            <Box
              component="ul"
              sx={{
                gap: 0.25,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Show store code selector for Ecommerce section */}
              {item.title === 'Ecommerce' && <StoreCodeSelector />}
              {renderItems(item.children, depth + 1)}
            </Box>
          )}
        </Box>
      );
    });

  return (
    <>
      <Logo />

      {slots?.topArea}

      <Scrollbar fillContent>
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box
            component="ul"
            sx={{
              gap: 0.5,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {renderItems(data)}
          </Box>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}
    </>
  );
}
