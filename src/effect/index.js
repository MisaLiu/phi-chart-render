import { bool as verifyBool, text as verifyString} from '@/verify';
import * as Reader from './reader';


export default class Effect
{
    constructor(params)
    {
        this.shader = params.shader;
        this.startTime = params.startTime;
        this.endTime = params.endTime;
        this.isGlobal = verifyBool(params.isGlobal, false);
        this.target = verifyString(params.target, '');
        this.vars = {};

        this.reset();
    }

    reset()
    {
        this._currentValue = (this.shader !== null && typeof this.shader !== 'string') ? this.shader.defaultValues : {};
    }

    static from(json)
    {
        let result;

        if (typeof json === 'object')
        {
            result = Reader.PrprEffectReader(json);
        }
        
        if (!result || result.length <= 0)
        {
            throw new Error('Unsupported file format');
        }

        return result;
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