import Playlist from './player/playlist';
import Share from './player/share';
import Visualizer from './player/visualizer';
import { i18n } from '../i18n';

export default class Player {
    options = {
        hideControls: true,
        title: null,
        trackIdParameter: 'p',
        timeCodeParameter: 't',
    };

    element;

    audio;
    canvas;

    playerControl;
    fullscreenControl;

    trackTime;
    trackName;

    playlistElement;

    fileId;

    playlist;
    share;
    visualizer;

    /**
     * Player constructor.
     * @param {HTMLElement} element
     * @param {object} options
     */
    constructor (element, options = {}) {
        this.element = element;
        Object.assign(this.options, options);
    }

    /**
     * Run player app.
     */
    run () {
        this._initFields();
        this._initBindings();
        this._initPlaylist();
        this._initPlayerState();
        this._initShareModal();
    }

    /**
     * Initialize player fields.
     * @private
     */
    _initFields () {
        this.audio = this.element.querySelector('[data-player-audio]');
        this.canvas = this.element.querySelector('[data-player-canvas]');

        this.playerControl = this.element.querySelector('[data-player-control]');
        this.fullscreenControl = this.element.querySelector('[data-player-fullscreen]');

        this.trackTime = this.element.querySelector('[data-player-tracktime]');
        this.trackName = this.element.querySelector('[data-player-trackname]');
    }

    /**
     * Check if screen is touchable and add mousemove event to hide controls.
     * @see https://videojs.com/blog/hiding-and-showing-video-player-controls
     * @private
     */
    _initControlsHiding () {
        if (!this.options.hideControls) return;

        const hidings = this.element.querySelectorAll('.hiding');
        let userActive = true;
        let mousemoveTimeout;

        ['mousemove', 'click'].forEach((eventName) => {
            document.addEventListener(eventName, () => {
                userActive = true;
            });
        });

        setInterval(() => {
            if (!userActive) return;

            userActive = false;

            mousemoveTimeout && clearTimeout(mousemoveTimeout);

            document.body.style['cursor'] = '';
            hidings.forEach((hiding) => hiding.classList.remove('hide'));

            mousemoveTimeout = setTimeout(() => {
                if (!this.playlist.isOpened()
                    && !this.share.isOpened()
                    && !this.audio.paused
                    && !document.querySelector('.hiding:hover, .hiding:focus, .hiding:focus-within')
                ) {
                    document.body.style['cursor'] = 'none';
                    hidings.forEach((hiding) => hiding.classList.add('hide'));
                }
            }, 3000);
        }, 100);
    }

    /**
     * Init player event listeners.
     * @private
     */
    _initBindings () {
        document.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        document.addEventListener('drop', (event) => {
            event.preventDefault();

            const file = event.dataTransfer.files[0];
            const ext = file.name.split('.').pop().toLowerCase();

            if (ext === 'mp3') {
                this._initAudio(file.name.replace(/\.[^/.]+$/, ''), URL.createObjectURL(file));

                this.audio.play();
            }

            if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                this._setBackground(URL.createObjectURL(file));
            }
        });

        this.audio.addEventListener('timeupdate', () => {
            const currentTime = this.audio.currentTime;

            this._updateTrackName(this.fileId, currentTime);
            this._updateTime(currentTime);
        });

        this.audio.addEventListener('play', () => {
            if (!this.visualizer) {
                this._initVisualizer();
            }
            this.visualizer.start();

            this.playerControl.classList.remove('pause', 'active');
            this.playerControl.classList.add('play');
            this.playerControl.setAttribute('title', i18n.t('Pause (Space)'));
        });

        this.audio.addEventListener('pause', () => {
            this.visualizer.stop();

            this.playerControl.classList.remove('play');
            this.playerControl.classList.add('pause', 'active');
            this.playerControl.setAttribute('title', i18n.t('Play (Space)'));
        });

        this.playerControl.addEventListener('click', () => {
            if (!this.audio.paused) {
                this.audio.pause();
            } else {
                this.audio.play();
            }
        });

