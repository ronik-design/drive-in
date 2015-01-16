var Jvent = require('jvent'),
    inherits = require('inherits'),
    Timer = require('./timer'),
    Playlist = require('./playlist');

function windowWidth() {
    if (self.innerHeight) {
        return self.innerWidth;
    }

    if (document.documentElement && document.documentElement.clientHeight) {
        return document.documentElement.clientWidth;
    }

    if (document.body) {
        return document.body.clientWidth;
    }
}

function windowHeight() {
    if (self.innerHeight) {
        return self.innerHeight;
    }

    if (document.documentElement && document.documentElement.clientHeight) {
        return document.documentElement.clientHeight;
    }

    if (document.body) {
        return document.body.clientHeight;
    }
}

function setStyles(el, props) {
    var cssString = '';
    for (var p in props) {
        cssString += p + ':' + props[p] + ';';
    }
    el.style.cssText += ';' + cssString;
}

function findPoster(playlist) {
    var poster,
        item;

    for (var i in playlist) {
        item = playlist[i];

        if (item.constructor === Array) {
            poster = findPoster(item);
        } else {
            if (item.type.search(/^image/) > -1) {
                return item;
            }
        }

        if (poster) {
            return poster;
        }
    }
}

function createEl(name, props) {
    var el = document.createElement(name);
    for (var prop in props) {
        el[prop] = props[prop];
    }
    return el;
}

function DriveIn() {
    this._listeners = [];

    this.parentEl = null;
    this.mediaEl = null;
    this.placeholderEl = null;

    this.mute = true;
    this.currMediaType = null;
    this.mediaAspect = 16 / 9;
    this.playlist = null;
    this.loop = true;
    this.slideshow = false;

    this.playlistLength = 0;
    this.currentItem = 0;
    this.slideshowItemDuration = 10;
    this._slideshowTimer = null;

    this.poster = null;

    this.loading = true;
}

inherits(DriveIn, Jvent);

DriveIn.prototype._updateSize = function(mediaEl, mediaType, mediaAspect) {

    var pad = 1,
        container = document.body,
        parentEl = this.parentEl;

    var winW = windowWidth(),
        winH = windowHeight(),
        containerW = container.offsetWidth < winW ? container.offsetWidth : winW,
        containerH = container.offsetHeight < winH ? container.offsetHeight : winH,
        containerAspect = containerW / containerH;

    if (container.nodeName === 'BODY') {
        setStyles(container, {
            height: 'auto'
        });

        if (winH > container.offsetHeight) {
            setStyles(container, {
                height: '100%'
            });
            setStyles(document.documentElement, {
                height: '100%'
            });
        }
    }

    if (containerAspect < mediaAspect) {

        // taller

        setStyles(parentEl, {
            width: Math.ceil(containerH * mediaAspect) + 'px',
            height: containerH + pad + 'px'
        });

        if (mediaType === 'video') {

            setStyles(mediaEl, {
                width: Math.ceil(containerH * mediaAspect) + 'px',
                height: containerH + 'px'
            });

        } else {

            // is image
            setStyles(mediaEl, {
                width: 'auto',
                height: containerH + pad + 'px'
            });
        }

    } else {

        // wider

        setStyles(parentEl, {
            width: containerW + 'px',
            height: Math.ceil(containerW / mediaAspect) + 1 + 'px'
        });

        if (mediaType === 'video') {

            setStyles(mediaEl, {
                width: parentEl.offsetWidth + 'px',
                height: 'auto'
            });

        } else {

            // is image
            setStyles(mediaEl, {
                width: containerW + 'px',
                height: 'auto'
            });
        }
    }
};

DriveIn.prototype._setVideoData = function() {
    var mediaEl = this.mediaEl;
    this.mediaAspect = mediaEl.videoWidth / mediaEl.videoHeight;
    this._updateSize(mediaEl, 'video', this.mediaAspect);
};

DriveIn.prototype._setImageData = function(data) {
    this.mediaAspect = data.naturalWidth / data.naturalHeight;
    this._updateSize(this.mediaEl, 'image', this.mediaAspect);
};

DriveIn.prototype._playVideoItem = function(item, itemNum) {
    var mediaEl = this.mediaEl,
        source,
        src,
        posterSrc,
        canPlayType;

    for (var i in item) {
        source = item[i];
        canPlayType = mediaEl.canPlayType(source.type);
        if (canPlayType === 'probably') {
            src = source.src;
        } else if (canPlayType && !src) {
            src = source.src;
        }

        if (source.type.search(/^image/) === 0 && !posterSrc) {
            posterSrc = source.src;
        }
    }

    if (src) {

        this.emit('media.loading');

        mediaEl.src = src;
        mediaEl.preload = 'metadata';

        if (posterSrc) {
            mediaEl.poster = posterSrc;
        }

        if (this.playlistLength < 2) mediaEl.loop = true;
        if (this.mute) this.setVolume(0);

        this.currentItem = itemNum;

        mediaEl.load();

    } else if (posterSrc || this.poster) {

        // Fallback to a slideshow.
        this.slideshow = true;
        this._createMediaEl();
        this._playImageItem(item, itemNum);

    } else {

        this.emit('media.error', new Error('No playable source'));
    }
};

