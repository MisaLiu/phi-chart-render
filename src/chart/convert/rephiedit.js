import Chart from '../index';
import Judgeline from '../judgeline';
import Note from '../note';

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

        // events 连续性保证，只保证第一层的就行了
        for (const name in judgeline.eventLayers[0])
        {
            judgeline.eventLayers[0][name] = arrangeEvents(judgeline.eventLayers[0][name]);
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
    const calcBetweenTime = 0.125;
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

function arrangeEvents(events)
{
    let result = [];

    result.push({
        startTime : 0,
        endTime   : events[0].startTime,
        start     : events[0].start,
        end       : events[0].start
    });

    events.forEach((event, eventIndex) =>
    {
        let preEvent = result[result.length - 1];

        if (event.startTime == preEvent.endTime)
        {
            result.push(event);
        }
        else if (event.startTime > preEvent.endTime)
        {
            result.push(
                {
                    startTime : preEvent.endTime,
                    endTime   : event.startTime,
                    start     : preEvent.end,
                    end       : preEvent.end
                },
                event
            );
        }
        else if (event.startTime < preEvent.endTime)
        {
            result.push({
                startTime : preEvent.endTime,
                endTime   : event.endTime,
                start     : (event.start * (event.endTime - preEvent.endTime) + event.end * (preEvent.endTime - event.startTime)) / (event.endTime - event.startTime),
                end       : preEvent.end
            });
        }
    });

    result.push({
        startTime : result[result.length - 1].endTime,
        endTime   : 1e5,
        start     : result[result.length - 1].end,
        end       : result[result.length - 1].end
    });

    return result.slice();
}

function separateSpeedEvent(event)
{
    const calcBetweenTime = 0.125;
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

function separateEvent(basedEvent, addedEvent)
{
    let result = [];

    if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime < basedEvent.startTime) return result;
    if (addedEvent.startTime > basedEvent.endTime && addedEvent.endTime > basedEvent.endTime) return result;

    if (basedEvent.startTime <= addedEvent.startTime && basedEvent.endTime >= addedEvent.endTime)
    { // 叠加事件在基础事件的时间范围内
        result.push({
            startTime: basedEvent.startTime,
            endTime: addedEvent.startTime,
            start: basedEvent.start,
            end: valueCalculator(basedEvent, addedEvent.startTime)
        });

        result.push({
            startTime: addedEvent.startTime,
            endTime: addedEvent.endTime,
            start: valueCalculator(basedEvent, addedEvent.startTime) + addedEvent.start,
            end: valueCalculator(basedEvent, addedEvent.endTime) + addedEvent.end
        });

        result.push({
            startTime: addedEvent.endTime,
            endTime: basedEvent.endTime,
            start: valueCalculator(basedEvent, addedEvent.endTime),
            end: basedEvent.end
        });
    }
    else if (basedEvent.startTime <= addedEvent.startTime && basedEvent.endTime < addedEvent.endTime)
    { // 叠加事件的开始时间在基础事件时间范围内，结束时间在范围外
        result.push({
            startTime: basedEvent.startTime,
            endTime: addedEvent.startTime,
            start: basedEvent.start,
            end: valueCalculator(basedEvent, addedEvent.startTime)
        });

        result.push({
            startTime: addedEvent.startTime,
            endTime: basedEvent.endTime,
            start: valueCalculator(basedEvent, addedEvent.startTime) + addedEvent.start,
            end: basedEvent.end + valueCalculator(addedEvent, basedEvent.endTime)
        });

        result.push({
            startTime: basedEvent.endTime,
            endTime: addedEvent.endTime,
            start: valueCalculator(addedEvent, basedEvent.endTime),
            end: addedEvent.end
        });
    }
    else if (basedEvent.startTime > addedEvent.startTime && basedEvent.endTime >= addedEvent.endTime)
    { // 叠加事件的开始时间在基础事件时间范围外，结束时间在范围内
        result.push({
            startTime: addedEvent.startTime,
            endTime: basedEvent.startTime,
            start: addedEvent.start,
            end: valueCalculator(addedEvent, basedEvent.startTime)
        });

        result.push({
            startTime: basedEvent.startTime,
            endTime: addedEvent.endTime,
            start: basedEvent.start + valueCalculator(addedEvent, basedEvent.startTime),
            end: valueCalculator(basedEvent, addedEvent.endTime) + addedEvent.end
        });

        result.push({
            startTime: addedEvent.endTime,
            endTime: basedEvent.endTime,
            start: valueCalculator(basedEvent, addedEvent.endTime),
            end: basedEvent.end
        });
    }
    else if (basedEvent.startTime > addedEvent.startTime && basedEvent.endTime < addedEvent.endTime)
    { // 叠加事件在基础事件的时间范围外
        result.push({
            startTime: addedEvent.startTime,
            endTime: basedEvent.startTime,
            start: addedEvent.start,
            end: valueCalculator(addedEvent, basedEvent.startTime)
        });

        result.push({
            startTime: basedEvent.startTime,
            endTime: basedEvent.endTime,
            start: valueCalculator(addedEvent, basedEvent.startTime) + basedEvent.start,
            end: valueCalculator(addedEvent, basedEvent.endTime) + basedEvent.end
        });

        result.push({
            startTime: basedEvent.endTime,
            endTime: addedEvent.endTime,
            start: valueCalculator(addedEvent, basedEvent.endTime),
            end: addedEvent.end
        });
    }

    return result;
}

function addEventsBefore(events, basedEventIndex, _addedResults)
{
    let addedResults = _addedResults.slice();
    let extraDeleteEventCount = 0;

    for (let extraIndex = basedEventIndex - 1; extraIndex >= 0; extraIndex--)
    {
        let extraEvent = events[extraIndex];

        if (extraEvent.endTime < addedResults[0].startTime && extraEvent.startTime < addedResults[0].startTime) break;

        let _events = separateEvent(extraEvent, addedResults[0]);

        if (_events.length >= 1)
        {
            addedResults.splice(addedResults.length - 1, 1);
            _events.forEach((_event) =>
            {
                addedResults.unshift(_event);
            });
            extraDeleteEventCount++;
        }
    }

    return {
        addedResults,
        extraDeleteEventCount
    };
}

function addEventsAfter(events, basedEventIndex, _addedResults)
{
    let addedResults = _addedResults.slice();
    let extraDeleteEventCount = 0;

    for (let extraIndex = basedEventIndex + 1, extraLength = events.length; extraIndex < extraLength; extraIndex++)
    {
        let extraEvent = events[extraIndex];

        if (extraEvent.startTime > addedResults[addedResults.length - 1].endTime && extraEvent.endTime > addedResults[addedResults.length - 1].endTime) break;

        let _events = separateEvent(extraEvent, addedResults[addedResults.length - 1]);
        if (_events.length >= 1)
        {
            addedResults.splice(addedResults.length - 1, 1);
            _events.forEach((_event) =>
            {
                addedResults.push(_event);
            });
            extraDeleteEventCount++;
        }
    }

    return {
        addedResults,
        extraDeleteEventCount
    };
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
            if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime < basedEvent.startTime) continue;
            if (addedEvent.startTime > basedEvent.endTime && addedEvent.endTime > basedEvent.endTime) break;

            let addedResult = [];

            if (addedEvent.startTime >= basedEvent.startTime && addedEvent.endTime <= basedEvent.endTime)
            { // 叠加事件在基础事件的时间范围内
                addedResult = separateEvent(basedEvent, addedEvent);
            }
            else if (addedEvent.startTime >= basedEvent.startTime && addedEvent.endTime > basedEvent.endTime)
            { // 叠加事件的开始时间在基础事件时间范围内，结束时间在范围外
                addedResult = separateEvent(basedEvent, addedEvent);
                let extraEventsInfo = addEventsAfter(result, basedEventIndex, addedResult);

                addedResult = extraEventsInfo.addedResults;
                extraDeleteEventCount += extraEventsInfo.extraDeleteEventCount;
            }
            else if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime <= basedEvent.endTime)
            { // 叠加事件的开始时间在基础事件时间范围外，结束时间在范围内
                addedResult = separateEvent(basedEvent, addedEvent);
                let extraEventsInfo = addEventsBefore(result, basedEventIndex, addedResult);
                
                addedResult = extraEventsInfo.addedResults;
                extraDeleteEventCount += extraEventsInfo.extraDeleteEventCount;
            }
            else if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime > basedEvent.endTime)
            { // 叠加事件在基础事件的时间范围外
                addedResult = separateEvent(basedEvent, addedEvent);

                let extraEventsInfoBefore = addEventsBefore(result, basedEventIndex, addedResult);
                extraDeleteEventCount += extraEventsInfoBefore.extraDeleteEventCount;

                let extraEventsInfoAfter = addEventsAfter(result, basedEventIndex, extraEventsInfoBefore.addedResults);
                extraDeleteEventCount += extraEventsInfoAfter.extraDeleteEventCount;
            }

            if (addedResult.length >= 1)
            {
                mergedLayer = true;
                _result.splice(addedEventIndex, 1 + extraDeleteEventCount);
                addedResult.forEach((event, index) =>
                {
                    _result.splice(addedEventIndex + index, 0, event);
                });
                break;
            }
        }

        if (!mergedLayer) _result.push(addedEvent);

        result = _result;
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
    
    return result;
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