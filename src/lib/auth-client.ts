import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Omitting baseURL allows the client to automatically use relative paths,
  // preventing CORS issues across different domains (Vercel domain vs Custom domain).
});
