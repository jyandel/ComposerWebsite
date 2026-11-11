# Jonathan Yandel · Composer Portfolio

This single-page site uses plain HTML, CSS, and JavaScript. Edit `content.js` to update track metadata and links.

## Preview locally

Open `index.html` directly in your browser. You can also run a local-only server from this folder.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8000/`. Press Ctrl+C to stop the server.

## Replace the placeholders

- **Tracks.** In `content.js`, edit the `tracks` list to change the order, titles, descriptions, and SoundCloud URLs. The six durations were checked against SoundCloud’s official widget. The card uses SoundCloud’s oEmbed artwork when available and the local `artwork` file as fallback. The `artworkAlt` text and `duration` are optional. Select the expand icon to open the official SoundCloud player, which provides the playback controls. SoundCloud playback needs internet access.
- **Private tracks.** Dawn uses the private share link you supplied. Its `embedUrl` is taken from SoundCloud’s official embed code and preserves the required share token. That token is visible in a static site’s source. If you make the track public, update `soundcloudUrl` and remove `embedUrl`.
- **Credits.** Add official project or video URLs to `creditLinks` in `content.js`. Blank entries show plain titles.
- **Profile photo.** Replace `assets/portrait.webp` to update the About photo. Match the image’s dimensions and alt text in `index.html` and adjust `object-position` in `styles.css` as needed. The portrait displays in a 4:5 frame, up to 180 pixels wide.
- **Contact.** In `content.js`, fill in `contactEmail` and add your profile URLs to `socialLinks`. Blank entries keep their controls inactive.
- **Design.** Colors and page gutters are defined in `styles.css`. Replace `assets/hero.jpg` to change the backdrop.

## Artwork

The hero backdrop was created with Codex’s built-in ImageGen tool. The local track covers are optimized copies of the artwork returned by SoundCloud’s oEmbed endpoint.

<details>
<summary>ImageGen prompt</summary>

> Stylized-concept web hero background, an original dark cinematic widescreen landscape panorama, 3:1 frame, photoreal fantasy film still. Jagged layered slate mountain peaks and rolling mist in a desaturated charcoal-blue night valley. The main ridge rises in the center-right, with a pale gibbous moon in the upper right behind thin haze, and subtle warm rock highlights. Left third is low-detail deep charcoal fog with naturally dark negative space for website text. Rich fine-grain rock texture and depth, low-key exposure and restrained moonlight, grounded rather than fantastical. Darkened bottom edge. Edge-to-edge landscape art only. No text, interface, logo, figures, or borders.

</details>
