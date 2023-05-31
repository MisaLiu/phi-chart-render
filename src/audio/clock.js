import unmuteAudio from './unmute';

// Reference: https://github.com/bemusic/bemuse/blob/68e0d5213b56502b3f5812f1d28c8d7075762717/bemuse/src/game/clock.js#L14
export default class Clock
{
    constructor(AudioContext)
    {
        unmuteAudio(AudioContext);

        this.time = 0;

        this._audioCtx = AudioContext;
        this._offsets = [];
        this._sum = 0;

        this.update();
    }

    update()
    {
        const realTime = performance.now() / 1000;
        const delta = realTime - this._audioCtx.currentTime;

        this._offsets.push(delta);
        this._sum += delta;

        while (this._offsets.length > 60)
        {
            this._sum -= this._offsets.shift();
        }

        this.time = realTime - this._sum / this._offsets.length;
    }
}