        this.fullscreenControl.addEventListener('click', () => this._toggleFullscreen());

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                this.fullscreenControl.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (event) => {
            this._handlePlayerControls(event);

            if (!document.querySelector('*:focus') && this.fileId) {
                this._handleAudioControls(event);
            }
        });
    }

    /**
     * Init player visualizer.
     * @private
     */
    _initVisualizer () {
        this.visualizer = new Visualizer(this.audio, this.canvas);
        this.playerControl.style['display'] = 'block';

        this._initControlsHiding();
    }

    /**
     * Init player state.
     * @private
     */
    _initPlayerState () {
        const params = new URLSearchParams(window.location.search);
        const id = params.get(this.options.trackIdParameter);

        if (!id) return;

        this.playlistElement.addEventListener('loaded', () => {
            const data = this.playlist.getData(id);

            if (data) {
                this._initAudio(id);
                this.playerControl.style['display'] = 'block';

                this.playlist.setActive(id);

                const time = params.get(this.options.timeCodeParameter);

                if (time) {
                    this.audio.currentTime = time;
                }
            }
        });
    }

    /**
     * Init player playlist.
     * @private
     */
    _initPlaylist () {
        this.playlistElement = this.element.querySelector('[data-playlist]');

        this.playlist = new Playlist(this.playlistElement);

        this.playlistElement.addEventListener('select', (event) => {
            this._initAudio(event.detail.trackId);
            this.audio.play();
        });

        this.playlistElement.addEventListener('reset', () => this._resetAudio());
    }

    /**
     * Init player share modal.
     * @private
     */
    _initShareModal () {
        const shareElement = this.element.querySelector('[data-share]');

        this.share = new Share(shareElement, this.audio, this.options.timeCodeParameter);
    }

    /**
     * Initialize playing file.
     * @param {string} fileId
     * @param {string} src
     * @private
     */
    _initAudio (fileId, src = '') {
        const data = this.playlist.getData(fileId);

        this.fileId = fileId;
        this.audio.setAttribute('src', src || data.src);

        if (data) {
            history.replaceState(null, '', data.href);

            this.share.setUrl(window.location.origin + data.href);
            this.share.showButton();

            this._updateTrackName(data.title, -1);

            this._setBackground(data.background);
        } else {
            history.replaceState(null, '', '/');

            this.playlist.clearActive();
            this.share.hideButton();

            this._updateTrackName(fileId, -1);

            this._setBackground();
        }
    }

    /**
     * Reset player state.
     * @private
     */
    _resetAudio () {
        this.audio.pause();

        this.fileId = null;
        this.audio.setAttribute('src', '');

        this._setBackground();

        history.replaceState(null, '', '/');
        this.playlist.clearActive();
        this.share.hideButton();
    }

    /**
     * Set player background image.
     * @param {string} src
     * @private
     */
    _setBackground (src = '') {
        this.element.style['background-image'] = src ? `url(${src})` : null;
    }

    /**
     * Update audio track name.
     * Playlist is used according to the timeCode if possible.
     * @param {string} trackName
     * @param {number} timeCode
     * @private
     */
    _updateTrackName (trackName, timeCode) {
        const data = this.playlist.getData(trackName);

        if (data) {
            Object.entries(data.playlist).forEach(([code, name]) => {
                if (code > timeCode) {
                    return false;
                }

                trackName = name;
            });
        }

        if (trackName !== this.trackName.innerText) {
            const oldTrackName = this.trackName;

            this.trackName = this.trackName.cloneNode();
            this.trackName.innerText = trackName || i18n.t(`Select audio from playlist or drag'n'drop a file here`);
            document.title = trackName ? (trackName + (this.options.title ? ' | ' + this.options.title : '')) : this.options.title;

            oldTrackName.parentElement.prepend(this.trackName);
            oldTrackName.classList.add('out');

            setTimeout(() => oldTrackName.remove(), 300); // 300ms for fade animation to complete
        }
    }

    /**
     * Format and update elapsed time.
     * @param {number} timeCode
     * @private
     */
    _updateTime (timeCode) {
        const hours   = ('00' + Math.floor(timeCode / 3600)).slice(-2);
        const minutes = ('00' + Math.floor(timeCode % 3600 / 60)).slice(-2);
        const seconds = ('00' + Math.floor(timeCode % 60)).slice(-2);

        this.trackTime.innerText = `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Handle player control buttons.
     * @param {Object} event
     * @private
     */
    _handlePlayerControls (event) {
        switch (event.key) {
            case 'f':
            case 'а':
                this._toggleFullscreen();
                break;
        }
    }

    /**
     * Handle player audio control buttons.
     * @param {Object} event
     * @private
     */
    _handleAudioControls (event) {
        switch (event.key) {
            case ' ':
                if (!this.audio.paused) {
                    this.audio.pause();
                } else {
                    this.audio.play();
                }
                break;
            case 'ArrowLeft':
                this.audio.currentTime = Math.max(this.audio.currentTime - 10, 0);
                break;
            case 'ArrowRight':
                this.audio.currentTime = Math.min(this.audio.currentTime + 10, Math.floor(this.audio.duration));
                break;
            case '0':
                this.audio.currentTime = 0;
                break;
            case 'ArrowUp':
                this.audio.volume = Math.min(this.audio.volume + 0.1, 1);
                break;
            case 'ArrowDown':
                this.audio.volume = Math.max(this.audio.volume - 0.1, 0);
                break;
            case 'm':
            case 'ь':
                this.audio.muted = !this.audio.muted;
                break;
        }
    }

    /**
     * Set or reset fullscreen mode.
     * @private
     */
    _toggleFullscreen () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.fullscreenControl.classList.add('active');

                document.activeElement && document.activeElement.blur();
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                this.fullscreenControl.classList.remove('active');

                document.activeElement && document.activeElement.blur();
            });
        }
    }
}
