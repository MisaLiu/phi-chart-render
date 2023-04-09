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

        this.reset();
    }

    reset()
    {
        this._currentValue = (this.shader !== null && typeof this.shader !== 'string') ? this.shader.defaultValues : {};
    }
    
    calcTime(currentTime, screenSize)
    {
        if (this.shader === null) return;

        const { vars, shader, _currentValue } = this;

        for (const name in vars)
        {
            const values = vars[name];
            if (typeof values === 'object') _currentValue[name] = valueCalculator(values, currentTime, shader.defaultValues[name]);
            else _currentValue[name] = values;
        }

        shader.update({ ..._currentValue, time: currentTime, screenSize: screenSize });
    }
}

function valueCalculator(values, currentTime, defaultValue)
{
    for (let i = 0, length = values.length; i < length; i++)
    {
        const value = values[i];
        if (value.endTime < currentTime) continue;
        if (value.startTime > currentTime) break;
        if (value.start === value.end) return value.start;

        let timePercentEnd = (currentTime - value.startTime) / (value.endTime - value.startTime);
        let timePercentStart = 1 - timePercentEnd;

        return value.start * timePercentStart + value.end * timePercentEnd;
    }

    return defaultValue;
}

// The thing that needs to be done:
// 1. Calculate values in ./game/ticker (Now pre-calced)
// 2. Integrate effects into the chart (./chart/index)
// 3. Update uniforms in ./game/index
// If there's anything left that's probably bugfixing.

// Effects should act on Game rather than Chart since
// the filter is loaded by Game and effected on Containers

// I guess now it's all done