DriveIn.prototype._playImageItem = function(item, itemNum) {
    var source,
        src;

    for (var i in item) {
        source = item[i];
        if (source.type.search(/^image/) === 0 && !src) {
            src = source.src;
        }
    }

    if (!src && this.poster) {
        src = this.poster.src;
    }

    if (src) {

        this.emit('media.loading');

        this.mediaEl.src = src;
        this.currentItem = itemNum;

    } else {

        this.emit('media.error', new Error('No playable source'));
    }
};

DriveIn.prototype._playItem = function(item, itemNum) {
    if (this.currMediaType === 'video') {
        this._playVideoItem(item, itemNum);
    }

    if (this.currMediaType === 'image') {
        this._playImageItem(item, itemNum);
    }
};

DriveIn.prototype._loadPlaylist = function(playlist) {
    this.playlist = playlist;
    this.playlistLength = playlist.length;
    this._playItem(playlist[0], 0);
};

DriveIn.prototype._addListener = function(element, event, handler) {

    element.addEventListener(event, handler);

    this._listeners.push({
        element: element,
        event: event,
        handler: handler
    });
};

DriveIn.prototype._removeAllListeners = function() {
    var listeners = this._listeners,
        listen;

    for (var i in listeners) {
        listen = listeners[i];
        listen.element.removeEventListener(listen.event, listen.handler);
    }
};

DriveIn.prototype._attachVideoListeners = function() {
    var self = this,
        mediaEl = this.mediaEl;

    function onLoadedMetadata(data) {
        // Safari often stalls on first load, so kickstart it.
        if (mediaEl.networkState < 2) {
            mediaEl.load();
        }
        self._setVideoData(data);
        self.emit('media.metadata', data);
    }

    function onPlaying() {
        self.emit('media.playing', self.currentItem);
    }

    function onPause() {
        self.emit('media.pause');
    }

    function onProgress(event) {
        // Sort of buggy, with readyState and buffer being inconsistent...
        var percent = null,
            video = event.target,
            ready = video.readyState,
            network = video.networkState,
            buffered = video.buffered,
            total = video.duration;

        // FF4+, Chrome
        if (video.buffered && video.buffered.length > 0 && video.buffered.end && video.duration) {
            percent = video.buffered.end(0) / video.duration;
        }

        // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
        // to be anything other than 0. If the byte count is available we use this instead.
        // Browsers that support the else if do not seem to have the bufferedBytes value and
        // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
        else if (typeof video.bytesTotal !== 'undefined' && video.bytesTotal > 0 && typeof video.bufferedBytes !== 'undefined') {
            percent = video.bufferedBytes / video.bytesTotal;
        }

        if (percent !== null) {
            percent = 100 * Math.min(1, Math.max(0, percent));
        }

        if (video.networkState === 1 && video.readyState === 0) {
            percent = 100;
        }

        self.emit('media.progress', percent);
    }

    function onEnded() {
        if (!self._seeking) {
            self.emit('media.ended', self.currentItem);
        }
    }

    function onCanPlay() {
        self.emit('media.canplay');
        mediaEl.play();
        if (self._seeking) {
            self._seeking = false;
        }
    }

    this._addListener(mediaEl, 'loadedmetadata', onLoadedMetadata);
    this._addListener(mediaEl, 'playing', onPlaying);
    this._addListener(mediaEl, 'pause', onPause);
    this._addListener(mediaEl, 'ended', onEnded);
    this._addListener(mediaEl, 'canplay', onCanPlay);
    this._addListener(mediaEl, 'progress', onProgress, false);
};

DriveIn.prototype._attachImageListeners = function() {
    var self = this,
        mediaEl = this.mediaEl;

    function ended() {
        var event = new Event('ended');
        self.mediaEl.dispatchEvent(event);
    }

    function onPause() {
        self.emit('media.pause');
    }

    function onLoad() {
        self.emit('media.canplay');
        if (self.playlistLength > 1) {
            if (self._slideshowTimer) self._slideshowTimer.destroy();
            self._slideshowTimer = new Timer(ended, self.slideshowItemDuration * 1000);

            self._slideshowTimer.on('pause', onPause);
        }

        self._setImageData(this);
        self.emit('media.metadata', this);
        self.emit('media.playing', self.currentItem);
    }

    function onEnded() {
        self.emit('media.ended', self.currentItem);
    }

    this._addListener(mediaEl, 'load', onLoad);
    this._addListener(mediaEl, 'ended', onEnded);
};

