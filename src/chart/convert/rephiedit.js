import Chart from '../index';
import Judgeline from '../judgeline';
import Note from '../note';

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
    (x) => {
        return 1 - easeOutBounce(1 - x);
        function easeOutBounce(x) {
            if (x < 1 / 2.75) {
                return 7.5625 * x * x;
            } else if (x < 2 / 2.75) {
                return 7.5625 * (x -= 1.5 / 2.75) * x + 0.75;
            } else if (x < 2.5 / 2.75) {
                return 7.5625 * (x -= 2.25 / 2.75) * x + 0.9375;
            } else {
                return 7.5625 * (x -= 2.625 / 2.75) * x + 0.984375;
            }
        }
    },
    (x) => {
        return x < 0.5
            ? (1 - easeOutBounce(1 - 2 * x)) / 2
            : (1 + easeOutBounce(2 * x - 1)) / 2;
        function easeOutBounce(x) {
            if (x < 1 / 2.75) {
                return 7.5625 * x * x;
            } else if (x < 2 / 2.75) {
                return 7.5625 * (x -= 1.5 / 2.75) * x + 0.75;
            } else if (x < 2.5 / 2.75) {
                return 7.5625 * (x -= 2.25 / 2.75) * x + 0.9375;
            } else {
                return 7.5625 * (x -= 2.625 / 2.75) * x + 0.984375;
            }
        }
    }
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
            if (index < rawChart.BPMList.length - 1)
            {
                bpm.endTime = rawChart.BPMList[index + 1].startTime;
            }
            else
            {
                bpm.endTime = [1e9, 0, 1];
            }

            bpm.startBeat = bpm.startTime[0] + bpm.startTime[1] / bpm.startTime[2];
            bpm.endBeat = bpm.endTime[0] + bpm.endTime[1] / bpm.endTime[2];

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;
            bpm.endTime = currentBeatRealTime * (bpm.endBeat - bpmChangedBeat);

            bpmChangedBeat += (bpm.startBeat - bpmChangedBeat);
            
            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });
    }

    rawChart.judgeLineList.forEach((judgeline) =>
    {
        // Beat 数组转换为小数
        judgeline.eventLayers.forEach((eventLayer) =>
        {
            for (const name in eventLayer)
            {
                eventLayer[name] = beat2Time(eventLayer[name]);
            }
        });
        for (const name in judgeline.extended)
        {
            judgeline.extended[name] = beat2Time(judgeline.extended[name]);
        }

        // 拆分缓动
        judgeline.eventLayers.forEach((eventLayer, eventLayerIndex) =>
        {
            let newEvents = {};

            for (const name in eventLayer)
            {
                if (!newEvents[name]) newEvents[name] = [];
                eventLayer[name].forEach((event) =>
                {
                    calculateEventEase(event)
                        .forEach((event) =>
                        {
                            newEvents[name].push(event);
                        }
                    );
                });
            }

            judgeline.eventLayers[eventLayerIndex] = newEvents;
        });
        for (const name in judgeline.extended)
        {
            let newEvents = [];

            if (judgeline.extended[name].length <= 0) continue;

            judgeline.extended[name].forEach((event) =>
            {
                calculateEventEase(event)
                    .forEach((event) =>
                    {
                        newEvents.push(event);
                    }
                );
            });

            judgeline.extended[name] = newEvents;
        }

        judgeline.eventLayers.forEach((_eventLayer, eventLayerIndex) =>
        {
            let eventLayer = _eventLayer;
            for (const name in eventLayer)
            {
                eventLayer[name].unshift(
                    {
                        startTime : 0,
                        endTime   : eventLayer[name][0].startTime,
                        start     : 0,
                        end       : 0 + eventLayer[name][0].start
                    }
                );
            }
            judgeline.eventLayers[eventLayerIndex] = eventLayer;
        });

        { // 多层 EventLayer 叠加
            let finalEvent = {
                speed: [],
                moveX: [],
                moveY: [],
                rotate: [],
                alpha: []
            };
    
            judgeline.eventLayers.forEach((eventLayer, eventLayerIndex) =>
            {
                for (const name in eventLayer)
                {
                    if (name == 'alphaEvents')
                        finalEvent.alpha = MergeEventLayer(eventLayer[name], eventLayerIndex, finalEvent.alpha);
                    if (name == 'moveXEvents')
                        finalEvent.moveX = MergeEventLayer(eventLayer[name], eventLayerIndex, finalEvent.moveX);
                    if (name == 'moveYEvents')
                        finalEvent.moveY = MergeEventLayer(eventLayer[name], eventLayerIndex, finalEvent.moveY);
                    if (name == 'rotateEvents')
                        finalEvent.rotate = MergeEventLayer(eventLayer[name], eventLayerIndex, finalEvent.rotate);
                    if (name == 'speedEvents')
                        finalEvent.speed = MergeEventLayer(eventLayer[name], eventLayerIndex, finalEvent.speed);
                }
            });
    
            judgeline.event = finalEvent;
            judgeline.eventLayers = undefined;
        }
        
        { // 拆分 speedEvents
            let newSpeedEvents = [];
            judgeline.event.speed.forEach((event) =>
            {
                separateSpeedEvent(event)
                    .forEach((_event) =>
                    {
                        newSpeedEvents.push(_event);
                    }
                );
            });
            newSpeedEvents.sort((a, b) => a.startTime - b.startTime);
            judgeline.event.speed = newSpeedEvents;
        }

        // speedEvents 时间连续性计算
        if (judgeline.event.speed[0].startTime != 0 && judgeline.event.speed[0].start != 1 && judgeline.event.speed[0].end != 1)
        {
            judgeline.event.speed.unshift({
                startTime: 0,
                endTime: judgeline.event.speed[0].startTime,
                start: 1,
                end: 1
            });
        }
        else if (judgeline.event.speed[0].startTime != 0)
        {
            judgeline.event.speed[0].startTime = 0;
        }

        // 计算事件的真实时间
        for (const name in judgeline.event)
        {
            judgeline.event[name] = calculateRealTime(rawChart.BPMList, judgeline.event[name]);
        }
        for (const name in judgeline.extended)
        {
            judgeline.extended[name] = calculateRealTime(rawChart.BPMList, judgeline.extended[name]);
        }

        // 计算事件规范值
        judgeline.event.alpha.forEach((event) =>
        {
            event.start = event.start > 255 ? 1 : event.start / 255;
            event.end = event.end > 255 ? 1 : event.end / 255;
        });
        judgeline.event.moveX.forEach((event) =>
        {
            event.start = event.start / 1340 + 0.5;
            event.end = event.end / 1340 + 0.5;
        });
        judgeline.event.moveY.forEach((event) =>
        {
            event.start = event.start / 900 + 0.5;
            event.end = event.end / 900 + 0.5;
        });
        judgeline.event.rotate.forEach((event) =>
        {
            event.start = (Math.PI / 180) * event.start;
            event.end = (Math.PI / 180) * event.end;
        });
        judgeline.event.speed.forEach((event) =>
        {
            event.value = event.value / (0.6 / (120 / 900));
            event.start = event.start / (0.6 / (120 / 900));
            event.end = event.end / (0.6 / (120 / 900));
        });

        // 计算 speedEvent 的 floorPosition
        judgeline.event.speed = calculateSpeedEventFloorPosition(judgeline.event.speed);

        // Note 的 Beat 转小数
        judgeline.notes = beat2Time(judgeline.notes ? judgeline.notes : []);
        judgeline.notes = calculateRealTime(rawChart.BPMList, judgeline.notes);

        judgeline.notes.forEach((note) =>
        {
            { // 计算 Note 的 floorPosition
                let noteStartSpeedEvent;
                let noteEndSpeedEvent;

                for (const event of judgeline.event.speed)
                {
                    if (note.startTime > event.startTime && note.startTime > event.endTime) continue;
                    if (note.startTime < event.startTime && note.startTime < event.endTime) break;

                    noteStartSpeedEvent = event;
                }

                note.floorPosition = noteStartSpeedEvent ? noteStartSpeedEvent.floorPosition + noteStartSpeedEvent.value * (note.startTime - noteStartSpeedEvent.startTime) : 0;

                if (note.type == 2)
                {
                    for (const event of judgeline.event.speed)
                    {
                        if (note.endTime > event.startTime && note.endTime > event.endTime) continue;
                        if (note.endTime < event.startTime && note.endTime < event.endTime) break;

                        noteEndSpeedEvent = event;
                    }

                    note.holdLength = (noteEndSpeedEvent ? noteEndSpeedEvent.floorPosition + noteEndSpeedEvent.value * (note.endTime - noteEndSpeedEvent.startTime) : 0) - note.floorPosition;
                }
                else
                {
                    note.holdLength = 0;
                }
            }
        });
    });

    rawChart.judgeLineList.forEach((_judgeline, index) =>
    {
        let judgeline = new Judgeline({ id: index });

        judgeline.texture = _judgeline.Texture != 'line.png' ? _judgeline.Texture : 'judgeline';
        judgeline.parentLine =_judgeline.father;
        judgeline.event = _judgeline.event;

        for (const name in _judgeline.extended)
        {
            if (name == 'scaleXEvents')
                judgeline.extendEvent.scaleX = _judgeline.extended[name];
            if (name == 'scaleYEvents')
                judgeline.extendEvent.scaleY = _judgeline.extended[name];
        }
        
        judgeline.sortEvent();
        chart.judgelines.push(judgeline);
        
        _judgeline.notes.forEach((note, noteIndex) =>
        {
            notes.push(new Note({
                id            : noteIndex,
                type          : (
                    note.type == 1 ? 1 :
                    note.type == 2 ? 3 :
                    note.type == 3 ? 4 :
                    note.type == 4 ? 2 : 1
                ),
                time          : note.startTime,
                holdTime      : note.endTime,
                speed         : note.speed,
                floorPosition : note.floorPosition,
                holdLength    : note.holdLength,
                positionX     : (note.positionX / (670 * (9 / 80))),
                basicAlpha    : note.alpha / 255,
                yOffset       : note.yOffset,
                xScale        : note.size,
                isAbove       : note.above == 1 ? true : false,
                isMulti       : false,
                isFake        : note.isFake == 1 ? true : false,
                judgeline     : judgeline
            }));
        });
    });
    
    chart.judgelines.sort((a, b) => a.id - b.id);
    notes.sort((a, b) => a.time - b.time);
    notes.forEach((note, index) =>
    {
        let nextNote = notes[index + 1];
        if (!nextNote) return;

        if (note.time == nextNote.time)
        {
            note.isMulti = true;
            nextNote.isMulti = true;
        }
    });
    chart.notes = notes;
    
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
    
    switch (chart.META.RPEVersion)
    {
        case 100:
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
            break;
        }
        case 105:
        {
            break;
        }
        case 113:
        {
            break;
        }
        default :
        {
            throw new Error('Unsupported chart version: ' + chart.META.RPEVersion);
        }
    }

    return chart;
}

