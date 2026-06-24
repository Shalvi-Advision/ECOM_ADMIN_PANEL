import { CONFIG } from 'src/config-global';

import { PlatformSignInView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Platform Sign in - ${CONFIG.appName}`}</title>

      <PlatformSignInView />
    </>
  );
}
