import { createFlagsDiscoveryEndpoint } from "flags/next";
import { getFeatureFlagsProviderData } from "@/lib/features/feature-flags";

export const GET = createFlagsDiscoveryEndpoint(async () => {
  return getFeatureFlagsProviderData();
});
