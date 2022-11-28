export default class Timer
{
    constructor(speed = 1)
    {
        this.speed = !isNaN(parseFloat(speed)) ? parseFloat((speed).toFixed(2)) : 1;

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

        this.startTime = Date.now();
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

    get time()
    {
        return (((!isNaN(this.pauseTime) ? this.pauseTime : Date.now()) - this.startTime) * this.speed) / 1000;
    }
}