function beat2Time(event)
{
    event.forEach((e) =>
    {
        e.startTime = Math.fround(e.startTime[0] + e.startTime[1] / e.startTime[2]);
        e.endTime = Math.fround(e.endTime[0] + e.endTime[1] / e.endTime[2]);
    });
    return event;
}

function calculateEventEase(event, forceLinear = false)
{
    let result = [];
    let timeBetween = event.endTime - event.startTime;
    let valueBetween = event.end - event.start;

    if (!event)
    {
        return [];
    }

    for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
    {
        let easeBetween = event.easingRight - event.easingLeft;
        let timePercentStart = (timeIndex * calcBetweenTime) / timeBetween;
        let timePercentEnd = ((timeIndex + 1) * calcBetweenTime) / timeBetween;

        if (event.easingType && (event.easingType !== 1 || forceLinear) && event.easingType <= Easing.length && event.start != event.end)
        {
            result.push({
                startTime: event.startTime + timeIndex * calcBetweenTime,
                endTime: (
                    timeIndex + 1 == timeCount && event.startTime + (timeIndex + 1) * calcBetweenTime != event.endTime ?
                    event.endTime : event.startTime + (timeIndex + 1) * calcBetweenTime
                ),
                start: event.start + valueBetween * Easing[event.easingType - 1](event.easingLeft + easeBetween * timePercentStart),
                end: (
                    timeIndex + 1 == timeCount && event.start + valueBetween * Easing[event.easingType - 1](event.easingLeft + easeBetween * timePercentEnd) != event.end ?
                    event.end : event.start + valueBetween * Easing[event.easingType - 1](event.easingLeft + easeBetween * timePercentEnd)
                )
            });
        }
        else
        {
            result.push({
                startTime: event.startTime,
                endTime: event.endTime,
                start: event.start,
                end: event.end
            });
            break;
        }
    }

    return result;
}

