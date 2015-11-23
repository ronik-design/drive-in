/* eslint max-statements:0 */

import Jvent from "jvent";
import Timer from "./timer";
import Playlist from "./playlist";
import {
  getWidth,
  getHeight,
  setStyles,
  findPoster,
  createEl,
  replaceChildren
} from "./utils";

class DriveIn extends Jvent {

  constructor() {
    super();

    this._listeners = [];

    this.parentEl = null;
    this.mediaEl = null;
    this.placeholderEl = null;

    this.mute = true;
    this.currMediaType = null;
    this.mediaAspect = 16 / 9;
    this.playlist = null;
    this.loop = true;
    this.loopPlaylistItems = false;
    this.slideshow = false;
    this.startPaused = false;

    this.playlistLength = 0;
    this.currentItem = 0;
    this.slideshowItemDuration = 10;
    this._slideshowTimer = null;
    this._seeking = false;

    this.poster = null;

    this.loading = true;
  }

  _updateSize(mediaEl, mediaType, mediaAspect) {

    const pad = 1;

    const containerW = getWidth();
    const containerH = getHeight();
    const containerAspect = containerW / containerH;

    if (containerAspect < mediaAspect) {

      // taller
      setStyles(this.parentEl, {
        width: `${Math.ceil(containerH * mediaAspect)}px`,
        height: `${containerH + pad}px`
      });

      if (mediaType === "video") {

        setStyles(mediaEl, {
          width: `${Math.ceil(containerH * mediaAspect)}px`,
          height: `${containerH}px`
        });

      } else {

        // is image
        setStyles(mediaEl, {
          width: "auto",
          height: `${containerH + pad}px`
        });
      }

    } else {

      // wider

      setStyles(this.parentEl, {
        width: `${containerW}px`,
        height: `${Math.ceil(containerW / mediaAspect) + 1}px`
      });

      if (mediaType === "video") {

        setStyles(mediaEl, {
          width: `${this.parentEl.offsetWidth}px`,
          height: "auto"
        });

      } else {

        // is image
        setStyles(mediaEl, {
          width: `${containerW}px`,
          height: "auto"
        });
      }
    }
  }

  _setVideoData() {
    const mediaEl = this.mediaEl;
    this.mediaAspect = mediaEl.videoWidth / mediaEl.videoHeight;
    this._updateSize(mediaEl, "video", this.mediaAspect);
  }

  _setImageData(data) {
    this.mediaAspect = data.naturalWidth / data.naturalHeight;

    if (!this.isTouch) {
      this._updateSize(this.mediaEl, "image", this.mediaAspect);
    }
  }

  _loadSource(sourceEls, posterSrc) {

    const mediaEl = this.mediaEl;

    this.emit("media.loading");

    mediaEl.preload = "auto";
    if (this.playlistLength < 2 || this.loopPlaylistItems) {
      mediaEl.loop = true;
    }

    if (this.mute) {
      this.setVolume(0);
    }

    if (posterSrc) {
      mediaEl.poster = posterSrc;
    }

    replaceChildren(mediaEl, sourceEls);

    mediaEl.load();
  }

  _playVideoItem(item, itemNum) {

    const mediaEl = this.mediaEl;
    const sourceEls = [];
    let source;
    let sourceEl;
    let posterSrc;
    let canPlayType;

    for (source of item) {
      if (source.type.search(/^image/) === 0 && !posterSrc) {
        posterSrc = source.src;
      } else {
        sourceEl = createEl("source", {
          src: source.src,
          type: source.type
        });
      }

      if (sourceEl) {
        canPlayType = mediaEl.canPlayType(source.type);
        if (canPlayType === "probably") {
          sourceEls.unshift(sourceEl);
        } else {
          sourceEls.push(sourceEl);
        }
      }
    }

    if (sourceEls.length) {

      this._loadSource(sourceEls, posterSrc);
      this.currentItem = itemNum;

    } else if (posterSrc || this.poster) {

      // Fallback to a slideshow.
      this.slideshow = true;
      this._createMediaEl();
      this._playImageItem(item, itemNum);

    } else {

      this.emit("media.error", new Error("No playable source"));
    }
  }

  _playImageItem(item, itemNum) {
    let source;
    let src;

    if (item && item.length) {
      for (source of item) {
        if (source.type.search(/^image/) === 0 && !src) {
          src = source.src;
        }
      }
    }

    if (!src && this.poster) {
      src = this.poster.src;
    }

    if (src) {

      this.emit("media.loading");

      this.mediaEl.src = src;
      this.currentItem = itemNum;

    } else {

      this.emit("media.error", new Error("No playable source"));
    }
  }

  _setBackgroundItem() {
    this.parentEl.style["background-image"] = `url("${this.poster.src}")`;
  }

  _playItem(item, itemNum) {
    if (this.isTouch) {
      this._setBackgroundItem();

      // This should default to load the poster, which provides
      // the necessary events
      this._playImageItem();
      return;
    }

    if (this.currMediaType === "video") {
      this._playVideoItem(item, itemNum);
    }

    if (this.currMediaType === "image") {
      this._playImageItem(item, itemNum);
    }

    this._seeking = false;
  }

