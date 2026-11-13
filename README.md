# The Medics Inc. website

A static website for GitHub Pages. It has 18 pages, one shared stylesheet, a small amount of JavaScript, and no build step. The custom domain file (`CNAME`, `themedicsinc.com`) from the earlier version is kept.

**Voice:** all page text is written in the first person plural ("we", "our"), as The Medics Inc. speaking to the visitor.

## What is in this package

| Path | What it is |
|---|---|
| `index.html`, `about.html`, `research.html`, `peptides.html`, `cbd-hemp.html`, `products.html`, `longevity.html`, `partnerships.html`, `locations.html` | Company pages |
| `careers.html` | Two research positions and the online application form with CV upload |
| `contact.html` | Contact form |
| `compliance.html` | Explains the four footer compliance badges (HIPAA, CCPA/CPRA, SOC 2, FDA) |
| `privacy.html`, `terms.html`, `disclaimer.html`, `accessibility.html`, `cookies.html`, `copyright.html` | Legal and policy pages (linked from every footer) |
| `404.html`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `CNAME` | Site housekeeping |
| `css/styles.css` | The only stylesheet. Colors and sizes are CSS variables at the top |
| `js/config.js` | **The one file you must edit** to connect the forms |
| `js/main.js` | Menu and display options (text size, colors, spacing) |
| `js/forms.js` | Form validation, searchable country and calling-code selectors, phone normalisation, CV checks, submission |
| `js/countries.js` | Country names and international calling codes |
| `assets/` | Logo, favicons, illustrations (`assets/img/*.svg`) |

## 1. Deploy on GitHub Pages

