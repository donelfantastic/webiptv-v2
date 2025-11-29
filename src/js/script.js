document.addEventListener("DOMContentLoaded", () => {
  //NAVIGATION MENU JS
  let menuIcon = $(".toggle-nav");
  let nav = $(".nav");
  let navItem = $(".nav__item");

  $("video").prop("muted", true);

  $(".bg-video-wrap").click(function () {
    if ($("video").prop("muted")) {
      $("video").prop("muted", false);
    } else {
      $("video").prop("muted", true);
    }
  });

  menuIcon.click(function () {
    $(this).toggleClass("toggle-nav--open");

    if (nav.hasClass("nav--open")) {
      navItem.removeClass("nav__item--open");

      setTimeout(function () {
        nav.removeClass("nav--open");
      }, 550);
    } else {
      nav.addClass("nav--open");

      setTimeout(function () {
        navItem.addClass("nav__item--open");
      }, 550);
    }
  });
  const categorySelect = document.getElementById("categorySelect");
  const channelSelect = document.getElementById("channelSelect");
  const channelLogo = document.getElementById("channelLogo");
  const m3uLinkInput = document.getElementById("m3uLink");
  const loadButton = document.getElementById("loadButton");
  const uploadFile = document.getElementById("uploadFile");
  const videoSection = document.getElementById("videoSection");
  let channels = [];
  let videojsPlayer = null;
  function loadChannels(data) {
    const lines = data.split("\n");
    let currentChannel = {};
    let currentCategory = "";
    lines.forEach((line) => {
      if (line.startsWith("#EXTGRP:")) {
        currentCategory = line.split(":")[1];
      } else if (line.startsWith("#EXTINF:")) {
        const lastCommaIndex = line.lastIndexOf(",");
        currentChannel.name = line.slice(lastCommaIndex + 1);
        const groupTitleMatch = line.match(/group-title="([^"]*)"/);
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        currentChannel.category = groupTitleMatch
          ? groupTitleMatch[1]
          : currentCategory || "Unknown";
        currentChannel.logo = logoMatch ? logoMatch[1] : "";
      } else if (line.startsWith("http")) {
        currentChannel.url = line.trim();
        channels.push(currentChannel);
        currentChannel = {};
      }
    });
    const categories = [
      ...new Set(channels.map((channel) => channel.category))
    ];
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.text = category;
      option.value = category;
      categorySelect.appendChild(option);
    });
    function populateChannelSelect(filteredChannels) {
      channelSelect.innerHTML = "";
      filteredChannels.forEach((channel) => {
        const option = document.createElement("option");
        option.text = channel.name;
        option.value = channel.url;
        channelSelect.appendChild(option);
      });
    }
    function playFirstChannelInCategory(category) {
      const filteredChannels = channels.filter(
        (channel) => channel.category === category
      );
      if (filteredChannels.length > 0) {
        playStream(filteredChannels[0].url, filteredChannels[0].logo);
      }
    }
    categorySelect.addEventListener("change", () => {
      const selectedCategory = categorySelect.value;
      populateChannelSelect([]);
      const filteredChannels = channels.filter(
        (channel) => channel.category === selectedCategory
      );
      populateChannelSelect(filteredChannels);
      playFirstChannelInCategory(selectedCategory);
    });
    populateChannelSelect([]);
    if (categories.length > 0) {
      const firstCategory = categories[0];
      const filteredChannels = channels.filter(
        (channel) => channel.category === firstCategory
      );
      populateChannelSelect(filteredChannels);
      playFirstChannelInCategory(firstCategory);
    }
    channelSelect.addEventListener("change", () => {
      const selectedChannelUrl = channelSelect.value;
      const selectedChannel = channels.find(
        (channel) => channel.url === selectedChannelUrl
      );
      playStream(selectedChannelUrl, selectedChannel.logo);
    });
  }
  function recreateVideoTagIfNeeded() {
    // If #player doesn't exist, create and append it
    if (!document.getElementById("player")) {
      const videoTag = document.createElement("video");
      videoTag.id = "player";
      videoTag.className = "video-js";
      videoTag.setAttribute("autoplay", "");
      videoTag.setAttribute("muted", "");
      videoTag.setAttribute("controls", "");
      videoTag.setAttribute("playsinline", "");
      videoTag.setAttribute("crossorigin", "");
      videoSection.appendChild(videoTag);
    }
  }
  function playStream(url, logo) {
    if (logo) {
      channelLogo.style.display = "inline";
      channelLogo.src = logo;
    } else {
      channelLogo.style.display = "none";
    }
    // Dispose previous player (and remove video element)
    if (videojsPlayer) {
      videojsPlayer.dispose();
      videojsPlayer = null;
    }
    // Re-create the video element if needed
    recreateVideoTagIfNeeded();
    // Always use the latest video element
    const playerElement = document.getElementById("player");
    // Create new Video.js player instance
    videojsPlayer = videojs(playerElement, {
      html5: {
        vhs: {
          overrideNative: true
            },
          nativeAudioTracks: false,
          nativeVideoTracks: false
       },
      autoplay: true,
      controls: true,
      liveui: true,
      muted: true,
      playsinline: true,
      preload: "auto"
    });
    // Used corsproxy if url index of http protocol
    let secureMe = atob("aHR0cHM6Ly9jb3JzLXByb3h5LmNvb2tzLmZ5aQ==");
    let needHttps = atob("aHR0cHM6Ly9hbnl3aGVyZS5wd2lzZXR0aG9uLmNvbQ==");
    function getSecureUrl(url, corsProxy = needHttps ) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") {
          return url;
        } else if (parsed.protocol === "http:") {
          const proxy = corsProxy.endsWith("/") ? corsProxy : corsProxy + "/";
          return proxy + url;
        }
        return url;
      } catch (e) {
        return url;
      }
    }
    const sURL = getSecureUrl(url);
    // Set video source based on extension
    if (url.indexOf(".ts") > 0) {
      videojsPlayer.src({
        src: sURL,
        type: "video/mp2t"
      });
    } else if (url.indexOf(".m3u8") > 0) {
      videojsPlayer.src({
        type: "application/x-mpegURL",
        src: sURL
      });
    // Add the quality menu button 
    videojsPlayer.qualityMenu();
    } else if (url.indexOf(".mpd") > 0) {
      videojsPlayer.src({
        type: "application/dash+xml",
        src: sURL
      });
    // Add the quality menu button 
    } else if (url.indexOf(".mp4") > 0) {
      videojsPlayer.src({
        type: "video/mp4",
        src: sURL
      });  
    // Add the quality menu button 
    videojsPlayer.qualityMenu();
    } else {
      videojsPlayer.src({
        src: sURL
      });
    }
    videojsPlayer.load();
    videojsPlayer.play();
  }
  loadButton.addEventListener("click", () => {
    const m3uUrl = m3uLinkInput.value;
    if (m3uUrl) {
      channels = [];
      categorySelect.innerHTML = "";
      channelSelect.innerHTML = "";
      fetch(m3uUrl)
        .then((response) => response.text())
        .then((data) => {
          loadChannels(data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } else {
      console.log("Please enter an M3U link.");
    }
  });
  uploadFile.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      channels = [];
      categorySelect.innerHTML = "";
      channelSelect.innerHTML = "";
      const reader = new FileReader();
      reader.onload = function (e) {
        const fileContent = e.target.result;
        loadChannels(fileContent);
      };
      reader.readAsText(file);
    }
  });
  window.onload = () => {
 // const placeholderM3ULink = m3uLinkInput.placeholder;
 // country   
 // const placeholderM3ULink = atob("aHR0cHM6Ly9pcHR2LW9yZy5naXRodWIuaW8vaXB0di9pbmRleC5jb3VudHJ5Lm0zdQ==");
 // category   
    const placeholderM3ULink = atob("aHR0cHM6Ly9pcHR2LW9yZy5naXRodWIuaW8vaXB0di9pbmRleC5jYXRlZ29yeS5tM3U=");
    if (placeholderM3ULink) {
      channels = [];
      categorySelect.innerHTML = "";
      channelSelect.innerHTML = "";
      fetch(placeholderM3ULink)
        .then((response) => response.text())
        .then((data) => {
          loadChannels(data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  };

  //SOCIAL PANEL JS
  const floating_btn = document.querySelector(".floating-btn");
  const close_btn = document.querySelector(".close-btn");
  const social_panel_container = document.querySelector(
    ".social-panel-container"
  );

  floating_btn.addEventListener("click", () => {
    social_panel_container.classList.toggle("visible");
  });

  close_btn.addEventListener("click", () => {
    social_panel_container.classList.remove("visible");
  });
});
