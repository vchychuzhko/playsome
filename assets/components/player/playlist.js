/**
 * Check if element is inside button, audio control or modal.
 * @param {HTMLElement|ParentNode} node
 * @returns {boolean}
 */
function isInsideControl (node) {
    const parent = node.parentNode;

    if (parent.tagName === 'BODY') return false;

    if (parent.classList.contains('control') || parent.classList.contains('modal')) return true;

    return isInsideControl(parent);
}

export default class Playlist {
    options = {
        defaultThumbnail: null,
    };

    playlist = {};

    element;

    control;
    list;
    resetLink;

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

        this.list.removeAttribute('hidden');

        this._loadPlaylist();
    }

    /**
     * Initialize playlist fields.
     * @private
     */
    _initFields () {
        this.control = this.element.querySelector('[data-playlist-control]');
        this.list = this.element.querySelector('[data-playlist-list]');

        this.resetLink = this.element.querySelector('[data-playlist-reset]');
    }

    /**
     * Initialize playlist listeners.
     * @private
     */
    _initBindings () {
        this.control.addEventListener('click', () => this.toggle());

        document.addEventListener('click', (event) => {
            if (!this.element.contains(event.target) && !isInsideControl(event.target)) {
                this.close();
            }
        });

        document.addEventListener('keyup', (event) => this._handlePlaylistControls(event));

        this.resetLink.addEventListener('click', (event) => {
            event.preventDefault();

            this.clearActive();
            this._reset();
        });
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
        fetch('/list', {
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.length) return;

                let list = '';

                data.forEach((track) => {
                    list = list + `
<li>
  <a
    class="playlist__item"
    href="${track.href}"
    title="${track.title}"
    data-playlist-track="${track.id}"
  >
    <img
      class="playlist__item_thumb"
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

                    this.playlist[track.id] = track;
                });

                this.list.innerHTML = list;

                const tracks = this.element.querySelectorAll('[data-playlist-track]');

                tracks.forEach((track) => track.addEventListener('click', (event) => this._selectTrack(event)));

                const loadedEvent = new Event('loaded');
                this.element.dispatchEvent(loadedEvent);
            });
    }

    /**
     * Callback for emitting an event with selected track.
     * @param {Object} event
     * @private
     */
    _selectTrack (event) {
        event.preventDefault();
        const trackId = event.currentTarget.dataset.playlistTrack;

        this.setActive(trackId);

        const changeEvent = new CustomEvent('select', { detail: { trackId } });
        this.element.dispatchEvent(changeEvent);
    }

    /**
     * Callback for emitting an event with selected track.
     * @param {Object} event
     * @private
     */
    _reset () {
        const changeEvent = new CustomEvent('reset');
        this.element.dispatchEvent(changeEvent);
    }

    /**
     * Set playlist item as active by track id.
     * @param {string} trackId
     */
    setActive (trackId) {
        this.clearActive();
        const track = this.element.querySelector(`[data-playlist-track="${trackId}"]`);

        track.classList.add('active');
        track.setAttribute('aria-current', 'page');

        this.resetLink.classList.remove('disabled');
    }

    /**
     * Reset playlist active items.
     */
    clearActive () {
        const tracks = this.element.querySelectorAll('[data-playlist-track]');

        tracks.forEach((track) => {
            track.classList.remove('active');
            track.removeAttribute('aria-current');
        });

        this.resetLink.classList.add('disabled');
    }

    /**
     * Retrieve track data by id and key.
     * Return all data if key is not specified
     * @param {string} trackId
     * @param {string} key
     * @returns {Object|null}
     */
    getData (trackId, key = '') {
        const data = this.playlist[trackId];

        if (data && key !== '') {
            return data[key] || null;
        }

        return data || null;
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
