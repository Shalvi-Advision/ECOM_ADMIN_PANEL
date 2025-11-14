import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  children?: NavItem[];
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Users',
    path: '/users',
    icon: icon('ic-user'),
  },
  {
    title: 'Ecommerce',
    path: '/ecommerce/departments',
    icon: icon('ic-cart'),
    children: [
      {
        title: 'Departments',
        path: '/ecommerce/departments',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Categories',
        path: '/ecommerce/categories',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Subcategories',
        path: '/ecommerce/subcategories',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Products',
        path: '/ecommerce/products',
        icon: icon('ic-analytics'),
      },
    ],
  },
  {
    title: 'Outlet',
    path: '/outlet/pincodes',
    icon: icon('ic-user'),
    children: [
      {
        title: 'Pincodes',
        path: '/outlet/pincodes',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Stores',
        path: '/outlet/stores',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Payment Modes',
        path: '/outlet/payment-modes',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Delivery Slots',
        path: '/outlet/delivery-slots',
        icon: icon('ic-analytics'),
      },
    ],
  },
  {
    title: 'Dynamic Section',
    path: '/dynamic/best-sellers',
    icon: icon('ic-blog'),
    children: [
      {
        title: 'Best Sellers',
        path: '/dynamic/best-sellers',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Advertisements',
        path: '/dynamic/advertisements',
        icon: icon('ic-analytics'),
      },
      {
        title: 'Popular Categories',
        path: '/dynamic/popular-categories',
        icon: icon('ic-analytics'),
      },
    ],
  },
];
