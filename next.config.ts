import type { NextConfig } from "next";

const isGithubPagesBuild = process.env.NODE_ENV === "production";
const repoName = "compliance-";
const basePath = isGithubPagesBuild ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: isGithubPagesBuild ? `/${repoName}/` : undefined,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
