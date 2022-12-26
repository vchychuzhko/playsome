import Playlist from './player/playlist';
import Share from './player/share';
import Visualizer from './player/visualizer';
import { i18n } from '../i18n';

const RUNNING_STATE = 'running';
const PAUSED_STATE  = 'paused';
const STOPPED_STATE = 'stopped';

export default class Player {
    options = {
        hideControls: true,
        title: null,
        queryParameter: 'p',
    };

    element;

    audio;
    canvas;

    playerControl;
    fullscreenControl;

    tracktime;
    trackname;

    playlistElement;

    fileId;
    state;
    stopInterval;

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
        this.updateCanvasSize();
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

        this.tracktime = this.element.querySelector('[data-player-tracktime]');
        this.trackname = this.element.querySelector('[data-player-trackname]');
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
                if (!this.playlist.isOpened() && !this.share.isOpened()
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
        window.addEventListener('resize', () => this.updateCanvasSize());

        document.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        document.addEventListener('drop', (event) => {
            event.preventDefault();

            const file = event.dataTransfer.files[0];

            this._initFile(file.name.replace(/\.[^/.]+$/, ''), URL.createObjectURL(file));

            this.audio.play();
        });

        this.audio.addEventListener('timeupdate', () => {
            const currentTime = this.audio.currentTime;

            this._updateTrackName(this.fileId, currentTime);
            this._updateTime(currentTime);
        });

        this.audio.addEventListener('play', () => {
            this.startVisualization();

            this.playerControl.classList.remove('pause', 'active');
            this.playerControl.classList.add('play');
            this.playerControl.setAttribute('title', i18n.t('Pause (Space)'));
        });

        this.audio.addEventListener('pause', () => {
            this.stopVisualization();

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
     * Init player state.
     * @private
     */
    _initPlayerState () {
        const params = new URLSearchParams(window.location.search);
        const id = params.get(this.options.queryParameter);

        if (!id) return;

        this.playlistElement.addEventListener('loaded', () => {
            const data = this.playlist.getData(id);

            if (data) {
                this._initFile(id, data.src, data);
                this._updateTrackName(data.title, -1);
                this.playerControl.style['display'] = 'block';

                const time = params.get(this.share.options.queryParameter);

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

        this.playlistElement.addEventListener('change', (event) => {
            const fileId = event.detail.trackId;
            const data = event.detail.data;
            const href = event.detail.href;

            this._initFile(fileId, data.src, data);
            this.audio.play();

            history.replaceState(null, '', href);
        });
    }

    /**
     * Init player share modal.
     * @private
     */
    _initShareModal () {
        const shareElement = this.element.querySelector('[data-share]');

        this.share = new Share(shareElement);
    }

    /**
     * Initialize playing file.
     * @param {string} fileId
     * @param {string} src
     * @param {Object} data
     * @private
     */
    _initFile (fileId, src, data = {}) {
        this.fileId = fileId;
        this.audio.setAttribute('src', src);

        const background = data.background || this.playlist.getData(fileId, 'background');
        this.element.style['background-image'] = background ? `url(${background})` : '';

        if (this.playlist.getData(fileId)) {
            this.playlist.setActive(fileId);
            this.share.setUrl(window.location.origin + this.playlist.getData(fileId, 'link'));
            this.share.show();
        } else {
            history.replaceState(null, '', window.location.pathname + window.location.search);
            this.playlist.clearActive();
            this.share.hide();
        }
    }

    /**
     * Update audio track name.
     * Playlist is used according to the timeCode if possible.
     * @param {string} trackName
     * @param {number} timeCode
     * @private
     */
    _updateTrackName (trackName, timeCode) {
        if (this.playlist.getData(trackName)) {
            Object.entries(this.playlist.getData(trackName).playlist).forEach(([code, name]) => {
                if (code > timeCode) {
                    return false;
                }

                trackName = name;
            });
        }

        if (trackName !== this.trackname.innerText) {
            const oldTrackName = this.trackname;

            this.trackname = this.trackname.cloneNode();
            this.trackname.innerText = trackName;
            document.title = trackName + (this.options.title ? ' | ' + this.options.title : '');

            oldTrackName.parentElement.prepend(this.trackname);
            oldTrackName.classList.add('out');

            setTimeout(() => oldTrackName.remove(), 300);
        }
    }

    /**
     * Format and update elapsed time.
     * @param {number} timeCode
     * @private
     */
    _updateTime (timeCode) {
        const hours   = ('00' + Math.floor(timeCode / 3600)).substr(-2);
        const minutes = ('00' + Math.floor(timeCode % 3600 / 60)).substr(-2);
        const seconds = ('00' + Math.floor(timeCode % 60)).substr(-2);

        this.tracktime.innerText = `${hours}:${minutes}:${seconds}`;

        this.share.setTimeCode(Math.floor(timeCode));
    }

    /**
     * Start/resume audio visualization.
     * Init visualizer if was not yet.
     */
    startVisualization () {
        if (this.state !== RUNNING_STATE) {
            if (!this.visualizer) {
                this.visualizer = new Visualizer(this.audio, this.canvas);
                this.playerControl.style['display'] = 'block';

                this._initControlsHiding();
            }

            this.state = RUNNING_STATE;
            this._run();
        }
    }

    /**
     * Call render and request next frame.
     * @private
     */
    _run () {
        this.visualizer.render();

        if (this.state !== STOPPED_STATE) {
            clearInterval(this.stopInterval);
            requestAnimationFrame(() => this._run());
        }
    }

    /**
     * Stop/Pause audio visualization.
     */
    stopVisualization () {
        this.state = PAUSED_STATE;

        this.stopInterval = setTimeout(() => {
            // Timeout is needed to have "fade" effect on canvas
            // Extra state is needed to solve goTo issue for audio element
            if (this.state === PAUSED_STATE) {
                this.state = STOPPED_STATE;
            }
        }, 1000);
    }

    /**
     * Update canvas size attributes.
     */
    updateCanvasSize () {
        const size = this.canvas.offsetWidth;

        this.canvas.height = size;
        this.canvas.width = size;
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
