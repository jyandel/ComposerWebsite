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

let widgetApiPromise;

function loadWidgetApi() {
  if (widgetApiPromise) return widgetApiPromise;

  widgetApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      script.remove();
      widgetApiPromise = null;
      reject(new Error("SoundCloud API timed out"));
    }, 15000);

    script.src = "https://w.soundcloud.com/player/api.js";
    script.onload = () => {
      if (!window.SC?.Widget) {
        script.onerror();
        return;
      }
      clearTimeout(timeout);
      resolve(window.SC);
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      widgetApiPromise = null;
      reject(new Error("SoundCloud API unavailable"));
    };
    document.head.append(script);
  });
  return widgetApiPromise;
}

function connectPlayer(row, track) {
  const play = row.querySelector(".track-play");
  const status = row.querySelector(".track-status");
  const trackUrl = httpsUrl(track.soundcloudUrl);
  const soundCloudHosts = ["soundcloud.com", "www.soundcloud.com", "api.soundcloud.com"];
  if (!trackUrl || !soundCloudHosts.includes(trackUrl.hostname)) {
    play.setAttribute("aria-label", `SoundCloud player unavailable for ${track.title}`);
    return;
  }

  loadTrackArtwork(row.querySelector(".track-cover"), trackUrl);
  const sourceLink = row.querySelector(".track-source");
  sourceLink.href = trackUrl.href;
  sourceLink.setAttribute("aria-label", `Listen to ${track.title} on SoundCloud`);
  row.querySelector(".track-source span").remove();

  let widget;
  let iframe;
  let loading = false;
  let timeout;

  function setPlaying(playing) {
    play.setAttribute("aria-pressed", String(playing));
    play.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${track.title}`);
  }

  function finishLoading() {
    clearTimeout(timeout);
    loading = false;
    play.removeAttribute("aria-busy");
  }

  function failPlayback() {
    finishLoading();
    if (widget) {
      Object.values(window.SC.Widget.Events).forEach(event => widget.unbind(event));
    }
    iframe?.remove();
    iframe = null;
    widget = null;
    setPlaying(false);
    status.textContent = `Unable to play ${track.title}. Try again or use the SoundCloud link.`;
  }

  play.disabled = false;
  setPlaying(false);

  play.addEventListener("click", async () => {
    if (loading) return;
    if (widget) {
      widget.toggle();
      return;
    }

    loading = true;
    play.setAttribute("aria-busy", "true");
    status.textContent = `Loading ${track.title}.`;

    try {
      const soundcloud = await loadWidgetApi();
      const configuredEmbed = httpsUrl(track.embedUrl);
      const playerUrl = configuredEmbed?.hostname === "w.soundcloud.com"
        ? configuredEmbed
        : new URL("https://w.soundcloud.com/player/");
      if (!playerUrl.searchParams.has("url")) {
        playerUrl.searchParams.set("url", trackUrl.href);
      }
      playerUrl.searchParams.set("auto_play", "true");
      playerUrl.searchParams.set("single_active", "true");

      iframe = document.createElement("iframe");
      iframe.className = "track-embed";
      iframe.title = `SoundCloud audio for ${track.title}`;
      iframe.src = playerUrl.href;
      iframe.allow = "autoplay; encrypted-media";
      iframe.tabIndex = -1;
      row.querySelector(".track-player").append(iframe);
      widget = soundcloud.Widget(iframe);
      timeout = setTimeout(failPlayback, 20000);

      widget.bind(soundcloud.Widget.Events.READY, () => widget.play());
      widget.bind(soundcloud.Widget.Events.PLAY, () => {
        finishLoading();
        setPlaying(true);
        status.textContent = "";
      });
      widget.bind(soundcloud.Widget.Events.PAUSE, () => setPlaying(false));
      widget.bind(soundcloud.Widget.Events.FINISH, () => setPlaying(false));
      widget.bind(soundcloud.Widget.Events.ERROR, failPlayback);
    } catch {
      failPlayback();
    }
  });
}

const trackList = document.querySelector(".track-list");
const trackTemplate = document.querySelector("#track-template");

portfolioContent.tracks.forEach((track) => {
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

  connectPlayer(row, track);
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
