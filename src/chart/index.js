import * as Convert from './convert';

import Judgeline from './judgeline';

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
}


