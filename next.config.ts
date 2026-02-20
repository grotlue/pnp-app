import type { NextConfig } from "next";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  reactCompiler: {
    compilationMode: "infer",
  },
};

export default withVercelToolbar()(nextConfig);
