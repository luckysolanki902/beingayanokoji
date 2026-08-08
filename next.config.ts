import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["motion"],
    /*
      The header carries the reader's class and balance, so it must never be
      reused across a sign-in. Next keeps rendered segments in a client-side
      router cache and, by default, will re-show a dynamic one for 30 seconds
      on a back or a soft navigation. That is how a signed-in student on
      /record was still being shown the "Enrol" button: the page segment was
      fresh and the layout around it was not. Zero means every navigation
      re-asks the server, which is the only correct answer for chrome that
      depends on who is asking.
    */
    staleTimes: { dynamic: 0, static: 180 },
  },
};

export default nextConfig;
