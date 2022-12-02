import { number as verifyNum } from '@/verify';

export default class Timer
{
    constructor(speed = 1, offset = 0)
    {
        this.speed  = parseFloat((verifyNum(speed, 1, 0, 2)).toFixed(2));
        this.offset = verifyNum(offset, 0) * 1000;

        this.reset();
    }

    reset()
    {
        this.startTime = NaN;
        this.pauseTime = NaN;
        this.isPaused = true;
    }

    start()
    {
        if (!isNaN(this.startTime)) return;

        this.startTime = Date.now() + this.offset;
        this.isPaused = false;
    }

    pause()
    {
        if (isNaN(this.startTime)) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused)
        {
            this.pauseTime = Date.now();
        }
        else
        {
            this.startTime = Date.now() - (this.pauseTime - this.startTime);
            this.pauseTime = NaN;
        }
    }

    skip(time)
    {
        if (isNaN(this.pauseTime)) return;
        this.startTime += time;
        if (this.startTime > this.pauseTime) this.startTime = this.pauseTime;
    }

    get time()
    {
        return (
            !isNaN(this.startTime) ?
            (
                (((!isNaN(this.pauseTime) ? this.pauseTime : Date.now()) - this.startTime) * this.speed) / 1000
            ) : 0
        );
    }
}
