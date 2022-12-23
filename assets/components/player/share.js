import { pushNotification } from '../ui/notification';
import { i18n } from '../../i18n';

export default class Share {
    options = {
        queryParameter: 't',
    };

    element;

    openButton;
    modal;
    closeButton;

    urlInput;
    shareButton;

    timeBar;
    timeCode;
    timeLabel;

    focusable = {};
    lastFocused;

    url = '';
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

        this.modal.removeAttribute('hidden');

        /** context binding for callbacks */
        this._lockFocus = this._lockFocus.bind(this);
    }

    /**
     * Initialize share modal fields.
     * @private
     */
    _initFields () {
        this.openButton = this.element.querySelector('[data-share-open]');
        this.modal = this.element.querySelector('[data-share-modal]');
        this.closeButton = this.element.querySelector('[data-share-close]');

        this.timeBar = this.element.querySelector('[data-share-timebar]');
        this.timeCode = this.element.querySelector('[data-share-timecode]');
        this.timeLabel = this.element.querySelector('[data-share-timelabel]');

        this.urlInput = this.element.querySelector('[data-share-url]');
        this.shareButton = this.element.querySelector('[data-share-control]');

        if (!('share' in navigator) && !('clipboard' in navigator)) {
            this.shareButton.remove();
        }

        this.focusable = {
            first: this.shareButton,
            last: this.closeButton,
        };
    }

    /**
     * Initialize share modal listeners.
     * @private
     */
    _initBindings () {
        this.openButton.addEventListener('click', () => this.open());

        this.modal.addEventListener('click', (event) => {
            if (event.target === event.currentTarget) {
                this.close();
            }
        });

        this.closeButton.addEventListener('click', () => this.close());

        document.addEventListener('keyup', (event) => this._handleShareControls(event));

        this.timeCode.addEventListener('change', () => {
            this.urlInput.value = this.timeCode.checked
                ? this.url + `&${this.options.queryParameter}=${this.timeCodeValue}`
                : this.url;
        });

        this.shareButton && this.shareButton.addEventListener('click', () => this._share());
    }

    /**
     * Set share url.
     * @param {string} url
     */
    setUrl (url) {
        this.url = url;
    }

    /**
     * Set share timeCode.
     * @param {number} timeCode
     */
    setTimeCode (timeCode) {
        this.timeCodeValue = timeCode;
    }

    /**
     * Show share open button.
     */
    show () {
        this.openButton.style['display'] = 'block';
    }

    /**
     * Hide share open button.
     */
    hide () {
        this.openButton.style['display'] = 'none';
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

        this.urlInput.value = this.url;
        this.timeCode.checked = false;

        if (this.timeCodeValue) {
            this.timeLabel.innerText = this._getTimeFormatted(this.timeCodeValue);

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

        this.lastFocused && this.lastFocused.focus();
    }

    /**
     * Share or copy url to clipboard.
     * @private
     */
    _share () {
        if ('share' in navigator) {
            navigator.share({
                title: 'PlaySome',
                text: i18n.t('Share this song'),
                url: this.urlInput.value,
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Caller does not have permission to share data');
                }

                pushNotification({
                    message: [i18n.t('Failed to share'), i18n.t('Please, try to copy it manually')],
                    type: 'error',
                });
            });
        } else if ('clipboard' in navigator) {
            navigator.clipboard.writeText(this.urlInput.value).then(() => {
                pushNotification({ message: i18n.t('Copied to the clipboard') });
            }, () => {
                console.error('Caller does not have permission to write to the clipboard');

                pushNotification({
                    message: [i18n.t('Failed to copy'), i18n.t('Please, try to do it manually')],
                    type: 'error',
                });
            });
        }
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
