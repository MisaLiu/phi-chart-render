import Chart from '../index';
import Judgeline from '../judgeline';
import EventLayer from '../eventlayer';
import Note from '../note';
import utils from './utils';

const calcBetweenTime = 0.125;
const Easing = [
    (x) => { return x; },
    (x) => { return Math.sin((x * Math.PI) / 2); },
    (x) => { return 1 - Math.cos((x * Math.PI) / 2); },
    (x) => { return 1 - (1 - x) * (1 - x); },
    (x) => { return x * x; },
    (x) => { return -(Math.cos(Math.PI * x) - 1) / 2; },
    (x) => { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; },
    (x) => { return 1 - Math.pow(1 - x, 3); },
    (x) => { return x * x * x; },
    (x) => { return 1 - Math.pow(1 - x, 4); },
    (x) => { return x * x * x * x; },
    (x) => { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    (x) => { return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; },
    (x) => { return 1 - Math.pow(1 - x, 5); },
    (x) => { return x * x * x * x * x; },
    (x) => { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); },
    (x) => { return x === 0 ? 0 : Math.pow(2, 10 * x - 10); },
    (x) => { return Math.sqrt(1 - Math.pow(x - 1, 2)); },
    (x) => { return 1 - Math.sqrt(1 - Math.pow(x, 2)); },
    (x) => { return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); },
    (x) => { return 2.70158 * x * x * x - 1.70158 * x * x; },
    (x) => {
        return x < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
    },
    (x) => {
        return x < 0.5
            ? (Math.pow(2 * x, 2) * ((2.594910 + 1) * 2 * x - 2.594910)) / 2
            : (Math.pow(2 * x - 2, 2) * ((2.594910 + 1) * (x * 2 - 2) + 2.594910) + 2) / 2;
    },
    (x) => {
        return x === 0
            ? 0
            : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    (x) => {
        return x === 0
            ? 0
            : x === 1
            ? 1
            : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * ((2 * Math.PI) / 3));
    },
    (x) => {
        if (x < 1 / 2.75) {
            return 7.5625 * x * x;
        } else if (x < 2 / 2.75) {
            return 7.5625 * (x -= 1.5 / 2.75) * x + 0.75;
        } else if (x < 2.5 / 2.75) {
            return 7.5625 * (x -= 2.25 / 2.75) * x + 0.9375;
        } else {
            return 7.5625 * (x -= 2.625 / 2.75) * x + 0.984375;
        }
    },
    (x) => { return 1 - Easing[25](1 - x); },
    (x) => { return x < 0.5 ? (1 - Easing[25](1 - 2 * x)) / 2 : (1 + Easing[25](2 * x - 1)) / 2; }
];

