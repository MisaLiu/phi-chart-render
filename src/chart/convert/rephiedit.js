import { number as verifyNum } from '@/verify';
import Chart from '../index';
import Judgeline from '../judgeline';
import EventLayer from '../eventlayer';
import Note from '../note';
import utils from './utils';
import { utils as PIXIutils } from 'pixi.js-legacy';

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

export default function RePhiEditChartConverter(_chart)
{
    let notes = [];
    let sameTimeNoteCount = {};
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
        let judgeline = new Judgeline({
            id         : judgelineIndex,
            texture    : _judgeline.Texture != 'line.png' ? _judgeline.Texture : null,
            parentLine : _judgeline.father >= 0 ? _judgeline.father : null,
            zIndex     : _judgeline.zOrder,
            isCover    : _judgeline.isCover == 1
        });

        if (_judgeline.attachUI && _judgeline.attachUI != '')
        {
            console.warn('Line ' + judgelineIndex + ' is using \'attachUI\' feature, ignored this line.\nPlease note that all notes on this line will also be ignored.');
            return;
        }

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
                event.value = event.value / (0.6 / (120 / 900));
            });
            eventLayer.moveX.forEach((event) =>
            {
                event.start = event.start / 1350;
                event.end = event.end / 1350;
            });
            eventLayer.moveY.forEach((event) =>
            {
                event.start = event.start / 900;
                event.end = event.end / 900;
            });
            eventLayer.alpha.forEach((event) =>
            {
                event.start = event.start / 255;
                event.end = event.end / 255;

                event.start = event.start > 1 ? 1 : event.start;
                event.end = event.end > 1 ? 1 : event.end;

                event.start = event.start < -1 ? -1 : event.start;
                event.end = event.end < -1 ? -1 : event.end;
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

                utils.calculateEventsBeat(_judgeline.extended.textEvents)
                    .forEach((event) =>
                    {
                        calculateTextEventEase(event)
                            .forEach((newEvent) =>
                            {
                                judgeline.extendEvent.text.push(newEvent);
                            }
                        );
                    }
                );

                judgeline.extendEvent.text.forEach((event, eventIndex) =>
                {
                    if (isNaN(event.endTime))
                    {
                        event.endTime = judgeline.extendEvent.text[eventIndex + 1] ? judgeline.extendEvent.text[eventIndex + 1].startTime : 100;
                    }
                });
                judgeline.extendEvent.text = utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.text);
            }

            if (_judgeline.extended.scaleXEvents && _judgeline.extended.scaleXEvents.length > 0)
            {
                utils.calculateEventsBeat(_judgeline.extended.scaleXEvents)
                    .forEach((event) =>
                    {
                        utils.calculateEventEase(event, Easing)
                            .forEach((newEvent) =>
                            {
                                judgeline.extendEvent.scaleX.push(newEvent);
                            }
                        );
                    }
                );
                judgeline.extendEvent.scaleX = utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.scaleX);
            }

            if (_judgeline.extended.scaleYEvents && _judgeline.extended.scaleYEvents.length > 0)
            {
                utils.calculateEventsBeat(_judgeline.extended.scaleYEvents)
                    .forEach((event) =>
                    {
                        utils.calculateEventEase(event, Easing)
                            .forEach((newEvent) =>
                            {
                                /*
                                if (!judgeline.texture && !judgeline.isText)
                                {
                                    newEvent.start = newEvent.start * 0.664285;
                                    newEvent.end   = newEvent.end * 0.664285;
                                }
                                */

                                judgeline.extendEvent.scaleY.push(newEvent);
                            }
                        );
                    }
                );
                judgeline.extendEvent.scaleY = utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.scaleY);
            }

            if (_judgeline.extended.colorEvents && _judgeline.extended.colorEvents.length > 0)
            {
                utils.calculateEventsBeat(_judgeline.extended.colorEvents)
                    .forEach((event) =>
                    {
                        calculateColorEventEase(event)
                            .forEach((newEvent) =>
                            {
                                judgeline.extendEvent.color.push(newEvent);
                            }
                        );
                    }
                );
                judgeline.extendEvent.color = utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.color);
            }

            if (_judgeline.extended.inclineEvents && _judgeline.extended.inclineEvents.length > 0)
            {
                let inclineEvents = utils.calculateEventsBeat(_judgeline.extended.inclineEvents);

                if (inclineEvents.length == 1 &&
                    (inclineEvents[0].startTime == 0 && inclineEvents[0].endTime == 1) &&
                    (inclineEvents[0].start == 0 && inclineEvents[0].end == 0)
                ) { /* Do nothing */ }
                else {
                    inclineEvents.forEach((event) =>
                    {
                        utils.calculateEventEase(event, Easing)
                            .forEach((newEvent) =>
                            {
                                newEvent.start = (Math.PI / 180) * newEvent.start;
                                newEvent.end = (Math.PI / 180) * newEvent.end;

                                judgeline.extendEvent.incline.push(newEvent);
                            }
                        );
                    });
                    judgeline.extendEvent.incline = utils.calculateRealTime(rawChart.BPMList, judgeline.extendEvent.incline);
                }
            }
        }

        judgeline.noteControls.alpha = calculateNoteControls(_judgeline.alphaControl, 'alpha', 1);
        judgeline.noteControls.scale = calculateNoteControls(_judgeline.sizeControl, 'size', 1);
        judgeline.noteControls.x = calculateNoteControls(_judgeline.posControl, 'pos', 1);
        // judgeline.noteControls.y = calculateNoteControls(_judgeline.yControl, 'y', 1);

        // 事件排序并计算 floorPosition
        judgeline.sortEvent();
        judgeline.calcFloorPosition();

        // 计算 Note 真实时间
        _judgeline.notes = utils.calculateEventsBeat(_judgeline.notes ? _judgeline.notes : []);
        _judgeline.notes.sort((a, b) => a.startTime - b.startTime);
        _judgeline.notes.forEach((note, noteIndex) =>
        {
            sameTimeNoteCount[note.startTime] = !sameTimeNoteCount[note.startTime] ? 1 : sameTimeNoteCount[note.startTime] + 1;

            note.id = noteIndex;
            note.judgeline = judgeline;

            notes.push(note);
        });;
        // _judgeline.notes = utils.calculateRealTime(rawChart.BPMList, _judgeline.notes);
        
        /*
        _judgeline.notes.forEach((_note, noteIndex) =>
        {
            
        });
        */

        chart.judgelines.push(judgeline);
    });

    // 计算 Note 高亮
    notes.forEach((note) =>
    {
        if (sameTimeNoteCount[note.startTime] > 1) note.isMulti = true;
    });

    notes = utils.calculateRealTime(rawChart.BPMList, notes);
    notes.forEach((note) =>
    {
        // 计算 Note 的 floorPosition
        let noteStartSpeedEvent = note.judgeline.getFloorPosition(note.startTime);
        note.floorPosition = noteStartSpeedEvent ? noteStartSpeedEvent.floorPosition + noteStartSpeedEvent.value * (note.startTime - noteStartSpeedEvent.startTime) : 0;

        if (note.type == 2)
        {
            let noteEndSpeedEvent = note.judgeline.getFloorPosition(note.endTime);
            note.holdLength = (noteEndSpeedEvent ? noteEndSpeedEvent.floorPosition + noteEndSpeedEvent.value * (note.endTime - noteEndSpeedEvent.startTime) : 0) - note.floorPosition;
        }
        else
        {
            note.holdLength = 0;
        }

        // 推送 Note
        chart.notes.push(new Note({
            id            : note.id,
            type          : (
                note.type == 1 ? 1 :
                note.type == 2 ? 3 :
                note.type == 3 ? 4 :
                note.type == 4 ? 2 : 1
            ),
            time          : note.startTime,
            holdTime      : note.endTime - note.startTime,
            speed         : note.speed,
            floorPosition : note.floorPosition,
            holdLength    : note.holdLength,
            positionX     : (note.positionX / (670 * (9 / 80))),
            basicAlpha    : note.alpha / 255,
            visibleTime   : note.visibleTime < 999999 ? note.visibleTime : NaN,
            yOffset       : (note.yOffset / 900),
            xScale        : note.size,
            isAbove       : note.above == 1 ? true : false,
            isMulti       : note.isMulti,
            isFake        : note.isFake == 1 ? true : false,
            judgeline     : note.judgeline
        }));
    });

    chart.judgelines.sort((a, b) => a.id - b.id);
    chart.notes.sort((a, b) => a.time - b.time);

    chart.judgelines.forEach((judgeline, judgelineIndex, judgelines) =>
    {
        if (judgeline.parentLine && judgeline.parentLine > 0)
        {
            let parentLineId = judgeline.parentLine;
            judgeline.parentLine = null;

            for (const parentLine of judgelines)
            {
                if (parentLine.id == parentLineId)
                {
                    judgeline.parentLine = parentLine;
                    break;
                }
            }
        }
        else judgeline.parentLine = null;
    });

    chart.bpmList = utils.calculateHoldBetween(rawChart.BPMList);

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
    let timeBetween = event.endTime - event.startTime;
    let result = [];

    if (!event) return [];

    if (event.start != event.end)
    {
        if (event.start == '')
        {
            let currentText = [];
            let lastTextIndex = -1;

            for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
            {
                let currentTime = event.startTime + (timeIndex * calcBetweenTime);
                let nextTime = (event.startTime + ((timeIndex + 1) * calcBetweenTime)) <= event.endTime ? event.startTime + ((timeIndex + 1) * calcBetweenTime) : event.endTime;
                let currentTextIndex = Math.floor(_valueCalculator(event, nextTime, 0, event.end.length - 1));

                if (lastTextIndex + 1 < currentTextIndex)
                {
                    for (let extraTextIndex = lastTextIndex + 1; extraTextIndex < currentTextIndex; extraTextIndex++)
                    {
                        currentText.push(event.end[extraTextIndex]);
                    }
                }
                else if (lastTextIndex + 1 > currentTextIndex)
                {
                    currentText.length = currentTextIndex;
                }

                if (event.end[currentTextIndex]) currentText.push(event.end[currentTextIndex]);

                result.push({
                    startTime : currentTime,
                    endTime   : nextTime,
                    value     : currentText.join('')
                });

                lastTextIndex = currentTextIndex;
            }
        }
        else
        {
            result.push({
                startTime : event.startTime,
                endTime   : event.endTime,
                value     : event.start
            });
            result.push({
                startTime : event.endTime,
                endTime   : NaN,
                value     : event.end
            });
        }
    }
    else
    {
        result.push({
            startTime : event.startTime,
            endTime   : event.endTime,
            value     : event.start
        });
    }

    return result;
}

