/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './styles/app.scss';

// start the Player application
import Player from './components/player';
import { LocaleSwitcher } from './components/locale-switcher';

const player = document.getElementById('player');
const options = player.dataset.options ? JSON.parse(player.dataset.options) : {};

const app = new Player(player, options);

const switcherElement = document.getElementById('locale-switcher');
const switcher = new LocaleSwitcher(switcherElement);

app.run();
switcher.run();
