import Clock from './clock';
import { number as verifyNum } from '@/verify';



export default class AudioTimer
{
    constructor(AudioContext, offset = 0, speed = 1)
    {
        this.startTime = NaN;
        this.pausedTime = NaN;
        this.status = 3;

        this._clock = new Clock(AudioContext);
        this._offset = verifyNum(offset) / 1000;
        this._speed = verifyNum(speed);
        this._lastSpeedChangedProgress = 0;
    }

    now()
    {
        return this._clock.time - this._offset;
    }

    start()
    {
        if (this.status === 2) this.startTime = this.now() - (this.pausedTime - this.startTime);
        else this.startTime = this.now();
        
        this.status = 1;
        this.pausedTime = NaN;
    }

    pause()
    {
        if (this.status === 1)
        {
            this.pausedTime = this.now();
            this.status = 2;
        }
        else if (this.status === 2)
        {
            this.startTime = this.now() - (this.pausedTime - this.startTime);
            this.pausedTime = NaN;
            this.status = 1;
        }
    }

    stop()
    {
        if (this.status === 3) return;

        this.startTime = NaN;
        this.pausedTime = NaN;
        this._lastSpeedChangedProgress = 0;

        this.status = 3;
    }

    seek(duration)
    {
        if (this.status === 3) return;
        this.startTime -= duration;
        if (isNaN(this.pausedTime) && this.now() - (this.startTime - this._lastSpeedChangedProgress) < 0) this.startTime = this.now();
        else if (!isNaN(this.pausedTime) && this.startTime > this.pausedTime) this.startTime = this.pausedTime;
    }

    get speed()
    {
        return this._speed;
    }

    set speed(value)
    {
        if (this.status !== 3) this._lastSpeedChangedProgress += ((this.status === 1 ? this.now() : this.pausedTime) - this.startTime) * this._speed;
        this.startTime = this.now();
        if (this.status === 2) this.pausedTime = this.now();
        this._speed = verifyNum(value);
    }

    get time()
    {
        this._clock.update();
        return ((isNaN(this.pausedTime) ? this.now() - this.startTime : this.pausedTime - this.startTime) * this._speed + this._lastSpeedChangedProgress);
    }

    static get TimerDiff()
    {
        return AudioContextTimerDiff;
    }
}

