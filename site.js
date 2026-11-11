function httpsUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

async function loadTrackArtwork(cover, trackUrl) {
  const metadataUrl = new URL("https://soundcloud.com/oembed");
  metadataUrl.searchParams.set("format", "json");
  metadataUrl.searchParams.set("url", trackUrl.href);

  try {
    const response = await fetch(metadataUrl, { credentials: "omit" });
    if (!response.ok) return;

    const metadata = await response.json();
    const artworkUrl = httpsUrl(metadata.thumbnail_url);
    if (!artworkUrl) return;

    const fallback = cover.getAttribute("src");
    cover.addEventListener("error", () => {
      cover.src = fallback;
    }, { once: true });
    cover.src = artworkUrl.href;
  } catch {
    // The card already has its local fallback.
  }
}

function connectPlayer(row, track, index) {
  const play = row.querySelector(".track-play");
  const trackUrl = httpsUrl(track.soundcloudUrl);
  const soundCloudHosts = ["soundcloud.com", "www.soundcloud.com", "api.soundcloud.com"];
  if (!trackUrl || !soundCloudHosts.includes(trackUrl.hostname)) {
    play.setAttribute("aria-label", `SoundCloud player unavailable for ${track.title}`);
    return;
  }

  loadTrackArtwork(row.querySelector(".track-cover"), trackUrl);

  const panel = row.querySelector(".track-player");
  panel.id = `track-player-${index + 1}`;
  panel.querySelector(".track-fallback").href = trackUrl.href;
  const sourceLink = row.querySelector(".track-source");
  sourceLink.href = trackUrl.href;
  sourceLink.setAttribute("aria-label", `Listen to ${track.title} on SoundCloud`);
  row.querySelector(".track-source span").remove();

  play.disabled = false;
  play.setAttribute("aria-controls", panel.id);
  play.setAttribute("aria-expanded", "false");
  play.setAttribute("aria-label", `Open SoundCloud player for ${track.title}`);

  play.addEventListener("click", () => {
    if (!panel.hidden) {
      panel.querySelector("iframe").remove();
      panel.hidden = true;
      play.setAttribute("aria-expanded", "false");
      play.setAttribute("aria-label", `Open SoundCloud player for ${track.title}`);
      return;
    }

    const configuredEmbed = httpsUrl(track.embedUrl);
    const playerUrl = configuredEmbed?.hostname === "w.soundcloud.com"
      ? configuredEmbed
      : new URL("https://w.soundcloud.com/player/");
    if (!playerUrl.searchParams.has("url")) {
      playerUrl.searchParams.set("url", trackUrl.href);
    }
    playerUrl.searchParams.set("visual", "false");
    playerUrl.searchParams.set("show_artwork", "true");
    playerUrl.searchParams.set("show_user", "true");
    playerUrl.searchParams.set("color", "#445868");
    playerUrl.searchParams.set("show_comments", "false");
    playerUrl.searchParams.set("show_reposts", "false");
    playerUrl.searchParams.set("single_active", "true");

    const player = document.createElement("iframe");
    player.className = "track-embed";
    player.title = `SoundCloud player for ${track.title}`;
    player.src = playerUrl.href;
    player.loading = "lazy";
    player.allow = "encrypted-media";
    panel.prepend(player);
    panel.hidden = false;
    play.setAttribute("aria-expanded", "true");
    play.setAttribute("aria-label", `Close SoundCloud player for ${track.title}`);
  });
}

const trackList = document.querySelector(".track-list");
const trackTemplate = document.querySelector("#track-template");

portfolioContent.tracks.forEach((track, index) => {
  const row = trackTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector("h3").textContent = track.title;
  row.querySelector(".track-description").textContent = track.description;

  const cover = row.querySelector(".track-cover");
  cover.src = track.artwork || "assets/track-placeholder.svg";
  cover.alt = track.artworkAlt || "";

  if (track.duration) {
    const duration = row.querySelector(".track-duration");
    duration.textContent = track.duration;
    duration.hidden = false;
  }

  connectPlayer(row, track, index);
  trackList.append(row);
});

document.querySelectorAll("[data-credit]").forEach((link) => {
  const url = httpsUrl(portfolioContent.creditLinks[link.dataset.credit]);
  if (url) link.href = url.href;
});

document.querySelectorAll("[data-social]").forEach((link) => {
  const url = httpsUrl(portfolioContent.socialLinks[link.dataset.social]);
  if (url) link.href = url.href;
});

const contactEmail = portfolioContent.contactEmail.trim();
if (contactEmail) {
  const contactLink = document.querySelector(".contact-link");
  contactLink.href = `mailto:${contactEmail}`;
  contactLink.removeAttribute("role");
  contactLink.removeAttribute("aria-disabled");
}
