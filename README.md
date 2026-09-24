# Rough Rider Racing website (framework pass)

Static site, no build step and no dependencies. Open `index.html` in a browser to preview.

```
baja-site/
├── index.html          Home: hero, stats, subteams, countdown, slideshow, sponsors, join CTA
├── about.html          What is Baja SAE, who we are, the vehicle, how we work
├── team.html           Leadership + subteam rosters (placeholders), join section
├── competitions.html   2026–27 schedule, event format, past results (placeholder), gallery
├── sponsors.html       Why partner, budget, tier table, talent package, current sponsors, contact
└── assets/
    ├── css/styles.css  All styling. Brand colours and spacing are tokens at the top (:root)
    ├── js/main.js      Nav toggle, scroll reveal, slideshow, countdown (all opt-in via data-attributes)
    ├── img/            logo.png, favicon.png, sponsor-wall.jpg, photos/ (50 web-sized shots)
    └── docs/           Sponsorship package PDF (linked from sponsors.html)
```

## Editing notes
- **Header and footer are copied into every page.** If you change nav links or footer text, change all five files.
- **Placeholders** have the `todo` class (dashed gold outline) so they're easy to spot. Search for `TODO` to find all of them.
- **Scroll animations:** add `data-reveal` to any element (and optionally `data-reveal-delay="1|2|3"`). Motion is turned off automatically for users with reduced-motion enabled.
- **Slideshow:** copy the `.slideshow` block on the homepage; add or remove `<figure class="slideshow__slide">` items.
- **Countdown:** change `data-countdown="…"` on the homepage to the next event's date and time each season.
- **Team headshots:** square JPGs about 600×600 in `assets/img/team/`, then set `style="background-image:url('…')"` on `.member__photo`.

## Deploying to AWS (later)
Upload the folder contents to an S3 bucket (static website hosting, or private bucket + CloudFront with Origin Access Control), with `index.html` as the default root object. Add a Route 53 domain and ACM certificate for HTTPS on the CloudFront distribution.
