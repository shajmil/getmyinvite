export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://getmyinvite.in"
    : "http://localhost:3000")
).replace(/\/$/, "");
