import * as Convert from './convert';

export default class Chart
{
    constructor()
    {
        this.judgelines = [];
        this.notes = [];
        this.offset = 0;
    }

    static from(rawChart)
    {
        if (rawChart instanceof Object)
        {
            if (!isNaN(Number(rawChart.formatVersion)))
            {
                return Convert.Official(rawChart);
            }
            else
            {
                throw new Error('Unsupported chart format');
            }

        }
        else if (rawChart instanceof String)
        {
            throw new Error('Unsupported chart format');
        }
        else
        {
            throw new Error('Unsupported chart format');
        }
    }

    calcTime(currentTime, pixi)
    {
        this.judgelines.forEach((judgeline) =>
        {
            judgeline.calcTime(currentTime, pixi);
        });
    }

    get totalNotes() {
        return this.notes.length;
    }

    get totalRealNotes() {
        let result = 0;
        this.notes.forEach((note) => {
            if (!note.isFake) result++;
        });
        return result;
    }

    get totalFakeNotes() {
        let result = 0;
        this.notes.forEach((note) => {
            if (note.isFake) result++;
        });
        return result;
    }
}