  _loadPlaylist(playlist) {
    this.playlist = playlist;
    this.playlistLength = playlist.length;
    this._playItem(playlist[0], 0);
  }

  _addListener(element, event, handler) {

    element.addEventListener(event, handler);

    this._listeners.push({ element, event, handler });
  }

  _removeAllListeners() {
    const listeners = this._listeners;
    let listen;

    for (listen of listeners) {
      listen.element.removeEventListener(listen.event, listen.handler);
    }
  }

  _attachVideoListeners() {

    const mediaEl = this.mediaEl;

    const isVideo = function (video) {

      // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
      // to be anything other than 0. If the byte count is available we use this instead.
      // Browsers that support the else if do not seem to have the bufferedBytes value and
      // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.

      return typeof video.bytesTotal !== "undefined" &&
        video.bytesTotal > 0 &&
        typeof video.bufferedBytes !== "undefined";
    };

    const onLoadedMetadata = (data) => {
      this._setVideoData(data);
      this.emit("media.metadata", data);
    };

    const onPlaying = () => {
      this.emit("media.playing", this.currentItem);
    };

    const onPause = () => {
      this.emit("media.pause");
    };

    const onProgress = (event) => {
      // Sort of buggy, with readyState and buffer being inconsistent...
      const video = event.target;
      let percent = null;

      // FF4+, Chrome
      if (video.buffered && video.buffered.length > 0 && video.buffered.end && video.duration) {
        percent = video.buffered.end(0) / video.duration;
      } else if (isVideo(video)) {
        percent = video.bufferedBytes / video.bytesTotal;
      }

      if (percent !== null) {
        percent = 100 * Math.min(1, Math.max(0, percent));
      }

      if (video.networkState === 1 && video.readyState === 0) {
        percent = 100;
      }

      this.emit("media.progress", percent);
    };

    const onEnded = () => {
      if (!this._seeking) {
        this.emit("media.ended", this.currentItem);
      }
    };

    const onCanPlay = () => {
      this.emit("media.canplay");

      if (!this.startPaused) {
        mediaEl.play();
      }

      if (this._seeking) {
        this._seeking = false;
      }
    };

    this._addListener(mediaEl, "loadedmetadata", onLoadedMetadata);
    this._addListener(mediaEl, "playing", onPlaying);
    this._addListener(mediaEl, "pause", onPause);
    this._addListener(mediaEl, "ended", onEnded);
    this._addListener(mediaEl, "canplay", onCanPlay);
    this._addListener(mediaEl, "progress", onProgress, false);
  }

  _attachImageListeners() {

    const mediaEl = this.mediaEl;

    const ended = () => {
      this.mediaEl.dispatchEvent(new Event("ended"));
    };

    const onPause = () => {
      this.emit("media.pause");
    };

    const onLoad = () => {
      this.emit("media.canplay");

      this._setImageData(this);
      this.emit("media.metadata", this);
      this.emit("media.playing", this.currentItem);

      if (this.isTouch) {
        return;
      }

      if (this.playlistLength > 1) {

        if (this._slideshowTimer) {
          this._slideshowTimer.destroy();
        }

        this._slideshowTimer = new Timer(ended, this.slideshowItemDuration * 1000);

        if (this.startPaused) {
          this._slideshowTimer.pause();
        }

        this._slideshowTimer.on("pause", onPause);
      }
    };

    const onEnded = () => {
      this.emit("media.ended", this.currentItem);
    };

    this._addListener(mediaEl, "load", onLoad);
    this._addListener(mediaEl, "ended", onEnded);
  }

  _attachListeners() {
    const mediaEl = this.mediaEl;

    if (this.isTouch) {
      this._attachImageListeners();
      return;
    }

    const onResize = () => {
      window.requestAnimationFrame(() => {
        if (this.metadataLoaded) {
          this._updateSize(mediaEl, this.currMediaType, this.mediaAspect);
        }
      });
    };

    this._addListener(window, "resize", onResize);

    if (this.currMediaType === "video") {
      this._attachVideoListeners();
    } else {
      this._attachImageListeners();
    }

    const onMediaEnded = () => {

      if (this._seeking) {
        return;
      }

      let itemNum = 0;

      if (this.playlistLength > 1 && this.loopPlaylistItems) {
        if (this.currMediaType === "image") {
          // Images need a reboot, video is handled via `loop`
          this.play(this.currentItem);
        }
        return;
      }

      if (this.playlistLength > 1 && this.loop) {
        if (this.currentItem + 1 < this.playlistLength) {
          itemNum = this.currentItem + 1;
        }
        this.play(itemNum);
      }
    };

    const onMediaCanplay = () => {
      mediaEl.style.opacity = 1;
      this.canplay = true;
    };

    const onMediaMetadata = () => {
      this.metadataLoaded = true;
    };

    const onMediaLoading = () => {
      this.canplay = false;
      this.metadataLoaded = false;
    };

    this.on("media.ended", onMediaEnded);
    this.on("media.canplay", onMediaCanplay);
    this.on("media.metadata", onMediaMetadata);
    this.on("media.loading", onMediaLoading);
  }

