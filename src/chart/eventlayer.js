export default class EventLayer
{
    constructor()
    {
        this.speed  = [];
        this.moveX  = [];
        this.moveY  = [];
        this.alpha  = [];
        this.rotate = [];

        this._speed  = 0;
        this._posX   = 0;
        this._posY   = 0;
        this._alpha  = 0;
        this._rotate = 0;
    }

    sort()
    {
        const sorter = (a, b) => a.startTime - b.startTime;
        this.speed.sort(sorter);
        this.moveX.sort(sorter);
        this.moveY.sort(sorter);
        this.alpha.sort(sorter);
        this.rotate.sort(sorter);
    }

    calcTime(currentTime)
    {
        this._posX   = valueCalculator(this.moveX, currentTime, this._posX);
        this._posY   = valueCalculator(this.moveY, currentTime, this._posY);
        this._alpha  = valueCalculator(this.alpha, currentTime, this._alpha);
        this._rotate = valueCalculator(this.rotate, currentTime, this._rotate);

        for (const event of this.speed)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            this._speed = event.value;
        }
    }
}

function valueCalculator(events, currentTime, originValue = 0)
{
    for (const event of events)
    {
        if (event.endTime < currentTime) continue;
        if (event.startTime > currentTime) break;
        if (event.start == event.end) return event.start

        let timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
        let timePercentStart = 1 - timePercentEnd;

        return event.start * timePercentStart + event.end * timePercentEnd;
    }
    return originValue;
}