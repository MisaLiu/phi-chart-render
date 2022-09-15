export default class Events
{
    constructor()
    {
        this.speed  = [];
        this.posX   = [];
        this.posY   = [];
        this.alpha  = [];
        this.rotate = [];

        this._speed  = 1;
        this._posX   = 0.5;
        this._posY   = 0.5;
        this._alpha  = 1;
        this._rotate = 0;
    }

    sort()
    {
        for (const name in this)
        {
            this[name].sort((a, b) => a.startTime - b.startTime);
        }
    }

    calcTime(currentTime)
    {
        for (const name in this)
        {
            if (name.indexOf('_') === 0) continue;

            for (const event of this[name])
            {
                if (event.startTime < currentTime) continue;
                if (event.endTime > currentTime) break;

                let timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
                let timePercentStart = 1 - timePercentEnd;

                this['_' + name] = Math.fround(event.start * timePercentStart + event.end * timePercentEnd);
            };
        }
    }
}