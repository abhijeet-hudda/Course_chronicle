// Centralised so login/signup (setting the cookie) and logout (clearing it)
// can't drift out of sync — clearCookie() only actually clears a cookie if
// the options match the ones it was set with.
const getCookieOptions = () => ({
  httpOnly: true, // JS on the page can't read this — the main XSS mitigation
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod; allow http:// in local dev
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" needed for cross-site prod (frontend on a different domain) + requires secure:true
  maxAge: Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000, // 1 day default — keep in sync with JWT_EXPIRY
});

export { getCookieOptions };