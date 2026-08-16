// Centralised so login/signup (setting the cookie) and logout (clearing it)
// can't drift out of sync — clearCookie() only actually clears a cookie if
// the identifying options (path/domain/secure/sameSite) match the ones it
// was set with.
const getCookieOptions = () => ({
  httpOnly: true, // JS on the page can't read this — the main XSS mitigation
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod; allow http:// in local dev
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" needed for cross-site prod (frontend on a different domain) + requires secure:true
  maxAge: Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000, // 1 day default — keep in sync with JWT_EXPIRY
});

// Express 5's res.clearCookie() always sets its own immediate expiry and
// silently ignores maxAge/expires passed to it (logging a deprecation
// warning if you try) — so logout should use this instead of
// getCookieOptions() directly. Keeping maxAge out here (rather than just
// tolerating the warning) is what stops it appearing at all.
const getClearCookieOptions = () => {
  const { maxAge, ...rest } = getCookieOptions();
  return rest;
};

export { getCookieOptions, getClearCookieOptions };