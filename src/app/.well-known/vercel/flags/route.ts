import { createFlagsDiscoveryEndpoint } from "flags/next";
import { getFeatureFlagsProviderData } from "@/lib/features/feature-flags";

const GET = createFlagsDiscoveryEndpoint(async () => {
  return getFeatureFlagsProviderData();
});

export { GET };
