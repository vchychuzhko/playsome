const LINE_COLOR = '#ffffff';
const LINE_WIDTH = 2;
const NUMBER_OF_PEAKS = 2048;

export default class Visualizer {
    analyzerNode;
    canvas;
    data;

    /**
     * Player audio spectrum constructor.
     * @param {HTMLMediaElement} audio
     * @param {HTMLElement} canvas
     */
    constructor (audio, canvas) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioSource = audioContext.createMediaElementSource(audio);

        this.analyzerNode = audioContext.createAnalyser();
        this.analyzerNode.fftSize = NUMBER_OF_PEAKS;

        audioSource.connect(this.analyzerNode);
        audioSource.connect(audioContext.destination);

        this.data = new Uint8Array(this.analyzerNode.frequencyBinCount);
        this.canvas = canvas;
    }

    /**
     * Request next data frame and draw it.
     */
    render () {
        this.analyzerNode.getByteFrequencyData(this.data);

        this._draw();
    }

    /**
     * Render audio spectrum.
     * @private
     */
    _draw () {
        const context = this.canvas.getContext('2d');
        const height = this.canvas.height;
        const width = this.canvas.width;
        const average = (this.data.reduce((sum, a) => sum + a, 0) / this.analyzerNode.frequencyBinCount) / 255;
        const radius = height / 4 * (average / 2 + 1);

        context.clearRect(0, 0, width, height);

        context.strokeStyle = LINE_COLOR;
        context.lineWidth = LINE_WIDTH;
        context.beginPath();
        context.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
        context.stroke();
        context.closePath();

        this.data.forEach((value, index) => {
            value = value * 2.5 - 255;
            if (value < 0) value = 0;

            value = (value / 255) * (height / 8);

            const currentAngle = 360 * (index / this.analyzerNode.frequencyBinCount);
            const x1 = (width / 2) + radius * Math.cos(this._degreesToRadians(currentAngle - 90));
            const y1 = (height / 2) + radius * Math.sin(this._degreesToRadians(currentAngle - 90));
            const x2 = (width / 2) + (radius + value) * Math.cos(this._degreesToRadians(currentAngle - 90));
            const y2 = (height / 2) + (radius + value) * Math.sin(this._degreesToRadians(currentAngle - 90));

            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
            context.closePath();
        });
    }

    /**
     * Convert degree value to radians.
     * @param {number} degrees
     * @returns {number}
     * @private
     */
    _degreesToRadians (degrees) {
        return (Math.PI / 180) * degrees;
    }
}
