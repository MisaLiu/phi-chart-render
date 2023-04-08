import EventLayer from '../eventlayer';
import Note from '../note';
import utils from './utils';

const calcBetweenTime = 0.125;
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

export default function PrprChartConverter(chart) {
    let effectList = {};
    let rawEffect = chart;
    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        rawEffect.bpm.forEach((bpm, index) => {
            bpm.beat = bpm.time[0] + bpm.time[1] / bpm.time[2];
            bpmChangedTime += currentBeatRealTime * (bpm.beat - bpmChangedBeat);
            bpm.time = bpmChangedTime;
            bpmChangedBeat += (bpm.beat - bpmChangedBeat);
            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });

        rawEffect.bpm.sort((a, b) => b.beat - a.beat);
    }

    effectName = Object.getOwnPropertyNames(rawEffect.effects)
    effectName.forEach((e) => {
        effectList.effects['e'].push(calculateEffectEase(effect))
    })

    effectList.bpm = calculateHoldBetween(rawEffect.bpm);

    return effectList;
}

function calculateEffectEase(event) {
    let timeBetween = event.endTime - event.startTime;
    let result = [];

    if (!event) return [];

    varName = Object.getOwnPropertyNames(event.vars)
    varName.forEach((n) => {
        let currentValue = 0;
        let currentTime = 0;
        let nextTime = 0;
        event.vars[n].forEach((t,index) => {
            for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++) {
                currentTime = t.startTime + (timeIndex * calcBetweenTime);
                nextTime = (t.startTime + ((timeIndex + 1) * calcBetweenTime)) <= t.endTime ? t.startTime + ((timeIndex + 1) * calcBetweenTime) : t.endTime;
                currentValue = _valueCalculator(t, nextTime, start, end);
                result.vars[n][index].push({
                    startTime: currentTime,
                    endTime: nextTime,
                    value: currentValue
                });
            }
        })
        if (nextTime != event.endTime) {
            result.vars[n].push({
                startTime: nextTime,
                endTime: endTime,
                value: currentValue
            });
        }
    })
    return result;
}

function _valueCalculator(event, currentTime, startValue = 0, endValue = 1) {
    if (startValue == endValue) return startValue;
    if (event.startTime > currentTime) throw new Error('currentTime must bigger than startTime');
    if (event.endTime < currentTime) throw new Error('currentTime must smaller than endTime');

    let timePercentStart = (currentTime - event.startTime) / (event.endTime - event.startTime);
    let timePercentEnd = 1 - timePercentStart;
    let easeFunction = Easing[event.easingType - 1] ? Easing[event.easingType - 1] : Easing[0];
    let easePercent = easeFunction(verifyNum(event.easingLeft, 0, 0, 1) * timePercentEnd + verifyNum(event.easingRight, 1, 0, 1) * timePercentStart);
    let easePercentStart = easeFunction(verifyNum(event.easingLeft, 0, 0, 1));
    let easePercentEnd = easeFunction(verifyNum(event.easingRight, 1, 0, 1));

    easePercent = (easePercent - easePercentStart) / (easePercentEnd - easePercentStart);

    return startValue * (1 - easePercent) + endValue * easePercent;
}

function calculateHoldBetween(_bpm) {
    let bpm = _bpm.slice();
    let result = [];

    bpm.sort((a, b) => a.time - b.time);
    bpm.forEach((bpm) => {
        if (result.length <= 0) {
            result.push({
                startTime: bpm.time,
                endTime: bpm.time,
                bpm: bpm.bpm,
                holdBetween: ((-1.2891 * bpm.bpm) + 396.71) / 1000
            });
        }
        else {
            result[result.length - 1].endTime = bpm.time;

            if (result[result.length - 1].bpm != bpm.bpm) {
                result.push({
                    startTime: bpm.time,
                    endTime: bpm.time,
                    bpm: bpm.bpm,
                    holdBetween: ((-1.2891 * bpm.bpm) + 396.71) / 1000
                });
            }
        }
    });

    result.sort((a, b) => a.time - b.time);

    if (result.length > 0) {
        result[0].startTime = 1 - 1000;
        result[result.length - 1].endTime = 1e4;
    }
    else {
        result.push({
            startTime: 1 - 1000,
            endTime: 1e4,
            bpm: 120,
            holdBetween: 0.242018
        });
    }

    return result;
}