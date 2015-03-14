import Jvent from 'jvent';
import Timer from './timer';
import Playlist from './playlist';
import Utils from './utils';

var getWidth = Utils.getWidth,
    getHeight = Utils.getHeight,
    setStyles = Utils.setStyles,
    findPoster = Utils.findPoster,
    createEl = Utils.createEl,
    replaceChildren = Utils.replaceChildren;

class DriveIn extends Jvent {
    constructor() {
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

        this.playlistLength = 0;
        this.currentItem = 0;
        this.slideshowItemDuration = 10;
        this._slideshowTimer = null;
        this._seeking = false;

        this.poster = null;

        this.loading = true;
    }

    _updateSize(mediaEl, mediaType, mediaAspect) {

        var pad = 1;

        var containerW = getWidth(),
            containerH = getHeight(),
            containerAspect = containerW / containerH;

        if (containerAspect < mediaAspect) {

            // taller

            setStyles(this.parentEl, {
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

            setStyles(this.parentEl, {
                width: containerW + 'px',
                height: Math.ceil(containerW / mediaAspect) + 1 + 'px'
            });

            if (mediaType === 'video') {

                setStyles(mediaEl, {
                    width: this.parentEl.offsetWidth + 'px',
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
    }

    _setVideoData() {
        var mediaEl = this.mediaEl;
        this.mediaAspect = mediaEl.videoWidth / mediaEl.videoHeight;
        this._updateSize(mediaEl, 'video', this.mediaAspect);
    }

    _setImageData(data) {
        this.mediaAspect = data.naturalWidth / data.naturalHeight;

        if (!this.isTouch) {
            this._updateSize(this.mediaEl, 'image', this.mediaAspect);
        }
    }

    _playVideoItem(item, itemNum) {
        var mediaEl = this.mediaEl,
            source,
            sourceEl,
            sourceEls = [],
            posterSrc,
            canPlayType;

        for (var i = item.length - 1; i >= 0; i--) {
            source = item[i];

            if (source.type.search(/^image/) === 0 && !posterSrc) {
                posterSrc = source.src;
            } else {
                sourceEl = createEl('source', { src: source.src, type: source.type });
            }

            if (sourceEl) {
                canPlayType = mediaEl.canPlayType(source.type);
                if (canPlayType === 'probably') {
                    sourceEls.unshift(sourceEl);
                } else {
                    sourceEls.push(sourceEl);
                }
            }
        }

        if (sourceEls.length) {

            this.emit('media.loading');

            mediaEl.preload = 'auto';
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
    }

    _playImageItem(item, itemNum) {
        var source,
            src;

        if (item && item.length) {
            for (var i in item) {
                source = item[i];
                if (source.type.search(/^image/) === 0 && !src) {
                    src = source.src;
                }
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
    }

    _setBackgroundItem() {
        this.parentEl.style['background-image'] = 'url("' + this.poster.src + '")';
    }

    _playItem(item, itemNum) {
        if (this.isTouch) {
            this._setBackgroundItem();

            // This should default to load the poster, which provides
            // the necessary events
            this._playImageItem();
            return;
        }

        if (this.currMediaType === 'video') {
            this._playVideoItem(item, itemNum);
        }

        if (this.currMediaType === 'image') {
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

        this._listeners.push({
            element: element,
            event: event,
            handler: handler
        });
    }

    _removeAllListeners() {
        var listeners = this._listeners,
            listen;

        for (var i in listeners) {
            listen = listeners[i];
            listen.element.removeEventListener(listen.event, listen.handler);
        }
    }

    _attachVideoListeners() {
        var self = this,
            mediaEl = this.mediaEl;

        function onLoadedMetadata(data) {
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
                video = event.target;

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
    }

    _attachImageListeners() {
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

            self._setImageData(this);
            self.emit('media.metadata', this);
            self.emit('media.playing', self.currentItem);

            if (self.isTouch) {
                return;
            }

            if (self.playlistLength > 1) {
                if (self._slideshowTimer) {
                    self._slideshowTimer.destroy();
                }
                self._slideshowTimer = new Timer(ended, self.slideshowItemDuration * 1000);

                self._slideshowTimer.on('pause', onPause);
            }
        }

        function onEnded() {
            self.emit('media.ended', self.currentItem);
        }

        this._addListener(mediaEl, 'load', onLoad);
        this._addListener(mediaEl, 'ended', onEnded);
    }

    _attachListeners() {
        var self = this,
            mediaEl = this.mediaEl;

        if (this.isTouch) {
            this._attachImageListeners();
            return;
        }

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

        function onMediaEnded() {
            if (this._seeking) {
                return;
            }

            var itemNum = 0;

            if (self.playlistLength > 1 && self.loopPlaylistItems) {
                if( self.currMediaType === 'image') {
                    // Images need a reboot, video is handled via `loop`
                    self.play(self.currentItem);
                }
                return;
            }

            if (self.playlistLength > 1 && self.loop) {
                if (self.currentItem + 1 < self.playlistLength) {
                    itemNum = self.currentItem + 1;
                }
                self.play(itemNum);
            }
        }

        function onMediaCanplay() {
            mediaEl.style.opacity = 1;
            self.canplay = true;
        }

        function onMediaMetadata() {
            self.metadataLoaded = true;
        }

        function onMediaLoading() {
            self.canplay = false;
            self.metadataLoaded = false;
        }

        this.on('media.ended', onMediaEnded);
        this.on('media.canplay', onMediaCanplay);
        this.on('media.metadata', onMediaMetadata);
        this.on('media.loading', onMediaLoading);
    }

    _setParent(el) {

        if (this.isTouch) {

            setStyles(el, {
                width: '100%',
                height: '100%',
                display: 'block',
                'background-position': '50% 50%',
                'background-repeat': 'no-repeat no-repeat',
                'background-attachment': 'local',
                'background-size': 'cover'
            });

        } else {

            setStyles(el, {
                position: 'absolute',
                display: 'block',
                transform: 'translate3d(-50%,-50%,0)',
                '-webkit-transform': 'translate3d(-50%,-50%,0)',
                left: '50%',
                top: '50%'
            });
        }

        return el;
    }

    _cleanup() {
        var el = this.parentEl;
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    _createMediaEl() {
        var mediaEl;

        if (this.mediaEl) {
            this._cleanup();
        }

        if (this.isTouch) {

            this.currMediaType = 'image';
            mediaEl = createEl('img');
            setStyles(mediaEl, { display: 'none' });
            return mediaEl;

        } else if (this.slideshow) {

            this.currMediaType = 'image';
            mediaEl = createEl('img');

        } else {

            this.currMediaType = 'video';
            mediaEl = createEl('video', {
                height: 1,
                width: 1,
                preload: 'metadata'
            });
        }

        if (mediaEl) {

            mediaEl.style.opacity = 0;
            setStyles(mediaEl, {
                display: 'block'
            });

            return mediaEl;
        }
    }

    _prepareContainer() {
        var containerH = getHeight();

        if (document.body.offsetHeight < containerH) {
            setStyles(document.body, {
                height: 'auto'
            });

            if (containerH > document.body.offsetHeight) {
                setStyles(document.body, {
                    height: '100%'
                });
                setStyles(document.documentElement, {
                    height: '100%'
                });
            }
        }
    }

    init(options) {
        options = options || {};

        if ('ontouchstart' in window || options.slideshow) {
            this.isTouch = true;
        }

        this._prepareContainer();

        this.parentEl = this._setParent(options.el);
        var mediaEl = this._createMediaEl();
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

        if (options.hasOwnProperty('mute')) {
            this.mute = options.mute;
        }

        if (options.hasOwnProperty('loop')) {
            this.loop = options.loop;
        }

        if (options.hasOwnProperty('loopPlaylistItems')) {
            this.loopPlaylistItems = options.loopPlaylistItems;
            if (this.loopPlaylistItems) {
                this.loop = false;
            }
        }

        var playlist = Playlist.makePlaylist(rawPlaylist);

        if (options.poster) {
            this.poster = options.poster;
        } else {
            this.poster = findPoster(playlist);
        }

        this._loadPlaylist(playlist);
    }

    setVolume(level) {
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
    }

    setPlaybackRate(rate) {
        if (this.currMediaType === 'image') {
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
    }

    pause() {
        if (this.currMediaType === 'video') {
            this.mediaEl.pause();
        } else {
            if (this._slideshowTimer) {
                this._slideshowTimer.pause();
            }
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
        if (this.currMediaType === 'video') {
            return this.mediaEl.currentTime;
        } else {
            return this._slideshowTimer.currentTime();
        }
    }

    seekTo(time) {
        this._seeking = true;
        if (this.currMediaType === 'video') {
            this.mediaEl.currentTime = time;
        }
    }

    duration() {
        if (this.currMediaType === 'video') {
            return this.mediaEl.duration;
        } else {
            return this.slideshowItemDuration;
        }
    }
}

export default DriveIn;