function separateSpeedEvent(event)
{
    let result = [];
    let timeBetween = event.endTime - event.startTime;
    let valueBetween = event.end - event.start;

    for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
    {
        let timePercentStart = ((timeIndex + 1) * calcBetweenTime) / timeBetween;

        if (event.start != event.end)
        {
            result.push({
                startTime: event.startTime + timeIndex * calcBetweenTime,
                endTime: (
                    timeIndex + 1 == timeCount && event.startTime + (timeIndex + 1) * calcBetweenTime != event.endTime ?
                    event.endTime : event.startTime + (timeIndex + 1) * calcBetweenTime
                ),
                value: event.start + valueBetween * Easing[event.easingType ? event.easingType - 1 : 0](timePercentStart),
                floorPosition: 0
            });
        }
        else
        {
            result.push({
                startTime: event.startTime,
                endTime: event.endTime,
                value: event.start,
                floorPosition: 0
            });
            break;
        }
    }

    return result;
}

function calculateSpeedEventFloorPosition(events)
{
    let currentFloorPosition = 0;
    let result = [];

    // bpmList.sort((a, b) => b.startTime - a.startTime);

    events.forEach((event, index) =>
    {
        let newEvent = event;
        newEvent.endTime = index < events.length - 1 ? events[index + 1].startTime : 1e9;

        newEvent.floorPosition = currentFloorPosition;
        currentFloorPosition += Math.fround((newEvent.endTime - newEvent.startTime) * newEvent.value);

        result.push(newEvent);
    });

    result.sort((a, b) => a.startTime - b.startTime);

    return result;
}

