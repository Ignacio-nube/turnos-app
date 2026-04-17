import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@schedule-x/react",
    "@schedule-x/calendar",
    "@schedule-x/events-service",
    "@schedule-x/theme-shadcn",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