  _setParent(el) {

    if (this.isTouch) {

      setStyles(el, {
        width: "100%",
        height: "100%",
        display: "block",
        "background-position": "50% 50%",
        "background-repeat": "no-repeat no-repeat",
        "background-attachment": "local",
        "background-size": "cover"
      });

    } else {

      setStyles(el, {
        position: "absolute",
        display: "block",
        transform: "translate3d(-50%,-50%,0)",
        "-webkit-transform": "translate3d(-50%,-50%,0)",
        left: "50%",
        top: "50%"
      });
    }

    return el;
  }

  _cleanup() {
    const el = this.parentEl;
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  _createMediaEl() {
    let mediaEl;

    if (this.mediaEl) {
      this._cleanup();
    }

    if (this.isTouch) {

      this.currMediaType = "image";
      mediaEl = createEl("img");
      setStyles(mediaEl, {
        display: "none"
      });
      return mediaEl;

    } else if (this.slideshow) {

      this.currMediaType = "image";
      mediaEl = createEl("img");

    } else {

      this.currMediaType = "video";
      mediaEl = createEl("video", {
        height: 1,
        width: 1,
        preload: "metadata"
      });
    }

    if (mediaEl) {

      mediaEl.style.opacity = 0;
      setStyles(mediaEl, {
        display: "block"
      });

      return mediaEl;
    }
  }

  init(options = {}) {

    this.isTouch = options.isTouch !== undefined ?
      options.isTouch : "ontouchstart" in window;

    this.slideshow = options.slideshow;

    this.startPaused = options.startPaused;

    this.parentEl = this._setParent(options.el);

    const mediaEl = this._createMediaEl();

    this.parentEl.appendChild(mediaEl);
    this.mediaEl = mediaEl;

    this._attachListeners();
  }

  show(rawItem, options) {
    if (rawItem.constructor === Array) {
      return this.showPlaylist([rawItem], options);
    }

    if (rawItem.constructor === Object) {
      return this.showPlaylist([
        [rawItem]
      ], options);
    }

    return this.showPlaylist([Playlist.makePlaylistItem(rawItem)], options);
  }

  showPlaylist(rawPlaylist, options) {
    options = options || {};

    if (options.hasOwnProperty("mute")) {
      this.mute = options.mute;
    }

    if (options.hasOwnProperty("loop")) {
      this.loop = options.loop;
    }

    if (options.hasOwnProperty("loopPlaylistItems")) {
      this.loopPlaylistItems = options.loopPlaylistItems;
      if (this.loopPlaylistItems) {
        this.loop = false;
      }
    }

    const playlist = Playlist.makePlaylist(rawPlaylist);

    if (options.poster) {
      if (typeof options.poster === "string") {
        this.poster = {
          src: options.poster
        };
      } else {
        this.poster = options.poster;
      }
    } else {
      this.poster = findPoster(playlist);
    }

    this._loadPlaylist(playlist);
  }

  setVolume(level) {
    if (this.currMediaType === "image") {
      return;
    }

    if (level === 0) {
      this.mute = true;
      this.mediaEl.muted = true;
      this.mediaEl.volume = 0;
    } else {
      this.mute = false;
      this.mediaEl.muted = false;
      this.mediaEl.volume = level;
    }
  }

  setPlaybackRate(rate) {
    if (this.currMediaType === "image") {
      return;
    }

    this.mediaEl.playbackRate = rate || 1.0;
  }

  getMedia() {
    return this.mediaEl;
  }

  getPlaylist() {
    return this.playlist;
  }

  getItem(itemNum) {
    return this.playlist[itemNum];
  }

  play(itemNum) {
    this._seeking = true;

    if (typeof itemNum === "number") {
      this._playItem(this.playlist[itemNum], itemNum);
    } else if (this.currMediaType === "video") {
      this.mediaEl.play();
    } else if (this._slideshowTimer) {
      this._slideshowTimer.resume();
    }
  }

  pause() {
    if (this.currMediaType === "video") {
      this.mediaEl.pause();
    } else if (this._slideshowTimer) {
      this._slideshowTimer.pause();
    }
  }

  close() {
    this._removeAllListeners();
    this._cleanup();
    if (this._slideshowTimer) {
      this._slideshowTimer.destroy();
      delete this._slideshowTimer;
    }
  }

  currentTime() {
    if (this.currMediaType === "video") {
      return this.mediaEl.currentTime;
    } else {
      return this._slideshowTimer.currentTime();
    }
  }

  seekTo(time) {
    this._seeking = true;
    if (this.currMediaType === "video") {
      this.mediaEl.currentTime = time;
    }
  }

  duration() {
    if (this.currMediaType === "video") {
      return this.mediaEl.duration;
    } else {
      return this.slideshowItemDuration;
    }
  }
}

export default DriveIn;