function valueCalculator(event, currentTime)
{
    if (event.start == event.end) return event.start;
    if (event.startTime > currentTime) throw new Error('currentTime must bigger than startTime');
    if (event.endTime < currentTime) throw new Error('currentTime must smaller than endTime');

    let time2 = (currentTime - event.startTime) / (event.endTime - event.startTime);
    let time1 = 1 - time2;

    return event.start * time1 + event.end * time2;
}

function preCalcEventLayers(_eventLayers)
{
    if (_eventLayers.length <= 1) return _eventLayers;

    let eventLayers = _eventLayers.slice();

    for (let eventLayerIndex = eventLayers.length - 1; eventLayerIndex >= 0; eventLayerIndex--)
    {
        let eventLayer = eventLayers[eventLayerIndex];
        let nextEventLayer = eventLayers[eventLayerIndex - 1];

        if (!eventLayer) continue;
        if (!nextEventLayer) break;

        for (const name in eventLayer)
        {
            if (!nextEventLayer[name] || nextEventLayer[name].length <= 0)
            {
                nextEventLayer[name] = eventLayer[name];
                break;
            }

            eventLayer[name].forEach((event, eventIndex) =>
            {
                let isEventBroke = false;

                for (let nextEventIndex = 0, nextEventLength = nextEventLayer.length; nextEventIndex < nextEventLength; nextEventIndex++)
                {
                    let nextEvent = nextEventLayer[name][nextEventIndex];

                    if (event.endTime < nextEvent.startTime) continue;
                    if (event.startTime > nextEvent.endTime) break;

                    if (event.startTime < nextEvent.startTime)
                    {
                        nextEventLayer[name].splice(nextEventIndex, 0, {
                            startTime : event.startTime,
                            endTime   : nextEvent.startTime,
                            start     : event.start,
                            end       : valueCalculator(event, nextEvent.startTime)
                        });

                        event.start = valueCalculator(event, nextEvent.startTime);
                        event.startTime = nextEvent.startTime;

                        eventLayer[name][eventIndex] = event;

                        isEventBroke = true;
                    }

                    if (event.endTime > nextEvent.endTime)
                    {
                        nextEventLayer[name].splice(nextEventIndex + 1, 0, {
                            startTime : nextEvent.endTime,
                            endTime   : event.endTime,
                            start     : valueCalculator(event, nextEvent.endTime),
                            end       : event.end
                        });

                        event.end = valueCalculator(event, nextEvent.endTime);
                        event.endTime = nextEvent.endTime;

                        eventLayer[name][eventIndex] = event;

                        isEventBroke = true;
                    }
                }

                if (!isEventBroke)
                {
                    nextEventLayer[name].push(event);
                }
            });

            eventLayer[name].sort((a, b) => a.startTime - b.startTime);
            nextEventLayer[name].sort((a, b) => a.startTime - b.startTime);
        }

        

        eventLayers[eventLayerIndex] = eventLayer;
        eventLayers[eventLayerIndex - 1] = nextEventLayer;
    }

    return eventLayers;
}

