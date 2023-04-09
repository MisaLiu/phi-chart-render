import Effect from '../index'
import utils from '@/chart/convert/utils';

const Easing = [
    (x) => x,
    (x) => Math.sin((x * Math.PI) / 2),
    (x) => 1 - Math.cos((x * Math.PI) / 2),
    (x) => 1 - (1 - x) * (1 - x),
    (x) => x * x,
    (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
    (x) => 1 - Math.pow(1 - x, 3),
    (x) => x * x * x,
    (x) => 1 - Math.pow(1 - x, 4),
    (x) => x * x * x * x,
    (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
    (x) => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2,
    (x) => 1 - Math.pow(1 - x, 5),
    (x) => x * x * x * x * x,
    (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x),
    (x) => x === 0 ? 0 : Math.pow(2, 10 * x - 10),
    (x) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    (x) => 1 - Math.sqrt(1 - Math.pow(x, 2)),
    (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2),
    (x) => 2.70158 * x * x * x - 1.70158 * x * x,
    (x) => x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,
    (x) => x < 0.5 ? (Math.pow(2 * x, 2) * ((2.594910 + 1) * 2 * x - 2.594910)) / 2 : (Math.pow(2 * x - 2, 2) * ((2.594910 + 1) * (x * 2 - 2) + 2.594910) + 2) / 2,
    (x) => x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
    (x) => x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * ((2 * Math.PI) / 3)),
    (x) => x < 1 / 2.75 ? 7.5625 * x * x : x < 2 / 2.75 ? 7.5625 * (x -= 1.5 / 2.75) * x + 0.75 : x < 2.5 / 2.75 ? 7.5625 * (x -= 2.25 / 2.75) * x + 0.9375 : 7.5625 * (x -= 2.625 / 2.75) * x + 0.984375,
    (x) => 1 - Easing[25](1 - x),
    (x) => x < 0.5 ? (1 - Easing[25](1 - 2 * x)) / 2 : (1 + Easing[25](2 * x - 1)) / 2
];

export default function PrprEffectReader(effect)
{
    let effectList = [];
    let rawEffects = [ ...effect.effects ];
    let bpmList = [ ...effect.bpm ];
    
    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        bpmList.forEach((bpm, index) =>
        {
            bpm.endTime = bpmList[index + 1] ? bpmList[index + 1].time : [ 1e4, 0, 1 ];

            bpm.startBeat = bpm.time[0] + bpm.time[1] / bpm.time[2];
            bpm.endBeat = bpm.endTime[0] + bpm.endTime[1] / bpm.endTime[2];

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;
            bpm.endTime = currentBeatRealTime * (bpm.endBeat - bpmChangedBeat);

            bpmChangedBeat += (bpm.beat - bpmChangedBeat);

            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });

        bpmList.sort((a, b) => b.beat - a.beat);
    }

    if (bpmList.length <= 0)
    {
        bpmList.push({
            startBeat : 0,
            endBeat   : 1e4,
            startTime : 0,
            endTime   : 1e6 - 1,
            bpm       : 120,
            beatTime  : 0.5 
        });
    }

    utils.calculateRealTime(bpmList, calculateEffectsBeat(rawEffects))
        .forEach((_effect) =>
        {
            let effect = new Effect({
                startTime: _effect.startTime,
                endTime: _effect.endTime,
                shader: _effect.shader,
                isGlobal: _effect.global || false,
                vars: {},
            });

            for (const name in _effect.vars)
            {
                let _values = _effect.vars[name];

                if (_values instanceof Array)
                {
                    let values = [];

                    utils.calculateEventsBeat(_values)
                        .forEach((_value) =>
                        {
                            values = [ ...values, ...utils.calculateRealTime(bpmList, utils.calculateEventEase(_value, Easing)) ];
                        }
                    );

                    values.sort((a, b) => a.startTime - b.startTime);
                    effect.vars[name] = values;
                }
                else
                {
                    effect.vars[name] = _values;
                }
            }

            effectList.push(effect);
        }
    );

    effectList.sort((a, b) => a.startTime  - b.startTime);

    return effectList;
}



function calculateEffectBeat(effect)
{
    effect.startTime = parseFloat((effect.start[0] + (effect.start[1] / effect.start[2])).toFixed(3));
    effect.endTime = parseFloat((effect.end[0] + (effect.end[1] / effect.end[2])).toFixed(3));
    return effect;
}

function calculateEffectsBeat(effects)
{
    effects.forEach((effect) =>
    {
        effect = calculateEffectBeat(effect);
    });
    return effects;
}