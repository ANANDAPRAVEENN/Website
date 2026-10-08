# Geoinformatics website

`index.html` is the main page. Shared presentation and behaviour are in `assets/site.css` and `assets/site.js`. `geoinformatics.html` and original images are retained unchanged.

## Preview

Run `python -m http.server 8000` from this folder, then open `http://localhost:8000/`. This static preview does not send enquiries; it will show an honest failure and a prepared email link. The separate downloadable demo previews enquiries in a dialog and never calls the email endpoint. Fonts, satellite tiles, and showcase video require internet access. Bundled Leaflet and Natural Earth boundaries keep the location map usable offline.

## Email delivery on Vercel

The repository's recorded website is https://website-tau-sand-78.vercel.app/. `api/enquiry.js` is a Vercel Node function using the Resend REST API. No runtime npm dependencies are required. Configure server-side environment variables in Vercel (never in HTML or Git):

- `RESEND_API_KEY`: an email-sending key.
- `ENQUIRY_FROM`: a sender on your verified domain, e.g. `Geoinformatics <website@your-verified-domain>`.
- `ENQUIRY_TO`: defaults to `info@geoinformatics.co.in`.

Without these credentials the endpoint returns 503, retains the visitor's input and offers an email-app fallback. A success message appears only after the provider accepts the message. Acceptance is not a delivery receipt. Retry requests reuse an idempotency key until the form changes. Provider calls have a timeout, the endpoint validates fields, rejects cross-origin browser submissions and includes a honeypot. Configure Vercel firewall rate limits before exposing the sending endpoint to production traffic; the honeypot does not replace distributed rate limiting.

Official references: https://vercel.com/docs/functions/runtimes/node-js and https://resend.com/docs/api-reference/emails/send-email .

## SEO and publishing

Canonical, Open Graph, robots and sitemap URLs use the repository's recorded Vercel URL. If the preferred live domain changes, update all four together. The old HTML version is retained for compatibility but omitted from the sitemap. Deploy the HTML, assets, sitemap, robots, and API together; replacing only the HTML would omit its dependencies. No production deployment has been performed as part of this review.

## Improvements

- 31 referenced images converted to WebP: full-size variants total 5.07 MB versus 70.22 MB of originals (92.8% smaller). Smaller 500 px variants and lazy loading further reduce actual transfer. This is an asset comparison, not a measured speed score.
- All 21 project cards filter together, with consistent thumbnail dimensions and 3D/CAD and Powerline categories.
- Accessible menu state and Escape handling, labels, keyboard video controls, reduced-motion support and visible content without JavaScript.
- Video success/failure/end states, map attribution and five-continent text.
- Canonical and social tags, sitemap, robots, corrected HTML structure, extracted CSS/JS.

## Verify

`node --test tests/enquiry.test.js` exercises rejection, missing configuration, provider acceptance, provider failure and network failure using mocks. Tests do not send mail.