function calculateColorEventEase(event)
{
    let timeBetween = event.endTime - event.startTime;
    let result = [];

    if (!event) return [];

    if (
        event.start[0] != event.end[0] ||
        event.start[1] != event.end[1] ||
        event.start[2] != event.end[2]
    ) {
        for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
        {
            let currentTime = event.startTime + (timeIndex * calcBetweenTime);
            let nextTime = (event.startTime + ((timeIndex + 1) * calcBetweenTime)) <= event.endTime ? event.startTime + ((timeIndex + 1) * calcBetweenTime) : event.endTime;

            result.push({
                startTime : currentTime,
                endTime   : nextTime,
                value     : PIXIutils.rgb2hex([
                    Math.round(_valueCalculator(event, nextTime, event.start[0], event.end[0])) / 255,
                    Math.round(_valueCalculator(event, nextTime, event.start[1], event.end[1])) / 255,
                    Math.round(_valueCalculator(event, nextTime, event.start[2], event.end[2])) / 255
                ])
            });
        }
    }
    else
    {
        result.push({
            startTime : event.startTime,
            endTime   : event.endTime,
            value     : PIXIutils.rgb2hex([
                event.start[0] / 255,
                event.start[1] / 255,
                event.start[2] / 255
            ])
        });
    }

    return result;
}

