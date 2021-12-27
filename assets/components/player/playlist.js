export default class Playlist {
    options = {
        defaultThumbnail: null,
    };

    playlist = [];

    element;

    control;
    list;

    /**
     * Player playlist constructor.
     * @param {HTMLElement} element
     */
    constructor (element) {
        this.element = element;

        const options = this.element.dataset.options ? JSON.parse(this.element.dataset.options) : {};
        Object.assign(this.options, options);

        this._initFields();
        this._initBindings();

        this._loadPlaylist();
    }

    /**
     * Initialize playlist fields.
     * @private
     */
    _initFields () {
        this.control = this.element.querySelector('[data-playlist-control]');
        this.list = this.element.querySelector('[data-playlist-list]');
    }

    /**
     * Initialize playlist listeners.
     * @private
     */
    _initBindings () {
        this.control.addEventListener('click', () => this.toggle());

        document.addEventListener('click', (event) => {
            if (!this.element.contains(event.target)) {
                this.close();
            }
        });

        document.addEventListener('keyup', (event) => this._handlePlaylistControls(event));
    }

    /**
     * Open/Close playlist menu according to its state.
     */
    toggle () {
        if (this.isOpened()) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Check current playlist state.
     * @returns {boolean}
     */
    isOpened () {
        return this.element.classList.contains('opened');
    }

    /**
     * Open playlist menu.
     */
    open () {
        this.element.classList.add('opened');
        this.control.classList.add('active');
    }

    /**
     * Close playlist menu.
     */
    close () {
        this.element.classList.remove('opened');
        this.control.classList.remove('active');
    }

    /**
     * Load and render tracks list.
     * Binding click event to them.
     */
    _loadPlaylist () {
        fetch('/playlist', {
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                this.playlist = data;

                if (this.playlist.length) {
                    let list = '';

                    this.playlist.forEach((track) => {
                        list = list + `
<li>
  <a class="playlist__item"
     href="#${track.id}"
     title="${track.title}"
     data-playlist-track="${track.id}"
  >
    <img class="playlist__item_thumb"
         src="${track.thumbnail || this.options.defaultThumbnail}"
         alt="${track.title} Logo"
    >
    <div class="playlist__item_meta">
      <h4 class="playlist__item_title">${track.title}</h4>
      <span class="playlist__item_artist">${track.artist}</span>
    </div>
    <div class="playlist__item_duration">${track.duration}</div>
  </a>
</li>
                        `;
                    });

                    this.list.innerHTML = list;

                    const tracks = this.element.querySelectorAll('[data-playlist-track]');

                    tracks.forEach((track) => track.addEventListener('click', (event) => {
                        event.preventDefault();
                        const trackId = event.currentTarget.dataset.playlistTrack;

                        const changeEvent = new CustomEvent('change', { detail: { trackId, data: this.getData(trackId) } });
                        this.element.dispatchEvent(changeEvent);
                    }));

                    const loadedEvent = new Event('loaded');
                    this.element.dispatchEvent(loadedEvent);
                }
            });
    }

    /**
     * Set playlist item as active by track id.
     * @param {string} trackId
     */
    setActive (trackId) {
        this.clearActive();
        const track = this.element.querySelector(`[data-playlist-track="${trackId}"]`);

        track.classList.add('active');
    }

    /**
     * Reset playlist active items.
     */
    clearActive () {
        const tracks = this.element.querySelectorAll('[data-playlist-track]');

        tracks.forEach((track) => track.classList.remove('active'));
    }

    /**
     * Retrieve track data by id and key.
     * Return all data if key is not specified
     * @param {string} trackId
     * @param {string} key
     * @returns {Object|null}
     */
    getData (trackId, key = '') {
        let data = this.playlist.find(({ id }) => id === trackId) || null;

        if (data && key !== '') {
            data = data[key] || null;
        }

        return data;
    }

    /**
     * Handle playlist control buttons.
     * @param {Object} event
     * @private
     */
    _handlePlaylistControls (event) {
        switch (event.key) {
            case 'Escape':
                if (this.isOpened()) {
                    this.close();
                }
                break;
            case 'p':
            case 'з':
                this.toggle();
                break;
        }
    }
}
