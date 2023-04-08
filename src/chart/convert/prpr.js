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
    let effect = {};
    let rawEffect = chart;
    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        rawEffect.bpm.forEach((bpm, index) => {
            bpm.endTime = rawChart.BPMList[index + 1] ? rawChart.BPMList[index + 1].startTime : [1e4, 0, 1];

            bpm.startBeat = bpm.startTime[0] + bpm.startTime[1] / bpm.startTime[2];
            bpm.endBeat = bpm.endTime[0] + bpm.endTime[1] / bpm.endTime[2];

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;
            bpm.endTime = currentBeatRealTime * (bpm.endBeat - bpmChangedBeat);

            bpmChangedBeat += (bpm.startBeat - bpmChangedBeat);

            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });

        rawEffect.bpm.sort((a, b) => b.startBeat - a.startBeat);
    }

    rawEffect.effects.forEach((effect) => {
        effect.effects.push(calculateEffectEase(effect.vars.power))
    });
    effect.bpmList = utils.calculateHoldBetween(rawEffect.bpm);

    return effect;
}

// WIP
function calculateEffectEase(event) {
    let timeBetween = event.endTime - event.startTime;
    let result = [];

    if (!event) return [];

            let currentValue = [];

            for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++) {
                let currentTime = event.startTime + (timeIndex * calcBetweenTime);
                let nextTime = (event.startTime + ((timeIndex + 1) * calcBetweenTime)) <= event.endTime ? event.startTime + ((timeIndex + 1) * calcBetweenTime) : event.endTime;
                let currentTextIndex = Math.floor(_valueCalculator(event, nextTime, 0, event.end.length - 1));

                if (lastTextIndex + 1 < currentTextIndex) {
                    for (let extraTextIndex = lastTextIndex + 1; extraTextIndex < currentTextIndex; extraTextIndex++) {
                        currentText.push(event.end[extraTextIndex]);
                    }
                }
                else if (lastTextIndex + 1 > currentTextIndex) {
                    currentText.length = currentTextIndex;
                }

                if (event.end[currentTextIndex]) currentText.push(event.end[currentTextIndex]);

                result.push({
                    startTime: currentTime,
                    endTime: nextTime,
                    value: currentText.join('')
                });

                lastTextIndex = currentTextIndex;
            }

    return result;
}