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

window.Easing = Easing;

export default function RePhiEditChartConverter(_chart)
{
    let chart = new Chart();
    let rawChart = convertChartFormat(_chart);

    chart.offset = rawChart.META.offset / 1000;

    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        rawChart.BPMList.forEach((bpm) =>
        {   
            bpm.startBeat = bpm.startTime[0] + bpm.startTime[1] / bpm.startTime[2];

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;

            bpmChangedBeat += (bpm.startBeat - bpmChangedBeat);
            
            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });

        console.log(rawChart.BPMList);
    }

    // Beat 数组转换为小数
    rawChart.judgeLineList.forEach((judgeline) =>
    {
        judgeline.eventLayers.forEach((eventLayer) =>
        {
            for (const name in eventLayer)
            {
                eventLayer[name] = beat2Time(eventLayer[name]);
            }
        });
    });

    // 拆分缓动
    rawChart.judgeLineList.forEach((judgeline) =>
    {
        judgeline.eventLayers.forEach((eventLayer) =>
        {
            let newEevents = {};

            for (const name in eventLayer)
            {
                if (!newEevents[name]) newEevents[name] = [];
                eventLayer[name].forEach((event) =>
                {
                    calculateEventEase(event)
                        .forEach((event) =>
                        {
                            newEevents[name].push(event);
                        }
                    );
                });
            }

            console.log(newEevents);
            eventLayer = newEevents;
        });
    });

    // 多层 EventLayer 叠加
    rawChart.judgeLineList.forEach((judgeline) =>
    {
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
            }
        });

        judgeline.event = finalEvent;
        // console.log(finalEvent);
    });

    console.log(rawChart);


    return chart;
}

function convertChartFormat(rawChart)
{
    let chart = JSON.parse(JSON.stringify(rawChart));

    switch (chart.META.RPEVersion)
    {
        case 100:
        {
            break;
        }
        default :
        {
            throw new Error('Unsupported chart version: ' + chart.META.RPEVersion);
        }
    }

    return JSON.parse(JSON.stringify(chart));
}

function beat2Time(event)
{
    event.forEach((e) =>
    {
        e.startTime = e.startTime[0] + e.startTime[1] / e.startTime[2];
        e.endTime = e.endTime[0] + e.endTime[1] / e.endTime[2];
    });
    return event;
}

function calculateEventEase(event)
{
    const calcBetweenTime = 0.0625;
    let result = [];
    let timeBetween = event.endTime - event.startTime;
    let valueBetween = event.end - event.start;

    for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
    {
        let timePercentStart = (timeIndex * calcBetweenTime) / timeBetween;
        let timePercentEnd = ((timeIndex + 1) * calcBetweenTime) / timeBetween;

        if (event.easingType && event.easingType !== 1)
        {
            result.push({
                startTime: event.startTime + timeIndex * calcBetweenTime,
                endTime: (
                    timeIndex + 1 == timeCount && event.startTime + (timeIndex + 1) * calcBetweenTime != event.endTime ?
                    event.endTime : event.startTime + (timeIndex + 1) * calcBetweenTime
                ),
                start: event.start + valueBetween * Easing[event.easingType - 1](timePercentStart),
                end: (
                    timeIndex + 1 == timeCount && event.start + valueBetween * Easing[event.easingType - 1](timePercentEnd) != event.end ?
                    event.end : event.start + valueBetween * Easing[event.easingType - 1](timePercentEnd)
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
    let addedResults = JSON.parse(JSON.stringify(_addedResults));
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
    let addedResults = JSON.parse(JSON.stringify(_addedResults));
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
    let result = JSON.parse(JSON.stringify(currentEvents));

    eventLayer.forEach((addedEvent, addedEventIndex) =>
    {
        if (eventLayerIndex <= 0)
        {
            result.push(addedEvent);
            return;
        }

        let _result = JSON.parse(JSON.stringify(result));
        let extraDeleteEventCount = 0;
        let mergedLayer = false;

        for (let basedEventIndex = 0, baseEventsLength = result.length; basedEventIndex < baseEventsLength; basedEventIndex++)
        {
            let basedEvent = result[basedEventIndex];

            // 不处理完全不与其重叠的事件
            if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime < basedEvent.startTime) continue;
            if (addedEvent.startTime > basedEvent.endTime && addedEvent.endTime > basedEvent.endTime) continue;

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

        result = JSON.parse(JSON.stringify(_result));
    });

    result.sort((a, b) => a.startTime - b.startTime);

    result.forEach((event, index) =>
    { // 去除 startTime == endTime 且 start == end 的事件 
        if (
            event.startTime == event.endTime &&
            event.start == event.end
        ) {
            result.splice(index, 1);
        }
    });

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
            console.log(event);
            console.log(nextEvent);
            result.splice(index, 1);
        }
    });

    return result;
}