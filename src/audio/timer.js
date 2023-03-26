import { number as verifyNum } from '@/verify';



const getCurrentTime = () => performance.now() || Date.now();



class AudioTimer
{
    constructor(speed = 1, offset = 0)
    {
        this.speed = verifyNum(speed);
        this.offset = verifyNum(offset);
        this.startTime = NaN;
        this.pausedTime = NaN;
        this.status = 3;
    }

    start()
    {
        if (this.status === 2)
        {
            this.startTime = getCurrentTime() - (this.pausedTime - this.startTime);
        }
        else
        {
            this.startTime = getCurrentTime();
        }
        
        this.status = 1;
        this.pausedTime = NaN;
    }

    pause()
    {
        if (this.status === 1)
        {
            this.pausedTime = getCurrentTime();
            this.status = 2;
        }
        else if (this.status === 2)
        {
            this.startTime = getCurrentTime() - (this.pausedTime - this.startTime);
            this.pausedTime = NaN;
            this.status = 1;
        }
    }

    stop()
    {
        if (this.status === 3) return;

        this.startTime = NaN;
        this.pausedTime = NaN;
        this.status = 3;
    }

    seek(duration)
    {
        if (this.status === 3) return;
        this.startTime -= duration * 1000;
        if (isNaN(this.pausedTime) && getCurrentTime() - this.startTime < 0) this.startTime = getCurrentTime();
        else if (!isNaN(this.pausedTime) && this.startTime > this.pausedTime) this.startTime = this.pausedTime;
    }

    get time()
    {
        return (isNaN(this.pausedTime) ? getCurrentTime() - this.startTime : this.pausedTime - this.startTime) * this.speed / 1000 - this.offset;
    }
}


export default AudioTimer;