export default function RePhiEditChartConverter(_chart)
{
    let notes = [];
    let rawChart = convertChartFormat(_chart);
    let chart = new Chart({
        name      : rawChart.META.name,
        artist    : rawChart.META.composer,
        author    : rawChart.META.charter,
        difficult : rawChart.META.level,
        offset    : rawChart.META.offset / 1000
    });

    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        rawChart.BPMList.forEach((bpm, index) =>
        {
            bpm.endTime = rawChart.BPMList[index + 1] ? rawChart.BPMList[index + 1].startTime : [ 1e4, 0, 1 ];

            bpm.startBeat = bpm.startTime[0] + bpm.startTime[1] / bpm.startTime[2];
            bpm.endBeat = bpm.endTime[0] + bpm.endTime[1] / bpm.endTime[2];

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;
            bpm.endTime = currentBeatRealTime * (bpm.endBeat - bpmChangedBeat);

            bpmChangedBeat += (bpm.startBeat - bpmChangedBeat);
            
            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });

        rawChart.BPMList.sort((a, b) => b.startBeat - a.startBeat);
    }

    rawChart.judgeLineList.forEach((_judgeline, judgelineIndex) =>
    {
        let judgeline = new Judgeline({ id: judgelineIndex });

        // 一些基本信息
        judgeline.parentLine =_judgeline.father;
        judgeline.texture = _judgeline.Texture != 'line.png' ? _judgeline.Texture : null;

        // 处理 EventLayer
        _judgeline.eventLayers.forEach((_eventLayer) =>
        {
            let eventLayer = new EventLayer();

            for (const eventName in _eventLayer)
            {
                // 拍数数组转小数
                _eventLayer[eventName] = utils.calculateEventsBeat(_eventLayer[eventName] ? _eventLayer[eventName] : []);

                // 拆分缓动并将结果直接 push 进新的 eventLayer 中
                if (eventName != 'speedEvents')
                {
                    _eventLayer[eventName].forEach((event) =>
                    {
                        utils.calculateEventEase(event, Easing)
                            .forEach((newEvent) =>
                            {
                                switch (eventName)
                                {
                                    case 'moveXEvents':
                                    {
                                        eventLayer.moveX.push(newEvent);
                                        break;
                                    }
                                    case 'moveYEvents':
                                    {
                                        eventLayer.moveY.push(newEvent);
                                        break;
                                    }
                                    case 'alphaEvents':
                                    {
                                        eventLayer.alpha.push(newEvent);
                                        break;
                                    }
                                    case 'rotateEvents':
                                    {
                                        eventLayer.rotate.push(newEvent);
                                        break;
                                    }
                                    default :
                                    {
                                        console.warn('Unsupported event name \'' + eventName + '\', ignoring');
                                    }
                                }
                            }
                        );
                    });
                }
                else
                {
                    // 拆分 speedEvent
                    _eventLayer.speedEvents.forEach((event) =>
                    {
                        separateSpeedEvent(event)
                            .forEach((_event) =>
                            {
                                eventLayer.speed.push(_event);
                            }
                        );
                    });
                }
            }
            eventLayer.sort();

            // 计算事件的真实时间
            for (const name in eventLayer)
            {
                if (!(eventLayer[name] instanceof Array)) continue;
                eventLayer[name] = utils.calculateRealTime(rawChart.BPMList, eventLayer[name]);
            }

            // 计算事件规范值
            eventLayer.speed.forEach((event) =>
            {
                event.value = Math.fround(event.value / (0.6 / (120 / 900)));
            });
            eventLayer.moveX.forEach((event) =>
            {
                event.start = event.start / 1340;
                event.end = event.end / 1340;
            });
            eventLayer.moveY.forEach((event) =>
            {
                event.start = event.start / 900;
                event.end = event.end / 900;
            });
            eventLayer.alpha.forEach((event) =>
            {
                event.start = event.start > 255 ? 1 : event.start / 255;
                event.end = event.end > 255 ? 1 : event.end / 255;
            });
            eventLayer.rotate.forEach((event) =>
            {
                event.start = (Math.PI / 180) * event.start;
                event.end = (Math.PI / 180) * event.end;
            });

            eventLayer.sort();
            judgeline.eventLayers.push(eventLayer);
        });

        // 处理 extendEvents
        if (_judgeline.extended)
        {
            // 流程跟上边都是一样的，没啥好看的
            if (_judgeline.extended.textEvents && _judgeline.extended.textEvents.length > 0)
            {
                judgeline.isText = true;

                utils.calculateEventsBeat(_judgeline.extended.textEvents).forEach((event) =>
                {
                    calculateTextEventEase(event)
                        .forEach((newEvent) =>
                        {
                            judgeline.extendEvent.text.push(newEvent);
                        }
                    );
                });

                judgeline.extendEvent.text.forEach((event, eventIndex) =>
                {
                    if (isNaN(event.endTime))
                    {
                        event.endTime = judgeline.extendEvent.text[eventIndex + 1] ? judgeline.extendEvent.text[eventIndex + 1].startTime : 100;
                    }
                });
                judgeline.extendEvent.text =  utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.text);
            }

            if (_judgeline.extended.scaleXEvents && _judgeline.extended.scaleXEvents.length > 0)
            {
                utils.calculateEventsBeat(_judgeline.extended.scaleXEvents).forEach((event) =>
                {
                    utils.calculateEventEase(event, Easing)
                        .forEach((newEvent) =>
                        {
                            judgeline.extendEvent.scaleX.push(newEvent);
                        }
                    );
                });
                judgeline.extendEvent.scaleX = utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.scaleX);
            }

            if (_judgeline.extended.scaleYEvents && _judgeline.extended.scaleYEvents.length > 0)
            {
                utils.calculateEventsBeat(_judgeline.extended.scaleYEvents).forEach((event) =>
                {
                    utils.calculateEventEase(event, Easing)
                        .forEach((newEvent) =>
                        {
                            if (_judgeline.Texture !== 'line.png' && !judgeline.isText)
                            {
                                newEvent.start = newEvent.start * 0.664285;
                                newEvent.end   = newEvent.end * 0.664285;
                            }

                            judgeline.extendEvent.scaleY.push(newEvent);
                        }
                    );
                });
                judgeline.extendEvent.scaleY = utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.scaleY);
            }
        }

        // 事件排序并计算 floorPosition
        judgeline.sortEvent();
        judgeline.calcFloorPosition();

        // 计算 Note 真实时间
        _judgeline.notes = utils.calculateEventsBeat(_judgeline.notes ? _judgeline.notes : []);
        _judgeline.notes = utils.calculateRealTime(rawChart.BPMList, _judgeline.notes);

        _judgeline.notes.forEach((_note, noteIndex) =>
        {
            // 计算 Note 的 floorPosition
            let noteStartSpeedEvent = judgeline.getFloorPosition(_note.startTime);
            _note.floorPosition = noteStartSpeedEvent ? Math.fround(noteStartSpeedEvent.floorPosition + noteStartSpeedEvent.value * (_note.startTime - noteStartSpeedEvent.startTime)) : 0;

            if (_note.type == 2)
            {
                let noteEndSpeedEvent = judgeline.getFloorPosition(_note.endTime);
                _note.holdLength = Math.fround((noteEndSpeedEvent ? noteEndSpeedEvent.floorPosition + noteEndSpeedEvent.value * (_note.endTime - noteEndSpeedEvent.startTime) : 0) - _note.floorPosition);
            }
            else
            {
                _note.holdLength = 0;
            }

            // 推送 Note
            chart.notes.push(new Note({
                id            : noteIndex,
                type          : (
                    _note.type == 1 ? 1 :
                    _note.type == 2 ? 3 :
                    _note.type == 3 ? 4 :
                    _note.type == 4 ? 2 : 1
                ),
                time          : _note.startTime,
                holdTime      : Math.fround(_note.endTime - _note.startTime),
                speed         : _note.speed,
                floorPosition : _note.floorPosition,
                holdLength    : _note.holdLength,
                positionX     : (_note.positionX / (670 * (9 / 80))),
                basicAlpha    : _note.alpha / 255,
                yOffset       : _note.yOffset,
                xScale        : _note.size,
                isAbove       : _note.above == 1 ? true : false,
                isMulti       : false,
                isFake        : _note.isFake == 1 ? true : false,
                judgeline     : judgeline
            }));
        });

        chart.judgelines.push(judgeline);
    });

    chart.judgelines.sort((a, b) => a.id - b.id);
    chart.notes.sort((a, b) => a.time - b.time);

    chart.notes.forEach((note, index) =>
    {
        let nextNote = chart.notes[index + 1];
        if (!nextNote) return;

        if (note.time.toFixed(3) == nextNote.time.toFixed(3))
        {
            note.isMulti = true;
            chart.notes[index + 1].isMulti = true;
        }
    });
    
    chart.judgelines.forEach((judgeline) =>
    {
        if (judgeline.parentLine && judgeline.parentLine >= 0)
        {
            judgeline.parentLine = chart.judgelines[judgeline.parentLine];
        }
        else
        {
            judgeline.parentLine = undefined;
        }
    });
    
    return chart;
}

