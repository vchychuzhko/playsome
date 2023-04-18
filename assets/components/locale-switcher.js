export class LocaleSwitcher {
    element;

    controls;

    /**
     * LocaleSwitcher constructor.
     * @param {HTMLElement} element
     */
    constructor (element) {
        this.element = element;
    }

    /**
     * Run locale switcher.
     */
    run () {
        this._initFields();
        this._initBindings();

        this._initState();
    }

    /**
     * Initialize locale switcher fields.
     * @private
     */
    _initFields () {
        this.controls = this.element.querySelectorAll('[data-locale-switch]');
    }

    /**
     * Init locale switcher event listeners.
     * @private
     */
    _initBindings () {
        this.controls.forEach((control) => {
            control.addEventListener('click', () => {
                const date = new Date((new Date).getTime() + (30 * 86400 * 1000)); // 30 days
                const expires = '; expires=' + date.toUTCString();

                document.cookie = `locale=${control.dataset.localeSwitch}; expires=${expires}; path=/`;

                location.reload();
            });
        });
    }

    /**
     * Init locale switcher state.
     * @private
     */
    _initState () {
        const locale = document.documentElement.lang;

        this.controls.forEach((control) => {
            if (control.dataset.localeSwitch === locale) {
                control.disabled = true;
            }
        });
    }
}
