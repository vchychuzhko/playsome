import Playlist from './player/playlist';
import Visualizer from './player/visualizer';

const RUNNING_STATE = 'running';
const PAUSED_STATE  = 'paused';
const STOPPED_STATE = 'stopped';

export default class Player {
    options = {
        hideControls: true,
        title: null,
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
    mousemoveTimeout;
    state;
    stopInterval;

    playlist;
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
     * @private
     */
    _initControlsHiding () {
        if (this.options.hideControls
            && !(('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
        ) {
            const hidings = this.element.querySelectorAll('.hiding');

            document.addEventListener('mousemove', () => {
                clearTimeout(this.mousemoveTimeout);

                document.body.style['cursor'] = '';
                hidings.forEach((hiding) => hiding.classList.remove('hide'));

                this.mousemoveTimeout = setTimeout(() => {
                    if (!this.playlist.isOpened()
                        && !this.element.querySelector('.hiding:hover, .hiding:focus, .hiding:focus-within')
                    ) {
                        document.body.style['cursor'] = 'none';
                        hidings.forEach((hiding) => hiding.classList.add('hide'))
                    }
                }, 2000);
            });
        }
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
            this.playerControl.setAttribute('title', 'Pause (Space)'); // @TODO: JS translation
        });

        this.audio.addEventListener('pause', () => {
            this.stopVisualization();

            this.playerControl.classList.remove('play');
            this.playerControl.classList.add('pause', 'active');
            this.playerControl.setAttribute('title', 'Play (Space)'); // @TODO: JS translation
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
        this.playlistElement.addEventListener('loaded', () => {
            if (window.location.hash) {
                const matches = window.location.hash.match(/#(.*?)(?:\?|$)(?:.*?t=(\d+)(?:&|$))?/);

                if (matches[1] && this.playlist.getData(matches[1])) {
                    const data = this.playlist.getData(matches[1]);

                    this._initFile(matches[1], data.src, data);
                    this._updateTrackName(data.title, -1);
                    this.playerControl.style['display'] = 'block';

                    if (matches[2]) {
                        this.audio.currentTime = matches[2];
                    }
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

            this._initFile(fileId, data.src, data);
            this.audio.play();

            history.replaceState('', document.title, window.location.pathname + window.location.search + `#${fileId}`);
        });
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

        let background = data.background || this.playlist.getData(fileId, 'background');
        this.element.style['background-image'] = background ? `url(${background})` : '';

        if (this.playlist.getData(fileId)) {
            this.playlist.setActive(fileId);
        } else {
            history.replaceState('', document.title, window.location.pathname + window.location.search);
            this.playlist.clearActive();
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
            let oldTrackName = this.trackname;

            this.trackname = this.trackname.cloneNode();
            this.trackname.innerText = trackName;
            document.title = trackName + (this.options.title ? ' | ' + this.options.title : '');

            oldTrackName.parentElement.prepend(this.trackname);
            this.trackname.classList.add('in');
            oldTrackName.classList.add('out');

            setTimeout(() => {
                oldTrackName.remove();
                this.trackname.classList.remove('in');
            }, 300);
        }
    }

    /**
     * Format and update elapsed time.
     * @param {number} timeCode
     * @private
     */
    _updateTime (timeCode) {
        let hours   = ('00' + Math.floor(timeCode / 3600)).substr(-2);
        let minutes = ('00' + Math.floor(timeCode % 3600 / 60)).substr(-2);
        let seconds = ('00' + Math.floor(timeCode % 60)).substr(-2);

        this.tracktime.innerText = `${hours}:${minutes}:${seconds}`;
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
        let size = this.canvas.offsetWidth;

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
            document.documentElement.requestFullscreen();
            this.fullscreenControl.classList.add('active');
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
            this.fullscreenControl.classList.remove('active');
        }
    }
};