function convertChartFormat(rawChart)
{
    let chart = JSON.parse(JSON.stringify(rawChart));
    
    if (chart.META.RPEVersion <= 100)
    {
        chart.judgeLineList.forEach((judgeline) =>
        {
            judgeline.bpmfactor = 1;
            judgeline.father = -1;
            judgeline.zOrder = 0;

            judgeline.eventLayers.forEach((eventLayer) =>
            {
                for (const name in eventLayer)
                {
                    eventLayer[name].forEach((event) =>
                    {
                        event.easingLeft = 0;
                        event.easingRight = 1;
                    });
                }
            });
        });
    }
    if (chart.META.RPEVersion <= 105)
    {

    }
    if (chart.META.RPEVersion <= 113)
    {

    }

    if (chart.META.RPEVersion > 113)
    {
        console.warn('Unsupported chart version: ' + chart.META.RPEVersion + ', some features may not supported');
    }

    return chart;
}

function calculateTextEventEase(event)
{
    let easingFunc = Easing[event.easingType - 1] ? Easing[event.easingType - 1] : Easing[0];
    let timeBetween = event.endTime - event.startTime;
    let result = [];

    if (!event) return [];

    if (event.start != event.end)
    {
        if (event.start == '')
        {
            for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
            {
                let currentTime = event.startTime + (timeIndex * calcBetweenTime);
                let nextTime = (event.startTime + ((timeIndex + 1) * calcBetweenTime)) <= event.endTime ? event.startTime + ((timeIndex + 1) * calcBetweenTime) : event.endTime;

                result.push({
                    startTime : currentTime,
                    endTime   : nextTime,
                    text      : (result[timeIndex - 1] ? result[timeIndex - 1].text : '') + event.end[Math.floor((event.end.length - 1) * easingFunc((nextTime - event.startTime) / (event.endTime - event.startTime)))]
                });
            }
        }
        else
        {
            result.push({
                startTime : event.startTime,
                endTime   : event.endTime,
                text      : event.start
            });
            result.push({
                startTime : event.endTime,
                endTime   : NaN,
                text      : event.end
            });
        }
    }
    else
    {
        result.push({
            startTime : event.startTime,
            endTime   : event.endTime,
            text      : event.start
        });
    }

    return result;
}

function separateSpeedEvent(event)
{
    let result = [];
    let timeBetween = event.endTime - event.startTime;

    if (event.start != event.end)
    {
        for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
        {
            let currentTime = event.startTime + (timeIndex * calcBetweenTime);
            let nextTime = (event.startTime + ((timeIndex + 1) * calcBetweenTime)) <= event.endTime ? event.startTime + ((timeIndex + 1) * calcBetweenTime) : event.endTime;

            result.push({
                startTime : currentTime,
                endTime   : nextTime,
                value     : utils.valueCalculator(event, Easing, nextTime)
            });
        }
    }
    else
    {
        result.push({
            startTime: event.startTime,
            endTime: event.endTime,
            value: Math.fround(event.start)
        });
    }

    return result;
}
