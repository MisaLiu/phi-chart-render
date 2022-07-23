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

        if (event.easingType && (event.easingType !== 1 || forceLinear) && event.easingType <= Easing.length)
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
    if (event.startTime > currentTime) throw new Error('currentTime must bigger than startTime');

    let time2 = (currentTime - event.startTime) / (event.endTime - event.startTime);
    let time1 = 1 - time2;

    return event.start * time1 + event.end * time2;
}

function preCalcEventLayers(_eventLayers)
{
    if (_eventLayers.length <= 1) return _eventLayers;

    let eventLayers = _eventLayers.slice();

    for (let eventLayerIndex = eventLayers.length; eventLayerIndex > 0; eventLayerIndex--)
    {
        let eventLayer = eventLayers[eventLayerIndex];
        let nextEventLayer = eventLayers[eventLayerIndex - 1];

        for (const name in eventLayer)
        {
            if (!nextEventLayer[name] || nextEventLayer[name].length <= 0)
            {
                nextEventLayer[name] = eventLayer[name];
                break;
            }

            
        }

        eventLayers[eventLayerIndex] = eventLayer;
        eventLayers[eventLayerIndex - 1] = nextEventLayer;
    }


}

function MergeEventLayer(eventLayer, eventLayerIndex, currentEvents)
{
    let result = currentEvents.slice();

    eventLayer.forEach((addedEvent, addedEventIndex) =>
    {
        if (eventLayerIndex <= 0)
        {
            result.push(addedEvent);
            return;
        }

        let _result = result.slice();
        let extraDeleteEventCount = 0;
        let mergedLayer = false;

        for (let basedEventIndex = 0, baseEventsLength = result.length; basedEventIndex < baseEventsLength; basedEventIndex++)
        {
            let basedEvent = result[basedEventIndex];

            // 不处理完全不与其重叠的事件
            /*
            if (addedEvent.startTime < basedEvent.startTime) continue;
            if (addedEvent.endTime > basedEvent.startTime) continue;
            */
            if (addedEvent.startTime > basedEvent.endTime) continue;
            if (addedEvent.endTime < basedEvent.startTime) break;

            let basedEventGroup = [];
            let addedEventGroup = [];
            let addedResult = [];

            
            // 处理叠加事件开始时间在基础事件内/外
            if (addedEvent.startTime >= basedEvent.startTime)
            {
                breakEvent(addedEvent)
                    .forEach((event) =>
                    {
                        addedEventGroup.push(event);
                    }
                );
                
                if (addedEvent.startTime != basedEvent.startTime)
                {
                    basedEventGroup.push({
                        startTime : basedEvent.startTime,
                        endTime   : addedEvent.startTime,
                        start     : basedEvent.start,
                        end       : valueCalculator(basedEvent, addedEvent.startTime)
                    });
                }
            }
            else if (addedEvent.startTime < basedEvent.startTime)
            {
                breakEvent({
                    startTime : basedEvent.startTime,
                    endTime   : addedEvent.endTime,
                    start     : valueCalculator(addedEvent, basedEvent.startTime),
                    end       : addedEvent.endTime
                })
                    .forEach((event) =>
                    {
                        addedEventGroup.push(event);
                    }
                );

                basedEventGroup.push({
                    startTime : addedEvent.startTime,
                    endTime   : basedEvent.startTime,
                    start     : addedEvent.start,
                    end       : valueCalculator(addedEvent, basedEvent.startTime)
                });
            }

            // 处理叠加事件结束时间在基础事件时间内/外
            if (addedEvent.endTime <= basedEvent.endTime)
            {
                breakEvent({
                    startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                    endTime   : addedEvent.endTime,
                    start     : addedEvent.startTime >= basedEvent.startTime ? valueCalculator(basedEvent, addedEvent.startTime) : basedEvent.start,
                    end       : valueCalculator(basedEvent, addedEvent.endTime)
                }).forEach((event) =>
                {
                    basedEventGroup.push(event);
                });
                
                if (addedEvent.endTime != basedEvent.endTime)
                {
                    basedEventGroup.push({
                        startTime : addedEvent.endTime,
                        endTime   : basedEvent.endTime,
                        start     : valueCalculator(basedEvent, addedEvent.endTime),
                        end       : basedEvent.end
                    });
                }
            }
            else if (addedEvent.endTime > basedEvent.endTime)
            {
                breakEvent({
                    startTime : addedEvent.startTime >= basedEvent.startTime ? addedEvent.startTime : basedEvent.startTime,
                    endTime   : basedEvent.endTime,
                    start     : addedEvent.startTime >= basedEvent.startTime ? valueCalculator(basedEvent, addedEvent.startTime) : basedEvent.start,
                    end       : basedEvent.endTime
                }).forEach((event) =>
                {
                    basedEventGroup.push(event);
                });

                let lastExtraEvent = basedEvent;
                let gotExtraEvents = false;

                for (let extraEventIndex = basedEventIndex + 1; extraEventIndex < baseEventsLength; extraEventIndex++)
                {
                    let extraEvent = result[extraEventIndex];

                    if (extraEvent.startTime < addedEvent.startTime || extraEvent.endTime < addedEvent.startTime) continue;
                    if (extraEvent.startTime > addedEvent.endTime) break;

                    if (extraEvent.startTime < lastExtraEvent.endTime)
                    {
                        basedEventGroup.push({
                            startTime : lastExtraEvent.endTime,
                            endTime   : extraEvent.startTime,
                            start     : valueCalculator(addedEvent, lastExtraEvent.endTime),
                            end       : valueCalculator(addedEvent, extraEvent.startTime)
                        });
                    }

                    if (extraEvent.endTime <= addedEvent.endTime)
                    {
                        breakEvent(extraEvent)
                            .forEach((event) =>
                            {
                                basedEventGroup.push(event);
                            }
                        );
                    }
                    else
                    {
                        breakEvent({
                            startTime : extraEvent.startTime,
                            endTime   : addedEvent.endTime,
                            start     : extraEvent.start,
                            end       : valueCalculator(extraEvent, addedEvent.endTime)
                        }).forEach((event) =>
                            {
                                basedEventGroup.push(event);
                            }
                        );
                        
                        basedEventGroup.push({
                            startTime : addedEvent.endTime,
                            endTime   : extraEvent.endTime,
                            start     : valueCalculator(extraEvent, addedEvent.endTime),
                            end       : extraEvent.end
                        });
                    }
                    
                    lastExtraEvent = extraEvent;
                    gotExtraEvents = true;
                    extraDeleteEventCount++;
                }

                if (!gotExtraEvents)
                {
                    basedEventGroup.push({
                        startTime : basedEvent.endTime,
                        endTime   : addedEvent.endTime,
                        start     : valueCalculator(addedEvent, basedEvent.endTime),
                        end       : addedEvent.end
                    });
                }
            }
            

            /*
            if (addedEvent.startTime >= basedEvent.startTime && addedEvent.startTime <= basedEvent.endTime)
            {
                basedEventGroup.push({
                    startTime : basedEvent.startTime,
                    endTime   : addedEvent.startTime,
                    start     : basedEvent.start,
                    end       : valueCalculator(basedEvent, addedEvent.startTime)
                });

                breakEvent(addedEvent)
                    .forEach((event) =>
                    {
                        addedEventGroup.push(event);
                    }
                );

                // addedResult = separateEvent(basedEvent, addedEvent);

                if (addedEvent.endTime <= basedEvent.endTime)
                { // 叠加事件在基础事件的时间范围内

                    breakEvent({
                        startTime : addedEvent.startTime,
                        endTime   : addedEvent.endTime,
                        start     : valueCalculator(basedEvent, addedEvent.startTime),
                        end       : valueCalculator(basedEvent, addedEvent.endTime)
                    }).forEach((event) =>
                    {
                        basedEventGroup.push(event);
                    });
                    
                    if (addedEvent.endTime != basedEvent.endTime)
                    {
                        basedEventGroup.push({
                            startTime : addedEvent.endTime,
                            endTime   : basedEvent.endTime,
                            start     : valueCalculator(basedEvent, addedEvent.endTime),
                            end       : basedEvent.end
                        });
                    }

                }
                else if (addedEvent.endTime > basedEvent.endTime)
                { // 叠加事件的开始时间在基础事件时间范围内，结束时间在范围外

                    breakEvent({
                        startTime : addedEvent.startTime,
                        endTime   : basedEvent.endTime,
                        start     : valueCalculator(basedEvent, addedEvent.startTime),
                        end       : basedEvent.endTime
                    }).forEach((event) =>
                    {
                        basedEventGroup.push(event);
                    });

                    for (let extraEventIndex = basedEventIndex + 1; extraEventIndex < baseEventsLength; extraEventIndex++)
                    {
                        let extraEvent = result[extraEventIndex];

                        if (extraEvent.startTime > addedEvent.endTime) break;

                        if (extraEvent.endTime <= addedEvent.endTime)
                        {
                            breakEvent(extraEvent)
                                .forEach((event) =>
                                {
                                    basedEventGroup.push(event);
                                }
                            );
                        }
                        else
                        {
                            breakEvent({
                                startTime : extraEvent.startTime,
                                endTime   : addedEvent.endTime,
                                start     : extraEvent.start,
                                end       : valueCalculator(extraEvent, addedEvent.endTime)
                            }).forEach((event) =>
                                {
                                    basedEventGroup.push(event);
                                }
                            );

                            basedEventGroup.push({
                                startTime : addedEvent.endTime,
                                endTime   : extraEvent.endTime,
                                start     : valueCalculator(extraEvent, addedEvent.endTime),
                                end       : extraEvent.end
                            });
                        }
                        
                        extraDeleteEventCount++;
                    }
                }
            }
            */

            if (basedEventGroup.length > 0 && addedEventGroup.length > 0)
            {
                basedEventGroup.sort((a, b) => a.startTime - b.startTime);
                addedEventGroup.sort((a, b) => a.startTime - b.startTime);

                mergeEvents(basedEventGroup, addedEventGroup)
                    .forEach((event) =>
                    {
                        addedResult.push(event);
                    }
                );
            }

            if (addedResult.length >= 1)
            {
                mergedLayer = true;
                _result.splice(basedEventIndex, 1 + extraDeleteEventCount);
                addedResult.forEach((event, index) =>
                {
                    _result.splice(basedEventIndex + index, 0, event);
                });
                break;
            }
        }

        if (!mergedLayer) _result.push(addedEvent);

        result = _result.slice();
    });

    // 事件排序
    result.sort((a, b) => a.startTime - b.startTime);

    result.forEach((event, index) =>
    { // 事件去重
        let nextEvent = result[index + 1];
        if (!nextEvent) return;

        if (
            event.startTime == nextEvent.startTime &&
            event.endTime == nextEvent.endTime &&
            event.start == nextEvent.start &&
            event.end == nextEvent.end
        ) {
            result.splice(index, 1);
        }
    });
    
    // events 连续性保证，只保证第一层的就行了
    if (eventLayerIndex <= 0)
    {
        result = arrangeEvents(result);
    }

    // result = arrangeSameValueEvents(result);

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
            startTime : 0,
            endTime   : 0,
            start     : oldEvents[0] ? oldEvents[0].start : 0,
            end       : oldEvents[0] ? oldEvents[0].start : 0
        }];
        
        oldEvents.push({ // 以 1e9 结束
            startTime : 0,
            endTime   : 1e5,
            start     : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0,
            end       : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0
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
                    startTime : lastNewEvent.endTime,
                    endTime   : oldEvent.startTime,
                    start     : lastNewEvent.end,
                    end       : lastNewEvent.end
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