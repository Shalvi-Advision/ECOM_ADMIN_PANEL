import { CONFIG } from 'src/config-global';

import { OverviewAnalyticsView as DashboardView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Dashboard - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Centralized analytics and monitoring hub for the Shalvi Advision admin dashboard."
      />
      <meta name="keywords" content="react,material,kit,application,dashboard,admin,template" />

      <DashboardView />
    </>
  );
}
