import { pushNotification } from '../ui/notification';
import { i18n } from '../../i18n';

export default class Share {
    element;
    audio;
    timeCodeParameter;

    openButton;
    modal;
    closeButton;

    urlField;
    shareButton;

    addTimeCodeBlock;
    addTimeCodeCheckbox;
    addTimeCodeLabel;

    focusable = {};
    lastFocused;

    url = '';
    timeCode = 0;

    /**
     * Player share modal constructor.
     * @param {HTMLElement} element
     * @param {HTMLMediaElement} audio
     * @param {string} timeCodeParameter
     */
    constructor (element, audio, timeCodeParameter = 't') {
        this.element = element;
        this.audio = audio;
        this.timeCodeParameter = timeCodeParameter;

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
        this.openButton = this.element.querySelector('[data-share-open]');
        this.modal = this.element.querySelector('[data-share-modal]');
        this.closeButton = this.element.querySelector('[data-share-close]');

        this.addTimeCodeBlock = this.element.querySelector('[data-share-addtime]');
        this.addTimeCodeCheckbox = this.element.querySelector('[data-share-timecode]');
        this.addTimeCodeLabel = this.element.querySelector('[data-share-timelabel]');

        this.urlField = this.element.querySelector('[data-share-url]');
        this.shareButton = this.element.querySelector('[data-share-control]');

        this.modal.removeAttribute('hidden');

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

        this.addTimeCodeCheckbox.addEventListener('change', () => {
            this.urlField.value = this.addTimeCodeCheckbox.checked
                ? this.url + `&${this.timeCodeParameter}=${this.timeCode}`
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
     * Show share open button.
     */
    showButton () {
        this.openButton.style.display = 'block';
    }

    /**
     * Hide share open button.
     */
    hideButton () {
        this.openButton.style.display = 'none';
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

        this.urlField.value = this.url;
        this.timeCode = Math.floor(this.audio.currentTime);
        this.addTimeCodeCheckbox.checked = false;

        if (this.timeCode) {
            this.addTimeCodeLabel.innerText = this._getTimeFormatted(this.timeCode);

            this.addTimeCodeBlock.style.display = 'inline-flex';
        } else {
            this.addTimeCodeBlock.style.display = 'none';
        }

        document.addEventListener('keydown', this._lockFocus);

        this.lastFocused = document.activeElement;
        setTimeout(() => this.focusable.first.focus(), 300); // 300ms for appear animation to complete
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
                url: this.urlField.value,
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Caller does not have permission to share data');

                    pushNotification({
                        message: [i18n.t('Failed to share'), i18n.t('Please, try to copy it manually')],
                        type: 'error',
                    });
                }
            });
        } else if ('clipboard' in navigator) {
            navigator.clipboard.writeText(this.urlField.value).then(() => {
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
        const minutes = hours ? ('00' + Math.floor(timeCode % 3600 / 60)).slice(-2) : Math.floor(timeCode % 3600 / 60);
        const seconds = ('00' + timeCode % 60).slice(-2);

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