function calculateNoteControls(_noteControls, valueName = 'alpha', defaultValue = 1)
{
    if (!_noteControls || !(_noteControls instanceof Array) || _noteControls.length <= 0) return [];
    if (
        _noteControls.length == 2 &&
        (_noteControls[0].x == 0 && _noteControls[1].x >= 10000) &&
        (_noteControls[0][valueName] == defaultValue && _noteControls[1][valueName] == defaultValue)
    ) { return [] };

    let noteControls = _noteControls.slice().sort((a, b) => b.x - a.x);
    let result = [];

    for (let controlIndex = 0; controlIndex < noteControls.length; controlIndex++)
    {
        const control = noteControls[controlIndex];
        const nextControl = noteControls[controlIndex + 1];

        result = [ ...result, ...separateNoteControl(control, nextControl, valueName) ];
    }

    result = arrangeSameValueControls(result);
    if (result[0].y < 10000) result.unshift({ y: 9999999, value: result[0].value });

    return result;

    function arrangeSameValueControls(controls)
    {
        let result = [];

        for (const control of controls)
        {
            if (result.length > 0 && result[result.length - 1].value == control.value)
            {
                continue;
            }

            result.push(control);
        }

        return result.slice();
    }

    function separateNoteControl(control, nextControl = null, valueName = 'alpha')
    {
        let result = [];
        let xBetween = control.x - (nextControl ? nextControl.x : 0);
        let valueBetween = control[valueName] - (nextControl ? nextControl[valueName] : control[valueName]);
        let easingFunc = Easing[control.easing - 1];
        let currentX = control.x;

        if (control[valueName] == (nextControl ? nextControl[valueName] : control[valueName]))
        {
            return [ { y: control.x, value: control[valueName] } ];
        }

        while (currentX > (nextControl ? nextControl.x : 0))
        {
            let currentPercent = (control.x - currentX) / xBetween;
            let currentValue = parseFloat((control[valueName] - valueBetween * easingFunc(currentPercent)).toFixed(2));

            if (result.length > 0 && parseFloat((result[result.length - 1].value).toFixed(2)) == currentValue)
            {
                result[result.length - 1].y = currentX;
            }
            else
            {
                result.push({
                    y     : currentX,
                    value : currentValue
                });
            }

            currentX -= 2;
        }

        if (result[result.length - 1].value != (nextControl ? nextControl[valueName] : control[valueName]))
        {
            result.push({
                y     : (nextControl ? nextControl.x : 0),
                value : (nextControl ? nextControl[valueName] : control[valueName])
            });
        }

        return result;
    }
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
            startTime : event.startTime,
            endTime   : event.endTime,
            value     : event.start
        });
    }

    return result;
}

function _valueCalculator(event, currentTime, startValue = 0, endValue = 1)
{
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