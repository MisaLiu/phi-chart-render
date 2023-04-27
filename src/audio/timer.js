import { number as verifyNum } from '@/verify';



var AudioContextTimerDiff = 0;



class AudioTimer
{
    constructor(speed = 1)
    {
        this.startTime = NaN;
        this.pausedTime = NaN;
        this.status = 3;

        this._speed = verifyNum(speed);
        this._lastSpeedChangedProgress = 0;
    }

    start(audioCtxCurrentTime)
    {
        if (this.status === 2)
        {
            this.startTime = performance.now() - (this.pausedTime - this.startTime);
        }
        else
        {
            this.startTime = (audioCtxCurrentTime ? (audioCtxCurrentTime * 1000) + AudioContextTimerDiff : performance.now());
        }
        
        this.status = 1;
        this.pausedTime = NaN;
    }

    pause()
    {
        if (this.status === 1)
        {
            this.pausedTime = performance.now();
            this.status = 2;
        }
        else if (this.status === 2)
        {
            this.startTime = performance.now() - (this.pausedTime - this.startTime);
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
        this.startTime -= duration * 1000;
        if (isNaN(this.pausedTime) && performance.now() - (this.startTime - this._lastSpeedChangedProgress) < 0) this.startTime = performance.now();
        else if (!isNaN(this.pausedTime) && this.startTime > this.pausedTime) this.startTime = this.pausedTime;
    }

    get speed()
    {
        return this._speed;
    }

    set speed(value)
    {
        if (this.status !== 3) this._lastSpeedChangedProgress += ((this.status === 1 ? performance.now() : this.pausedTime) - this.startTime) * this._speed;
        this.startTime = performance.now();
        if (this.status === 2) this.pausedTime = performance.now();
        this._speed = verifyNum(value);
    }

    get time()
    {
        return ((isNaN(this.pausedTime) ? performance.now() - this.startTime : this.pausedTime - this.startTime) * this._speed + this._lastSpeedChangedProgress) / 1000;
    }

    static initTimeDiff(audioCtxCurrentTime)
    {
        AudioContextTimerDiff = performance.now() - (audioCtxCurrentTime * 1000);
        return AudioContextTimerDiff;
    }

    static get TimerDiff()
    {
        return AudioContextTimerDiff;
    }
}


export default AudioTimer;