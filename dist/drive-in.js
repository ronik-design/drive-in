'use strict';

var Jvent = require('jvent');
Jvent = 'default' in Jvent ? Jvent['default'] : Jvent;

var babelHelpers = {};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

babelHelpers.inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

babelHelpers.possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

babelHelpers;
var eachNode = function eachNode(nodes, fn) {
  [].slice.call(nodes).forEach(fn);
};

var getWidth = function getWidth() {

  if (self.innerHeight) {
    return self.innerWidth;
  }

  if (document.documentElement && document.documentElement.clientWidth) {
    return document.documentElement.clientWidth;
  }

  if (document.body) {
    return document.body.clientWidth;
  }
};

var getHeight = function getHeight() {

  if (self.innerHeight) {
    return self.innerHeight;
  }

  if (document.documentElement && document.documentElement.clientHeight) {
    return document.documentElement.clientHeight;
  }

  if (document.body) {
    return document.body.clientHeight;
  }
};

var setStyles = function setStyles(el, props) {

  var cssString = "";
  var p = undefined;

  for (p in props) {
    cssString += p + ":" + props[p] + ";";
  }

  el.style.cssText += ";" + cssString;
};

var findPoster = function findPoster(playlist) {

  var poster = undefined;
  var item = undefined;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = playlist[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      item = _step.value;

      if (item.constructor === Array) {
        poster = findPoster(item);
      } else if (item.type.search(/^image/) > -1) {
        return item;
      }

      if (poster) {
        return poster;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

var replaceChildren = function replaceChildren(el, newChildren) {

  var children = el.children || el.childNodes;

  if (children.length) {
    eachNode(children, function (childEl) {
      var newChild = newChildren.shift();
      if (newChild) {
        el.replaceChild(newChild, childEl);
      } else {
        el.removeChild(childEl);
      }
    });
  }

  if (newChildren.length) {
    newChildren.forEach(function (newChild) {
      el.appendChild(newChild);
    });
  }
};

var createEl = function createEl(name, props) {

  var el = document.createElement(name);
  var prop = undefined;

  for (prop in props) {
    el[prop] = props[prop];
  }

  return el;
};

var VIDEO_EXTS = {
  mp4: true,
  ogv: true,
  webm: true
};

var IMAGE_EXTS = {
  jpg: true,
  png: true,
  gif: true
};

var EXT_RE = /\.([mp4|ogv|webm|jpg|jpeg|png|gif]+)$/;

var makePlaylistItem = function makePlaylistItem(src) {

  var item = { src: src };

  var ext = item.src.replace(/[\?|\#].+/, "").match(EXT_RE)[1];

  if (VIDEO_EXTS[ext]) {
    if (ext === "ogv") {
      item.type = "video/ogg";
    } else {
      item.type = "video/" + ext;
    }
  }

  if (IMAGE_EXTS[ext]) {
    if (ext === "jpg") {
      item.type = "image/jpeg";
    } else {
      item.type = "image/" + ext;
    }
  }

  return item;
};

var makePlaylist = function makePlaylist(rawPlaylist) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  var playlist = [];

  var item = undefined;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = rawPlaylist[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      item = _step.value;

      if (item.constructor === Object) {
        playlist.push([item]);
      }

      if (item.constructor === Array) {
        playlist.push(makePlaylist(item, depth + 1));
      }

      if (typeof item === "string") {
        if (depth === 0) {
          playlist.push([makePlaylistItem(item)]);
        } else {
          playlist.push(makePlaylistItem(item));
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return playlist;
};

var Playlist = {
  makePlaylist: makePlaylist,
  makePlaylistItem: makePlaylistItem
};

var Timer = (function (_Jvent) {
  babelHelpers.inherits(Timer, _Jvent);

  function Timer(callback, delay) {
    babelHelpers.classCallCheck(this, Timer);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Timer).call(this));

    _this.callback = callback;
    _this.remaining = delay;
    _this.timerId = null;
    _this.start = null;

    _this.resume();
    return _this;
  }

  babelHelpers.createClass(Timer, [{
    key: "pause",
    value: function pause(silent) {
      clearTimeout(this.timerId);
      this.remaining -= new Date() - this.start;

      if (!silent) {
        this.emit("pause");
      }
    }
  }, {
    key: "resume",
    value: function resume(silent) {
      this.start = new Date();
      clearTimeout(this.timerId);
      this.timerId = setTimeout(this.callback, this.remaining);

      if (!silent) {
        this.emit("resume");
      }
    }
  }, {
    key: "currentTime",
    value: function currentTime() {
      var currTime = new Date() - this.start;
      if (this.timerId) {
        this.pause(true);
        this.resume(true);
      }
      return currTime;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.pause(true);
      this.removeAllListeners();
    }
  }]);
  return Timer;
})(Jvent);

var DriveIn = (function (_Jvent) {
  babelHelpers.inherits(DriveIn, _Jvent);

  function DriveIn() {
    babelHelpers.classCallCheck(this, DriveIn);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(DriveIn).call(this));

    _this._listeners = [];

    _this.parentEl = null;
    _this.mediaEl = null;
    _this.placeholderEl = null;

    _this.mute = true;
    _this.currMediaType = null;
    _this.mediaAspect = 16 / 9;
    _this.playlist = null;
    _this.loop = true;
    _this.loopPlaylistItems = false;
    _this.slideshow = false;
    _this.startPaused = false;

    _this.playlistLength = 0;
    _this.currentItem = 0;
    _this.slideshowItemDuration = 10;
    _this._slideshowTimer = null;
    _this._seeking = false;

    _this.poster = null;

    _this.loading = true;
    return _this;
  }

  babelHelpers.createClass(DriveIn, [{
    key: "_updateSize",
    value: function _updateSize(mediaEl, mediaType, mediaAspect) {

      var pad = 1;

      var containerW = getWidth();
      var containerH = getHeight();
      var containerAspect = containerW / containerH;

      if (containerAspect < mediaAspect) {

        // taller
        setStyles(this.parentEl, {
          width: Math.ceil(containerH * mediaAspect) + "px",
          height: containerH + pad + "px"
        });

        if (mediaType === "video") {

          setStyles(mediaEl, {
            width: Math.ceil(containerH * mediaAspect) + "px",
            height: containerH + "px"
          });
        } else {

          // is image
          setStyles(mediaEl, {
            width: "auto",
            height: containerH + pad + "px"
          });
        }
      } else {

        // wider

        setStyles(this.parentEl, {
          width: containerW + "px",
          height: Math.ceil(containerW / mediaAspect) + 1 + "px"
        });

        if (mediaType === "video") {

          setStyles(mediaEl, {
            width: this.parentEl.offsetWidth + "px",
            height: "auto"
          });
        } else {

          // is image
          setStyles(mediaEl, {
            width: containerW + "px",
            height: "auto"
          });
        }
      }
    }
  }, {
    key: "_setVideoData",
    value: function _setVideoData() {
      var mediaEl = this.mediaEl;
      this.mediaAspect = mediaEl.videoWidth / mediaEl.videoHeight;
      this._updateSize(mediaEl, "video", this.mediaAspect);
    }
  }, {
    key: "_setImageData",
    value: function _setImageData(data) {
      this.mediaAspect = data.naturalWidth / data.naturalHeight;

      if (!this.isTouch) {
        this._updateSize(this.mediaEl, "image", this.mediaAspect);
      }
    }
  }, {
    key: "_loadSource",
    value: function _loadSource(sourceEls, posterSrc) {

      var mediaEl = this.mediaEl;

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
  }, {
    key: "_playVideoItem",
    value: function _playVideoItem(item, itemNum) {

      var mediaEl = this.mediaEl;
      var sourceEls = [];
      var source = undefined;
      var sourceEl = undefined;
      var posterSrc = undefined;
      var canPlayType = undefined;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = item[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          source = _step.value;

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
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
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
  }, {
    key: "_playImageItem",
    value: function _playImageItem(item, itemNum) {
      var source = undefined;
      var src = undefined;

      if (item && item.length) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = item[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            source = _step2.value;

            if (source.type.search(/^image/) === 0 && !src) {
              src = source.src;
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
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
  }, {
    key: "_setBackgroundItem",
    value: function _setBackgroundItem() {
      this.parentEl.style["background-image"] = "url(\"" + this.poster.src + "\")";
    }
  }, {
    key: "_playItem",
    value: function _playItem(item, itemNum) {
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
  }, {
    key: "_loadPlaylist",
    value: function _loadPlaylist(playlist) {
      this.playlist = playlist;
      this.playlistLength = playlist.length;
      this._playItem(playlist[0], 0);
    }
  }, {
    key: "_addListener",
    value: function _addListener(element, event, handler) {

      element.addEventListener(event, handler);

      this._listeners.push({ element: element, event: event, handler: handler });
    }
  }, {
    key: "_removeAllListeners",
    value: function _removeAllListeners() {
      var listeners = this._listeners;
      var listen = undefined;

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = listeners[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          listen = _step3.value;

          listen.element.removeEventListener(listen.event, listen.handler);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: "_attachVideoListeners",
    value: function _attachVideoListeners() {
      var _this2 = this;

      var mediaEl = this.mediaEl;

      var isVideo = function isVideo(video) {

        // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
        // to be anything other than 0. If the byte count is available we use this instead.
        // Browsers that support the else if do not seem to have the bufferedBytes value and
        // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.

        return typeof video.bytesTotal !== "undefined" && video.bytesTotal > 0 && typeof video.bufferedBytes !== "undefined";
      };

      var onLoadedMetadata = function onLoadedMetadata(data) {
        _this2._setVideoData(data);
        _this2.emit("media.metadata", data);
      };

      var onPlaying = function onPlaying() {
        _this2.emit("media.playing", _this2.currentItem);
      };

      var onPause = function onPause() {
        _this2.emit("media.pause");
      };

      var onProgress = function onProgress(event) {
        // Sort of buggy, with readyState and buffer being inconsistent...
        var video = event.target;
        var percent = null;

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

        _this2.emit("media.progress", percent);
      };

      var onEnded = function onEnded() {
        if (!_this2._seeking) {
          _this2.emit("media.ended", _this2.currentItem);
        }
      };

      var onCanPlay = function onCanPlay() {
        _this2.emit("media.canplay");

        if (!_this2.startPaused) {
          mediaEl.play();
        }

        if (_this2._seeking) {
          _this2._seeking = false;
        }
      };

      this._addListener(mediaEl, "loadedmetadata", onLoadedMetadata);
      this._addListener(mediaEl, "playing", onPlaying);
      this._addListener(mediaEl, "pause", onPause);
      this._addListener(mediaEl, "ended", onEnded);
      this._addListener(mediaEl, "canplay", onCanPlay);
      this._addListener(mediaEl, "progress", onProgress, false);
    }
  }, {
    key: "_attachImageListeners",
    value: function _attachImageListeners() {
      var _this3 = this;

      var mediaEl = this.mediaEl;

      var ended = function ended() {
        _this3.mediaEl.dispatchEvent(new Event("ended"));
      };

      var onPause = function onPause() {
        _this3.emit("media.pause");
      };

      var onLoad = function onLoad() {
        _this3.emit("media.canplay");

        _this3._setImageData(_this3);
        _this3.emit("media.metadata", _this3);
        _this3.emit("media.playing", _this3.currentItem);

        if (_this3.isTouch) {
          return;
        }

        if (_this3.playlistLength > 1) {

          if (_this3._slideshowTimer) {
            _this3._slideshowTimer.destroy();
          }

          _this3._slideshowTimer = new Timer(ended, _this3.slideshowItemDuration * 1000);

          if (_this3.startPaused) {
            _this3._slideshowTimer.pause();
          }

          _this3._slideshowTimer.on("pause", onPause);
        }
      };

      var onEnded = function onEnded() {
        _this3.emit("media.ended", _this3.currentItem);
      };

      this._addListener(mediaEl, "load", onLoad);
      this._addListener(mediaEl, "ended", onEnded);
    }
  }, {
    key: "_attachListeners",
    value: function _attachListeners() {
      var _this4 = this;

      var mediaEl = this.mediaEl;

      if (this.isTouch) {
        this._attachImageListeners();
        return;
      }

      var onResize = function onResize() {
        window.requestAnimationFrame(function () {
          if (_this4.metadataLoaded) {
            _this4._updateSize(mediaEl, _this4.currMediaType, _this4.mediaAspect);
          }
        });
      };

      this._addListener(window, "resize", onResize);

      if (this.currMediaType === "video") {
        this._attachVideoListeners();
      } else {
        this._attachImageListeners();
      }

      var onMediaEnded = function onMediaEnded() {

        if (_this4._seeking) {
          return;
        }

        var itemNum = 0;

        if (_this4.playlistLength > 1 && _this4.loopPlaylistItems) {
          if (_this4.currMediaType === "image") {
            // Images need a reboot, video is handled via `loop`
            _this4.play(_this4.currentItem);
          }
          return;
        }

        if (_this4.playlistLength > 1 && _this4.loop) {
          if (_this4.currentItem + 1 < _this4.playlistLength) {
            itemNum = _this4.currentItem + 1;
          }
          _this4.play(itemNum);
        }
      };

      var onMediaCanplay = function onMediaCanplay() {
        mediaEl.style.opacity = 1;
        _this4.canplay = true;
      };

      var onMediaMetadata = function onMediaMetadata() {
        _this4.metadataLoaded = true;
      };

      var onMediaLoading = function onMediaLoading() {
        _this4.canplay = false;
        _this4.metadataLoaded = false;
      };

      this.on("media.ended", onMediaEnded);
      this.on("media.canplay", onMediaCanplay);
      this.on("media.metadata", onMediaMetadata);
      this.on("media.loading", onMediaLoading);
    }
  }, {
    key: "_setParent",
    value: function _setParent(el) {

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
  }, {
    key: "_cleanup",
    value: function _cleanup() {
      var el = this.parentEl;
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }
  }, {
    key: "_createMediaEl",
    value: function _createMediaEl() {
      var mediaEl = undefined;

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
  }, {
    key: "init",
    value: function init() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      this.isTouch = options.isTouch !== undefined ? options.isTouch : "ontouchstart" in window;

      this.slideshow = options.slideshow;

      this.startPaused = options.startPaused;

      this.parentEl = this._setParent(options.el);

      var mediaEl = this._createMediaEl();

      this.parentEl.appendChild(mediaEl);
      this.mediaEl = mediaEl;

      this._attachListeners();
    }
  }, {
    key: "show",
    value: function show(rawItem, options) {
      if (rawItem.constructor === Array) {
        return this.showPlaylist([rawItem], options);
      }

      if (rawItem.constructor === Object) {
        return this.showPlaylist([[rawItem]], options);
      }

      return this.showPlaylist([Playlist.makePlaylistItem(rawItem)], options);
    }
  }, {
    key: "showPlaylist",
    value: function showPlaylist(rawPlaylist, options) {
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

      var playlist = Playlist.makePlaylist(rawPlaylist);

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
  }, {
    key: "setVolume",
    value: function setVolume(level) {
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
  }, {
    key: "setPlaybackRate",
    value: function setPlaybackRate(rate) {
      if (this.currMediaType === "image") {
        return;
      }

      this.mediaEl.playbackRate = rate || 1.0;
    }
  }, {
    key: "getMedia",
    value: function getMedia() {
      return this.mediaEl;
    }
  }, {
    key: "getPlaylist",
    value: function getPlaylist() {
      return this.playlist;
    }
  }, {
    key: "getItem",
    value: function getItem(itemNum) {
      return this.playlist[itemNum];
    }
  }, {
    key: "play",
    value: function play(itemNum) {
      this._seeking = true;

      if (typeof itemNum === "number") {
        this._playItem(this.playlist[itemNum], itemNum);
      } else if (this.currMediaType === "video") {
        this.mediaEl.play();
      } else if (this._slideshowTimer) {
        this._slideshowTimer.resume();
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      if (this.currMediaType === "video") {
        this.mediaEl.pause();
      } else if (this._slideshowTimer) {
        this._slideshowTimer.pause();
      }
    }
  }, {
    key: "close",
    value: function close() {
      this._removeAllListeners();
      this._cleanup();
      if (this._slideshowTimer) {
        this._slideshowTimer.destroy();
        delete this._slideshowTimer;
      }
    }
  }, {
    key: "currentTime",
    value: function currentTime() {
      if (this.currMediaType === "video") {
        return this.mediaEl.currentTime;
      } else {
        return this._slideshowTimer.currentTime();
      }
    }
  }, {
    key: "seekTo",
    value: function seekTo(time) {
      this._seeking = true;
      if (this.currMediaType === "video") {
        this.mediaEl.currentTime = time;
      }
    }
  }, {
    key: "duration",
    value: function duration() {
      if (this.currMediaType === "video") {
        return this.mediaEl.duration;
      } else {
        return this.slideshowItemDuration;
      }
    }
  }]);
  return DriveIn;
})(Jvent);

module.exports = DriveIn;