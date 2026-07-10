# rollycalma.com Security Maintenance

This repo is a static GitHub Pages site. The highest-risk areas are account, token, and DNS control rather than server-side hacking.

## Automated Checks

GitHub Actions runs `.github/workflows/site-health.yml`:

- On every push to `main`.
- Once per day at 23:17 UTC / 07:17 Asia/Shanghai.
- On manual `workflow_dispatch`.

It verifies:

- Local internal links and same-page anchors resolve before the live checks run.
- The public domain routes return HTTP 200.
- `/.well-known/security.txt`, `robots.txt`, `sitemap.xml`, and `llms.txt` remain live.
- The root page still includes CSP and referrer-policy meta tags.
- `script.js` still avoids posting to the placeholder Formspree endpoint.
- No `http://rollycalma.com` URL appears in the checked public files.

GitHub will show failures in the repository Actions tab and, depending on account notification settings, can email the repo owner when a scheduled or push workflow fails.

## Local Check

Run this from the repo root:

```powershell
.\tools\check-domain-security.ps1
```

Run the internal link checker:

```powershell
python .\tools\check-internal-links.py
```

Optional:

```powershell
.\tools\check-domain-security.ps1 -BaseUrl "https://rollycalma.com"
```

## Manual Checks Raven Still Controls

These cannot be safely automated without account login or registrar API access:

- Rotate the broad GitHub PAT stored in `D:\fable 5 files\github.env`.
- Confirm GitHub 2FA is enabled.
- Confirm GoDaddy 2-step verification is enabled.
- Confirm domain transfer lock is enabled.
- Confirm auto-renew is enabled.
- Confirm WHOIS/domain privacy is enabled.
- Save recovery codes somewhere private.

## Later Upgrade

If Raven wants stronger browser-visible security headers and traffic filtering, move DNS through Cloudflare and add response-header rules for:

- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Cloudflare can also add DNSSEC, basic bot controls, caching, and WAF rules in front of GitHub Pages.