DriveIn.prototype._attachListeners = function() {
    var self = this,
        mediaEl = this.mediaEl;

    function onResize() {
        window.requestAnimationFrame(function () {
            if (self.metadataLoaded) {
                self._updateSize(mediaEl, self.currMediaType, self.mediaAspect);
            }
        });
    }

    this._addListener(window, 'resize', onResize);

    if (this.currMediaType === 'video') {
        this._attachVideoListeners();
    } else {
        this._attachImageListeners();
    }

    this.on('media.ended', function () {
        if (self.playlistLength > 1 && self.loop) {
            var itemNum = 0;
            if (self.currentItem + 1 < self.playlistLength) {
                itemNum = self.currentItem + 1;
            }
            self.play(itemNum);
        }
    });

    this.on('media.canplay', function () {
        mediaEl.style.opacity = 1;
        self.canplay = true;
    });

    this.on('media.metadata', function () {
        self.metadataLoaded = true;
    });

    this.on('media.loading', function () {
        self.canplay = false;
        self.metadataLoaded = false;
    });
};

DriveIn.prototype._setParent = function(el) {
    this.parentEl = el;

    setStyles(this.parentEl, {
        position: 'absolute',
        display: 'block',
        transform: 'translate3d(-50%,-50%,0)',
        '-webkit-transform': 'translate3d(-50%,-50%,0)',
        left: '50%',
        top: '50%'
    });

    return this.parentEl;
};

DriveIn.prototype._cleanup = function() {
    var el = this.parentEl;
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
};

DriveIn.prototype._createMediaEl = function() {
    var mediaEl,
        mediaType;

    if (this.mediaEl) this._cleanup();

    if (this.slideshow) {
        mediaType = 'image';
        mediaEl = createEl('img');
    } else {
        mediaType = 'video';
        mediaEl = createEl('video', {
            height: 1,
            width: 1,
            preload: 'metadata'
        });
    }

    mediaEl.style.opacity = 0;

    this.mediaEl = mediaEl;
    this.currMediaType = mediaType;

    setStyles(this.mediaEl, {
        display: 'block'
    });

    this.parentEl.appendChild(mediaEl);
};

DriveIn.prototype.init = function(options) {
    options = options || {};

    if ('ontouchstart' in window || options.slideshow) {
        this.slideshow = true;
    }

    this._setParent(options.el);
    this._createMediaEl();
    this._attachListeners();
};

DriveIn.prototype.show = function(rawItem, options) {
    if (rawItem.constructor === Array) {
        return this.showPlaylist([rawItem], options);
    }

    if (rawItem.constructor === Object) {
        return this.showPlaylist([
            [rawItem]
        ], options);
    }

    return this.showPlaylist([Playlist.makePlaylistItem(rawItem)], options);
};

DriveIn.prototype.showPlaylist = function(rawPlaylist, options) {
    options = options || {};

    if (options.hasOwnProperty('mute')) {
        this.mute = options.mute;
    }
    if (options.hasOwnProperty('loop')) {
        this.loop = options.loop;
    }
    var playlist = Playlist.makePlaylist(rawPlaylist);

    if (options.poster) {
        this.poster = options.poster;
    } else {
        this.poster = findPoster(playlist);
    }

    this._loadPlaylist(playlist);
};

DriveIn.prototype.setVolume = function(level) {
    if (this.currMediaType === 'image') {
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
};

DriveIn.prototype.getMedia = function() {
    return this.mediaEl;
};

DriveIn.prototype.getPlaylist = function() {
    return this.playlist;
};

DriveIn.prototype.getItem = function(itemNum) {
    return this.playlist[itemNum];
};

DriveIn.prototype.play = function(itemNum) {
    if (typeof itemNum === 'number') {
        this._playItem(this.playlist[itemNum], itemNum);
    } else {
        if (this.currMediaType === 'video') {
            this.mediaEl.play();
        } else {
            if (this._slideshowTimer) {
                this._slideshowTimer.resume();
            }
        }
    }
};

DriveIn.prototype.pause = function() {
    if (this.currMediaType === 'video') {
        this.mediaEl.pause();
    } else {
        if (this._slideshowTimer) {
            this._slideshowTimer.pause();
        }
    }
};

DriveIn.prototype.close = function() {
    this._removeAllListeners();
    this._cleanup();
    if (this._slideshowTimer) {
        this._slideshowTimer.destroy();
        delete this._slideshowTimer;
    }
};

DriveIn.prototype.currentTime = function() {
    if (this.currMediaType === 'video') {
        return this.mediaEl.currentTime;
    } else {
        return this._slideshowTimer.currentTime();
    }
};

DriveIn.prototype.currentTime = function() {
    if (this.currMediaType === 'video') {
        return this.mediaEl.currentTime;
    } else {
        return this._slideshowTimer.currentTime();
    }
};

DriveIn.prototype.seekTo = function(time) {
    this._seeking = true;
    if (this.currMediaType === 'video') {
        this.mediaEl.currentTime = time;
    } else {
        // Not enabled for image slideshows
    }
};

DriveIn.prototype.duration = function() {
    if (this.currMediaType === 'video') {
        return this.mediaEl.duration;
    } else {
        return this.slideshowItemDuration;
    }
};

module.exports = DriveIn;
