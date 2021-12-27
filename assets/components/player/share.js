import { pushNotification } from '../ui/notification';

export default class Share {
    options = {
        showMessage: true,
        queryParameter: 't',
    };

    element;

    control;
    modal;
    closeControl;

    url;
    copy;

    timeBar;
    timeCode;
    timeLabel;

    focusable = {};
    lastFocused;

    urlValue = '';
    timeCodeValue = 0;

    /**
     * Player share modal constructor.
     * @param {HTMLElement} element
     */
    constructor (element) {
        this.element = element;

        const options = this.element.dataset.options ? JSON.parse(this.element.dataset.options) : {};
        Object.assign(this.options, options);

        this._initFields();
        this._initBindings();

        /** context binding for callbacks */
        this._lockFocus = this._lockFocus.bind(this);
    }

    /**
     * Initialize share modal fields.
     * @private
     */
    _initFields () {
        this.control = this.element.querySelector('[data-share-control]');
        this.modal = this.element.querySelector('[data-share-modal]');
        this.closeControl = this.element.querySelector('[data-share-close]');

        this.timeBar = this.element.querySelector('[data-share-timebar]');
        this.timeCode = this.element.querySelector('[data-share-timecode]');
        this.timeLabel = this.element.querySelector('[data-share-timelabel]');

        this.url = this.element.querySelector('[data-share-url]');
        this.copy = this.element.querySelector('[data-share-copy]');

        this.focusable = {
            first: this.copy,
            last: this.closeControl,
        };
    }

    /**
     * Initialize share modal listeners.
     * @private
     */
    _initBindings () {
        this.control.addEventListener('click', () => this.open());

        this.modal.addEventListener('click', (event) => {
            if (event.target === event.currentTarget) {
                this.close();
            }
        });

        this.closeControl.addEventListener('click', () => this.close());

        document.addEventListener('keyup', (event) => this._handleShareControls(event));

        this.timeCode.addEventListener('change', () => {
            this.url.value = this.timeCode.checked
                ? this.urlValue + `?${this.options.queryParameter}=${this.timeCode.value}`
                : this.urlValue;
        });

        this.copy.addEventListener('click', () => {
            navigator.clipboard.writeText(this.url.value).then(() => {
                if (this.options.showMessage) {
                    pushNotification({ message: 'Copied to the clipboard' }); // @TODO: JS translation
                }
            }, () => {
                console.error('Caller does not have permission to write to the clipboard');

                if (this.options.showMessage) {
                    pushNotification({ message: 'Clipboard is not available, try to copy manually', type: 'error' }); // @TODO: JS translation
                }
            });
        });
    }

    /**
     * Set share url.
     * @param {string} url
     */
    setUrl (url) {
        this.urlValue = url;
    }

    /**
     * Set share timeCode.
     * @param {number} timeCode
     */
    setTimeCode (timeCode) {
        this.timeCodeValue = timeCode;
    }

    /**
     * Show share control button.
     */
    show () {
        this.control.style['display'] = 'block';
    }

    /**
     * Hide share control button.
     */
    hide () {
        this.control.style['display'] = 'none';
    }

    /**
     * Check current share modal state.
     * @returns {boolean}
     */
    isOpened () {
        return this.modal.classList.contains('opened');
    }

    /**
     * Open share modal.
     */
    open () {
        this.modal.classList.add('opened');

        this.url.value = this.urlValue;
        this.timeCode.checked = false;

        if (this.timeCodeValue) {
            this.timeLabel.innerText = this._getTimeFormatted(this.timeCodeValue);
            this.timeCode.value = this.timeCodeValue;

            this.timeBar.style.display = 'block';
        } else {
            this.timeBar.style.display = 'none';
        }

        document.addEventListener('keydown', this._lockFocus);

        this.lastFocused = document.activeElement;
        setTimeout(() => this.focusable.first.focus(), 300); // 300ms for slide animation to complete
    }

    /**
     * Close share modal.
     */
    close () {
        this.modal.classList.remove('opened');

        document.removeEventListener('keydown', this._lockFocus);
        this.lastFocused.focus();
    }

    /**
     * Format elapsed time.
     * @param {number} timeCode
     * @returns {string}
     * @private
     */
    _getTimeFormatted (timeCode) {
        const hours   = Math.floor(timeCode / 3600);
        const minutes = hours ? ('00' + Math.floor(timeCode % 3600 / 60)).substr(-2) : Math.floor(timeCode % 3600 / 60);
        const seconds = ('00' + timeCode % 60).substr(-2);

        return `${hours ? hours + ':' : ''}${minutes}:${seconds}`;
    }

    /**
     * Lock share modal focus.
     * @param {object} event
     * @returns {string}
     * @private
     */
    _lockFocus (event) {
        if (event.key === 'Tab') {
            if (event.shiftKey) {
                if (document.activeElement === this.focusable.first) {
                    event.preventDefault();
                    this.focusable.last.focus();
                }
            } else {
                if (document.activeElement === this.focusable.last) {
                    event.preventDefault();
                    this.focusable.first.focus();
                }
            }
        }
    }

    /**
     * Handle share control buttons.
     * @param {Object} event
     * @private
     */
    _handleShareControls (event) {
        switch (event.key) {
            case 'Escape':
                if (this.isOpened()) {
                    this.close();
                }
                break;
            case 's':
            case 'і':
            case 'ы':
                if (!this.isOpened()) {
                    this.open();
                }
                break;
        }
    }
}