1. Create a repository, for example `themedicsinc-website`, and upload the **contents** of this folder to the root of the repository (not the folder itself).
2. In the repository, go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
3. Under **Custom domain**, enter `themedicsinc.com`. The `CNAME` file in this package already says this. Keep **Enforce HTTPS** switched on.
4. At your domain registrar, make sure the DNS records point to GitHub Pages (see GitHub's documentation for the current A and CNAME records).
5. The `.nojekyll` file stops GitHub from processing the site with Jekyll. Leave it in place.

## 2. Connect the forms (required before launch)

GitHub Pages is static. It cannot receive email, store applications or accept CV files. The two forms therefore send their data to a **form-processing service**.

**Current mode: simulation.** In `js/config.js`, `simulateSubmission` is set to `true`. In this mode both forms are checked exactly as in production (required fields, email format, country and calling code, E.164 phone number, CV type and size, privacy acknowledgement) and then show the normal confirmation message, **but nothing is sent**. No email is delivered and no CV is received. Anything a real visitor types is lost. Use this mode only for presentations and reviews. Before the site gets real visitors, connect a service as described below and set `simulateSubmission: false`.

This package is wired for **Formspree** (formspree.io), and the Privacy and Cookie policies name Formspree.

1. Create two forms in Formspree: one for **Contact** and one for **Careers**. Set the email address that should receive submissions in each form's settings. The site does not publish any email address.
2. Check that your Formspree plan allows **file uploads** for the Careers form. If it does not, the CV will not arrive. Also note the plan's upload size limit.
3. Open `js/config.js`, replace the two placeholder endpoints and turn the simulation off:
   ```js
   simulateSubmission: false,
   contactEndpoint: "https://formspree.io/f/YOUR_CONTACT_FORM_ID",
   careersEndpoint: "https://formspree.io/f/YOUR_CAREERS_FORM_ID",
   maxCvMB: 5,
   ```
   Set `maxCvMB` to the real upload limit (the pages read this value, so the text on the page stays correct).
4. Set `simulateSubmission: false` and commit the change. If the switch is off and an endpoint is still a placeholder, the page shows a "Setup required" notice and sends nothing.
5. **Test before announcing the site:**
   - Send a contact message with a phone number. Confirm that the email arrives and that it includes `phone_e164` (for example `+33612345678`), `calling_code`, `country` and `reason`.
   - Submit a test application with a PDF, then a DOCX. Confirm that the CV is attached or downloadable.
   - Try a `.exe` file and a file over the limit, and confirm that the page shows an error.
   - Switch off your internet connection and submit, and confirm the error message appears and the typed details are kept.
6. Turn on spam protection in the service (the forms already include a hidden honeypot field). If you add reCAPTCHA or similar, update the Privacy and Cookie policies, because they currently say there is no tracking.

**Using a different provider:** change the endpoints in `js/config.js`. The provider must accept a `multipart/form-data` POST from the browser, allow cross-origin requests and return JSON. Then update the provider name in `privacy.html` and `cookies.html`.

**What the visitor can do:** choose a position; enter name, email, telephone, country and calling code (searchable); optionally add a LinkedIn address; write a cover message; upload a CV (PDF, DOC, DOCX); confirm the privacy notice. The phone number is converted to international E.164 format (for example `+54…`) before sending, and an optional extension is sent separately.

## 3. Confirm these items before publishing

These are drafts. They need a decision or a check by your team (and, for legal and regulatory text, by qualified advisers).

1. **FDA statement** (`compliance.html`, marked with a `CONFIRM` comment). The text is deliberately general. Add the production facility's real registration status and the requirements that apply, checked against the actual registration documents. Do not add an "FDA compliant" or "FDA approved" claim.
2. **HIPAA, CCPA/CPRA and SOC 2 wording.** Check that each statement is true of your actual practices. SOC 2 is described as "readiness in progress, no report issued". Change it only when an auditor has issued a report.
3. **Job descriptions** on `careers.html` are proposed. Finalize duties, qualifications, location and employment terms. The page does not state a location or salary.
4. **Privacy Policy details:** retention periods (24 months for contact messages and 12 months for applications are placeholders), the named providers (Formspree, your email provider, GitHub), and how you will answer privacy requests.
5. **Terms & Conditions:** governed by Delaware law, with disputes heard in the state and federal courts located in Delaware (the state of incorporation, per the Delaware record for MEDICS, INC., file number 2147858). The legal pages identify the company as "MEDICS, INC., doing business as The Medics Inc." The footer shows the incorporation state and file number. Have a lawyer review all legal pages.
6. **Longeveron.** The partnership page describes Longeveron in general terms from its public materials and links to its official site. It does not mention trials, licenses, co-development or shared facilities. Add any such detail only after it is confirmed. Check that Longeveron is happy with how it is described.
7. **Product statements.** The site says that products are not intended to diagnose, treat, cure or prevent disease and avoids benefit claims. Keep it that way unless a claim is properly substantiated.
8. **Accessibility Statement** says that keyboard and automated checks were done and that screen-reader testing and an independent audit are planned. Update it after you do them. Do not claim WCAG 2.2 AAA conformance until an audit supports it.
9. **Images.** The pictures are abstract illustrations (SVG). Replace them with professional photography if you wish. Choose images of laboratories, research and wellness, not clinics or consumer shops, and give meaningful images alternative text.
10. **Postal code** for the Ridgefield Park headquarters is not shown. Add it if you want.
13. **Company history and X account** (About page, footer). The history text comes from the company's own account: it previously operated in New Jersey's regulated medical cannabis sector, shifted its focus as the market moved to adult-use legalization, and kept its hemp and CBD business. Confirm the wording (for example "shifted our focus" versus "stopped" or "substantially reduced"), and add years if you want them. The X link points to @MedicsHempCBD. Check that the account is the company's official one and is current. The page deliberately makes no claim about how long the company has done research, and none about "anti-aging" or "reverse aging" work.
12. **Clinical development table** (Research page). It states the four development stages and that some products have reached human clinical trials (confirmed by the company). By the company's choice it names no registry numbers, sponsors or sources. It does not name products or phases. If you add product-level rows, keep every statement accurate, keep products described as investigational, and do not call any product proven safe or effective until the evidence is established.
11. **New Orleans office** (1441 Canal St, New Orleans, LA 70112) appears in the footer, on the home page and on the Locations page. The text says only that it is an office where we work in Louisiana. Add details about its purpose or opening only when they are confirmed.

## 4. Accessibility (target: WCAG 2.2 AAA)

Built in: semantic HTML and headings; skip link; full keyboard use; a double-ring focus indicator; text contrast of at least 7:1 (also checked in the dark and high-contrast display modes); 44 px minimum target size; no sticky header; no animation; text that resizes; "Display options" for text size, colors and spacing; labelled forms with an error summary and live status messages; an accessible searchable combobox; abbreviations explained at first use; plain language and short line length.

Checks already run on this package: all pages for broken links and anchors, missing alt text, heading order, duplicate IDs, unlabeled controls, tag balance, console errors, horizontal scrolling at 320, 768 and 1280 px, and text contrast in three color modes; the forms for validation, keyboard use, country and phone handling, CV rules, success and failure messages; and an end-to-end submission to a test server, with the uploaded file arriving intact.

**Still to do:** testing with screen readers (NVDA, JAWS, VoiceOver, TalkBack), testing in all major browsers and on real phones, and an independent accessibility audit.

## 5. Editing the site

- The menu and footer are repeated in each HTML file. To change them, use search-and-replace across the folder.
- Colors, fonts and spacing: edit the variables at the top of `css/styles.css`. Keep text contrast at 7:1 or higher.
- To add a page, copy an existing page, change the `<title>`, description, canonical address and content, and add it to the menu, the footer and `sitemap.xml`.
- If you add analytics, cookies or another third-party service, update the Privacy Policy and Cookie Policy first.

## 6. Notes on content choices

- The site presents The Medics Inc. as a research, product-development and distribution company. It is not presented as a clinic.
- Commercial activities (peptides, CBD and hemp-derived products, own brand, third-party distribution) are labeled separately from research interests (cellular science, longevity, healthy aging).
- The earlier version mentioned "stem cells" and "regenerative medicine". These words are not used now, because they would suggest claims that need to be confirmed first.
- The footer badges pair a small icon with an honest text statement. The CCPA/CPRA and SOC 2 pictures are the graphics the company supplied (confirm that you have the right to use them). The HIPAA and facility icons are neutral drawings. The supplied "HIPAA COMPLIANT" seal (a watermarked stock image that claims compliance) and the supplied FDA logo (which would suggest FDA approval or affiliation) are deliberately not used. HIPAA and FDA do not certify companies, so no official badge exists to display.
