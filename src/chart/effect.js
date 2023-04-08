import { bool as verifyBool } from '@/verify';


export default class Effect
{
    constructor(params)
    {
        this.shader = params.shader;
        this.startTime = params.startTime;
        this.endTime = params.endTime;
        this.isGlobal = verifyBool(params.isGlobal, false);
        this.vars = {};
    }

    preProcessVars()
    {
        varName = Object.getOwnPropertyNames(this.vars)
        varName.forEach((n) => { 
            this[n] = 0;
        })
    }

    initShader(shaders)
    {
        // WIP
        // Goal: load correct shader to this.shader when call this func
    }
    
    calcTime(currentTime) {
        varName = Object.getOwnPropertyNames(this.vars)
        varName.forEach((n) => {
            this[n] = valueCalculator(this.vars[n], currentTime, this[n]);
        })
    }
}

function valueCalculator(events, currentTime, originValue = 0) {
    for (let i = 0, length = events.length; i < length; i++) {
        let event = events[i];
        if (event.endTime < currentTime) continue;
        if (event.startTime > currentTime) break;
        if (event.start == event.end) return event.start

        let timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
        let timePercentStart = 1 - timePercentEnd;

        return event.start * timePercentStart + event.end * timePercentEnd;
    }
    return originValue;
}

// The thing that needs to be done:
// 1. Calculate values in ./game/ticker (Now pre-calced)
// 2. Integrate effects into the chart (./chart/index)
// 3. Update uniforms in ./game/index
// If there's anything left that's probably bugfixing.

// Effects should act on Game rather than Chart since
// the filter is loaded by Game and effected on Containers