function MergeEventLayer(_eventLayer, eventLayerIndex = -1, currentEvents)
{
    let result = currentEvents.slice();
    let eventLayer = _eventLayer.slice();
    
    if (eventLayerIndex <= 0)
    {
        eventLayer.forEach((event) =>
        {
            result.push(event);
        });
    }
    
    if (eventLayerIndex <= 0)
    {
        return result;
    }
    
    let basedEventEndValues = {};
    result
        .sort((a, b) => b.endTime - a.endTime)
        .forEach((event) =>
        {
            basedEventEndValues[event.endTime] = event.end;
        }
    );
    result.sort((a, b) => a.startTime - b.startTime);
    
    let _result = result.slice();
    let currentBasedEventEndValue = NaN;
    let currentAddedEventEndValue = NaN;
    let extraEventDeleteCount = 0;
    let eventIndexOffset = 0;
    
    for (let basedEventIndex = 0, basedEventLength = result.length; basedEventIndex < basedEventLength; basedEventIndex++)
    {
        let basedEvent = result[basedEventIndex];
        let hasProcessedEvent = false;

        if (extraEventDeleteCount > 0)
        {
            currentBasedEventEndValue = basedEvent.end;
            extraEventDeleteCount--;
            continue;
        }
        
        for (let addedEventIndex = 0, addedEventLength = eventLayer.length; addedEventIndex < addedEventLength; addedEventIndex++)
        {
            let addedEvent = eventLayer[addedEventIndex];
            
            if (addedEvent.endTime < basedEvent.startTime) continue;
            if (basedEvent.endTime < addedEvent.startTime) break;

            let basedEventGroup = [];
            let addedEventGroup = [];
            let addedResult = [];
            
            if (addedEvent.startTime >= basedEvent.startTime)
            {
                if (addedEvent.startTime != basedEvent.startTime)
                {
                    basedEventGroup.push(
                        {
                            startTime : basedEvent.startTime,
                            endTime   : addedEvent.startTime,
                            start     : basedEvent.start + (!isNaN(currentAddedEventEndValue) ? currentAddedEventEndValue : 0),
                            end       : valueCalculator(basedEvent, addedEvent.startTime) + (!isNaN(currentAddedEventEndValue) ? currentAddedEventEndValue : 0)
                        }
                    );
                }
            }
            else
            {
                basedEventGroup.push(
                    {
                        startTime : addedEvent.startTime,
                        endTime   : basedEvent.startTime,
                        start     : addedEvent.start + (!isNaN(currentBasedEventEndValue) ? currentBasedEventEndValue : 0),
                        end       : valueCalculator(addedEvent, basedEvent.startTime) + (!isNaN(currentBasedEventEndValue) ? currentBasedEventEndValue : 0)
                    }
                );
            }
            
            if (addedEvent.endTime <= basedEvent.endTime)
            {
                if (basedEvent.start != basedEvent.end && addedEvent.start != addedEvent.end)
                {
                    breakEvent(
                        {
                            startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                            endTime   : addedEvent.endTime,
                            start     : valueCalculator(basedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime),
                            end       : valueCalculator(basedEvent, addedEvent.endTime)
                        }
                    ).forEach((event) =>
                    {
                        basedEventGroup.push(event);
                    });
    
                    breakEvent(
                        {
                            startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                            endTime   : addedEvent.endTime,
                            start     : valueCalculator(addedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime),
                            end       : addedEvent.end
                        }
                    ).forEach((event) =>
                    {
                        addedEventGroup.push(event);
                    });
                }
                else
                {
                    basedEventGroup.push(
                        {
                            startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                            endTime   : addedEvent.endTime,
                            start     : valueCalculator(basedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime) + valueCalculator(addedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime),
                            end       : valueCalculator(basedEvent, addedEvent.endTime) + addedEvent.end
                        }
                    );
                }

                if (basedEvent.endTime != addedEvent.endTime)
                {
                    basedEventGroup.push(
                        {
                            startTime : addedEvent.endTime,
                            endTime   : basedEvent.endTime,
                            start     : valueCalculator(basedEvent, addedEvent.endTime) + addedEvent.end,
                            end       : basedEvent.end + addedEvent.end
                        }
                    );
                }
            }
            else
            {
                if (basedEvent.start != basedEvent.end && addedEvent.start != addedEvent.end)
                {
                    breakEvent(
                        {
                            startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                            endTime   : basedEvent.endTime,
                            start     : valueCalculator(basedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime),
                            end       : basedEvent.end
                        }
                    ).forEach((event) =>
                    {
                        basedEventGroup.push(event);
                    });
    
                    breakEvent(
                        {
                            startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                            endTime   : basedEvent.endTime,
                            start     : valueCalculator(addedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime),
                            end       : valueCalculator(addedEvent, basedEvent.endTime)
                        }
                    ).forEach((event) =>
                    {
                        addedEventGroup.push(event);
                    });
                }
                else
                {
                    basedEventGroup.push(
                        {
                            startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                            endTime   : basedEvent.endTime,
                            start     : valueCalculator(basedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime) + valueCalculator(addedEvent, addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime),
                            end       : basedEvent.end + valueCalculator(addedEvent, basedEvent.endTime)
                        }
                    );
                }

                let lastExtraEvent = basedEvent;
                for (let extraEventIndex = basedEventIndex + 1; extraEventIndex < basedEventLength; extraEventIndex++)
                {
                    let extraEvent = result[extraEventIndex];

                    if (extraEvent.endTime < addedEvent.startTime) continue;
                    if (addedEvent.endTime < extraEvent.startTime) break;

                    if (lastExtraEvent.endTime != extraEvent.startTime)
                    {
                        basedEventGroup.push(
                            {
                                startTime : lastExtraEvent.endTime,
                                endTime   : extraEvent.startTime,
                                start     : lastExtraEvent.end + valueCalculator(addedEvent, lastExtraEvent.endTime),
                                end       : lastExtraEvent.end + valueCalculator(addedEvent, extraEvent.startTime)
                            }
                        );
                    }

                    if (addedEvent.start != addedEvent.end && extraEvent.start != extraEvent.end)
                    {
                        breakEvent(
                            {
                                startTime : extraEvent.startTime,
                                endTime   : extraEvent.endTime <= addedEvent.endTime ? extraEvent.endTime : addedEvent.endTime,
                                start     : extraEvent.start,
                                end       : valueCalculator(extraEvent, extraEvent.endTime <= addedEvent.endTime ? extraEvent.endTime : addedEvent.endTime)
                            }
                        ).forEach((event) =>
                        {
                            basedEventGroup.push(event);
                        });
    
                        breakEvent(
                            {
                                startTime : extraEvent.startTime,
                                endTime   : extraEvent.endTime <= addedEvent.endTime ? extraEvent.endTime : addedEvent.endTime,
                                start     : valueCalculator(addedEvent, extraEvent.startTime),
                                end       : valueCalculator(addedEvent, extraEvent.endTime <= addedEvent.endTime ? extraEvent.endTime : addedEvent.endTime)
                            }
                        ).forEach((event) =>
                        {
                            addedEventGroup.push(event);
                        });
                    }
                    else
                    {
                        basedEventGroup.push(
                            {
                                startTime : extraEvent.startTime,
                                endTime   : extraEvent.endTime <= addedEvent.endTime ? extraEvent.endTime : addedEvent.endTime,
                                start     : extraEvent.start + valueCalculator(addedEvent, extraEvent.startTime),
                                end       : valueCalculator(extraEvent, extraEvent.endTime <= addedEvent.endTime ? extraEvent.endTime : addedEvent.endTime) + valueCalculator(addedEvent, extraEvent.endTime <= addedEvent.endTime ? extraEvent.endTime : addedEvent.endTime)
                            }
                        );
                    }

                    lastExtraEvent = extraEvent;
                    currentBasedEventEndValue = extraEvent.end;
                    extraEventDeleteCount++;
                }

                if (lastExtraEvent.endTime >= addedEvent.endTime)
                {
                    basedEventGroup.push(
                        {
                            startTime : addedEvent.endTime,
                            endTime   : lastExtraEvent.endTime,
                            start     : addedEvent.end + valueCalculator(lastExtraEvent, addedEvent.endTime),
                            end       : addedEvent.end + lastExtraEvent.end
                        }
                    );
                }
                else
                {
                    basedEventGroup.push(
                        {
                            startTime : lastExtraEvent.endTime,
                            endTime   : addedEvent.endTime,
                            start     : lastExtraEvent.end + valueCalculator(addedEvent, lastExtraEvent.endTime),
                            end       : lastExtraEvent.end + addedEvent.end
                        }
                    );
                }
            }

            if (basedEventGroup.length > 0 || addedEventGroup.length > 0)
            {
                basedEventGroup.sort((a, b) => a.startTime - b.startTime);
                addedEventGroup.sort((a, b) => a.startTime - b.startTime);

                addedResult = mergeEvents(basedEventGroup, addedEventGroup);
            }

            currentAddedEventEndValue = addedEvent.end;
            
            if (addedResult.length > 0)
            {
                _result.splice(basedEventIndex + eventIndexOffset, 1 + extraEventDeleteCount);
                addedResult.forEach((event, eventIndex) =>
                {
                    _result.splice(basedEventIndex + eventIndexOffset + eventIndex, 0, event);
                });
                eventLayer[addedEventIndex].isMerged = true;
                eventIndexOffset += addedResult.length - extraEventDeleteCount - 1;
                hasProcessedEvent = true;
                break;
            }
        }

        if (!hasProcessedEvent && !isNaN(currentAddedEventEndValue))
        {
            let currentEventIndex = basedEventIndex + eventIndexOffset < _result.length ? basedEventIndex + eventIndexOffset : _result.length - 1;
            _result[currentEventIndex].start += currentAddedEventEndValue;
            _result[currentEventIndex].end += currentAddedEventEndValue;
        }

        currentBasedEventEndValue = basedEvent.end;
    }

    for (const addedEvent of eventLayer)
    {
        if (!addedEvent.isMerged)
        {
            for (const basedEventEndTime in basedEventEndValues)
            {
                if (basedEventEndTime > addedEvent.startTime) continue;
                
                _result.push(
                    {
                        startTime : addedEvent.startTime,
                        endTime   : addedEvent.endTime,
                        start     : addedEvent.start + basedEventEndValues[basedEventEndTime],
                        end       : addedEvent.end + basedEventEndValues[basedEventEndTime]
                    }
                );
                break;
            }
        }
    }

    _result.sort((a, b) => a.startTime - b.startTime);
    result = _result.slice();
    
    return result;
    
    function breakEvent(event)
    {
        let result = [];
        let timeBetween = event.endTime - event.startTime;
        let valueBetween = event.end - event.start;

        if (!event)
        {
            return [];
        }

        for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
        {
            let timePercentStart = (timeIndex * calcBetweenTime) / timeBetween;
            let timePercentEnd = ((timeIndex + 1) * calcBetweenTime) / timeBetween;

            result.push({
                startTime: event.startTime + timeIndex * calcBetweenTime,
                endTime: (
                    timeIndex + 1 == timeCount && event.startTime + (timeIndex + 1) * calcBetweenTime != event.endTime ?
                    event.endTime : event.startTime + (timeIndex + 1) * calcBetweenTime
                ),
                start: event.start + valueBetween * timePercentStart,
                end: (
                    timeIndex + 1 == timeCount && event.start + valueBetween * timePercentEnd != event.end ?
                    event.end : event.start + valueBetween * timePercentEnd
                )
            });
        }

        return result;
    }

    function mergeEvents(basedEvents, addedEvents)
    {
        let result = [];

        basedEvents.forEach((basedEvent) =>
        {
            let eventMerged = false;

            for (let addedEvent of addedEvents)
            {
                if (addedEvent.startTime == basedEvent.startTime && addedEvent.endTime == basedEvent.endTime)
                {
                    result.push({
                        startTime : basedEvent.startTime,
                        endTime   : basedEvent.endTime,
                        start     : basedEvent.start + addedEvent.start,
                        end       : basedEvent.end + addedEvent.end
                    });
                    eventMerged = true;
                    break;
                }
            }

            if (!eventMerged) result.push(basedEvent);
        });

        result.sort((a, b) => a.startTime - b.startTime);

        return result.slice();
    }

    function arrangeEvents(events)
    {
        let oldEvents = events.slice();
        let newEvents = [{ // 以 1-1e6 开始
            startTime   : 0,
            endTime     : oldEvents[0] ? oldEvents[0].startTime : 0,
            start       : oldEvents[0] ? oldEvents[0].start : 0,
            end         : oldEvents[0] ? oldEvents[0].start : 0,
            isLongEvent : true
        }];
        
        oldEvents.push({ // 以 1e9 结束
            startTime   : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].endTime : 0,
            endTime     : 1e5,
            start       : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0,
            end         : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0,
            isLongEvent : true
        });
        
        // 保证时间连续性
        for (let oldEvent of oldEvents) {
            let lastNewEvent = newEvents[newEvents.length - 1];
            
            if (lastNewEvent.endTime > oldEvent.endTime)
            {
                // 忽略此分支
            }
            else if (lastNewEvent.endTime == oldEvent.startTime)
            {
                newEvents.push(oldEvent);
            }
            else if (lastNewEvent.endTime < oldEvent.startTime)
            {
                newEvents.push({
                    startTime   : lastNewEvent.endTime,
                    endTime     : oldEvent.startTime,
                    start       : lastNewEvent.end,
                    end         : lastNewEvent.end,
                    isLongEvent : true
                }, oldEvent);
            }
            else if (lastNewEvent.endTime > oldEvent.startTime)
            {
                newEvents.push({
                    startTime : lastNewEvent.endTime,
                    endTime   : oldEvent.endTime,
                    start     : (oldEvent.start * (oldEvent.endTime - lastNewEvent.endTime) + oldEvent.end * (lastNewEvent.endTime - oldEvent.startTime)) / (oldEvent.endTime - oldEvent.startTime),
                    end       : lastNewEvent.end
                });
            }
        }
        
        return newEvents.slice();
    }

    // 合并相同变化率事件
    function arrangeSameValueEvents(events)
    {
        let newEvents = [ events.shift() ];

        events.forEach((event) =>
        {
            let lastNewEvent = newEvents[newEvents.length - 1];
            let duration1 = lastNewEvent.endTime - lastNewEvent.startTime;
            let duration2 = event.endTime - event.startTime;
            
            if (event.startTime == event.endTime)
            {
                // 忽略此分支    
            }
            else if (
                lastNewEvent.isLongEvent === event.isLongEvent &&
                lastNewEvent.end == event.start &&
                (lastNewEvent.end - lastNewEvent.start) * duration2 == (event.end - event.start) * duration1
            )
            {
                lastNewEvent.endTime = event.endTime;
                lastNewEvent.end     = event.end;
            }
            else
            {
                newEvents.push(event);
            }
        });

        return newEvents.slice();
    }
}

function calculateRealTime(_bpmList, events)
{
    let bpmList = _bpmList.slice();
    let result = [];

    bpmList.sort((a, b) => b.startBeat - a.startBeat);

    events.forEach((event) =>
    {
        let newEvent = event;

        for (let bpmIndex = 0, bpmLength = bpmList.length; bpmIndex < bpmLength; bpmIndex++)
        {
            let bpm = bpmList[bpmIndex];

            if (bpm.startBeat > newEvent.endTime) continue;
            newEvent.endTime = Math.fround(bpm.startTime + (newEvent.endTime - bpm.startBeat) * bpm.beatTime);

            for (let nextBpmIndex = bpmIndex; nextBpmIndex < bpmLength; nextBpmIndex++)
            {
                let nextBpm = bpmList[nextBpmIndex];

                if (nextBpm.startBeat > newEvent.startTime) continue;
                newEvent.startTime = Math.fround(nextBpm.startTime + (newEvent.startTime - nextBpm.startBeat) * nextBpm.beatTime);
                break;
            }

            result.push(newEvent);
            break;
        }
    });

    return result;
}