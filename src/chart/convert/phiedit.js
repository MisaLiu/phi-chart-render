import Chart from '../index';
import Judgeline from '../judgeline';
import EventLayer from '../eventlayer';
import Note from '../note';
import utils from './utils';

const Easing = [
    pos => pos, //1
	pos => Math.sin(pos * Math.PI / 2), //2
	pos => 1 - Math.cos(pos * Math.PI / 2), //3
	pos => 1 - (pos - 1) ** 2, //4
	pos => pos ** 2, //5
	pos => (1 - Math.cos(pos * Math.PI)) / 2, //6
	pos => ((pos *= 2) < 1 ? pos ** 2 : -((pos - 2) ** 2 - 2)) / 2, //7
	pos => 1 + (pos - 1) ** 3, //8
	pos => pos ** 3, //9
	pos => 1 - (pos - 1) ** 4, //10
	pos => pos ** 4, //11
	pos => ((pos *= 2) < 1 ? pos ** 3 : ((pos - 2) ** 3 + 2)) / 2, //12
	pos => ((pos *= 2) < 1 ? pos ** 4 : -((pos - 2) ** 4 - 2)) / 2, //13
	pos => 1 + (pos - 1) ** 5, //14
	pos => pos ** 5, //15
	pos => 1 - 2 ** (-10 * pos), //16
	pos => 2 ** (10 * (pos - 1)), //17
	pos => Math.sqrt(1 - (pos - 1) ** 2), //18
	pos => 1 - Math.sqrt(1 - pos ** 2), //19
	pos => (2.70158 * pos - 1) * (pos - 1) ** 2 + 1, //20
	pos => (2.70158 * pos - 1.70158) * pos ** 2, //21
	pos => ((pos *= 2) < 1 ? (1 - Math.sqrt(1 - pos ** 2)) : (Math.sqrt(1 - (pos - 2) ** 2) + 1)) / 2, //22
	pos => pos < 0.5 ? (14.379638 * pos - 5.189819) * pos ** 2 : (14.379638 * pos - 9.189819) * (pos - 1) ** 2 + 1, //23
	pos => 1 - 2 ** (-10 * pos) * Math.cos(pos * Math.PI / .15), //24
	pos => 2 ** (10 * (pos - 1)) * Math.cos((pos - 1) * Math.PI / .15), //25
	pos => ((pos *= 11) < 4 ? pos ** 2 : pos < 8 ? (pos - 6) ** 2 + 12 : pos < 10 ? (pos - 9) ** 2 + 15 : (pos - 10.5) ** 2 + 15.75) / 16, //26
	pos => 1 - Easing[25](1 - pos), //27
	pos => (pos *= 2) < 1 ? Easing[25](pos) / 2 : Easing[26](pos - 1) / 2 + .5, //28
	pos => pos < 0.5 ? 2 ** (20 * pos - 11) * Math.sin((160 * pos + 1) * Math.PI / 18) : 1 - 2 ** (9 - 20 * pos) * Math.sin((160 * pos + 1) * Math.PI / 18) //29
];

export default function PhiEditChartConverter(_chart)
{
    let rawChart = _chart.split(/\r\n|\n\r/);
    let chart = new Chart();
    let chartSimple = {
        bpm: [],
        judgelines: [],
        _judgelines: {},
        notes: [],
        notesPerLine: {},
        sameTimeNoteCount: {},

        pushNote: function (note)
        {
            this.sameTimeNoteCount[floorNum(note.startTime)] = !this.sameTimeNoteCount[floorNum(note.startTime)] ? 1 : this.sameTimeNoteCount[floorNum(note.startTime)] + 1;
            if (!this.notesPerLine[note.lineId]) this.notesPerLine[note.lineId] = [];
            this.notesPerLine[note.lineId].push(note);
            this.notes.push(note);
        },

        pushEventToLine: function (lineId, eventName, event)
        {
            if (isNaN(lineId) || lineId < 0)
            {
                console.warn('Invalid line id: ' + lineId + ', ignored');
                return;
            }
            if (!this._judgelines[lineId]) this._judgelines[lineId] = new Judgeline({ id: lineId });
            if (this._judgelines[lineId].eventLayers.length < 1) this._judgelines[lineId].eventLayers.push(new EventLayer());
            if (!this._judgelines[lineId].eventLayers[0][eventName]) throw new Error('No such event type: ' + eventName);

            let events = this._judgelines[lineId].eventLayers[0][eventName];
            let lastEvent = events[events.length - 1];

            if (
                lastEvent &&
                lastEvent.startTime == event.startTime &&
                (
                    (
                        isNaN(lastEvent.endTime) &&
                        isNaN(event.endTime)
                    ) ||
                    (
                        !isNaN(lastEvent.endTime) &&
                        !isNaN(event.endTime) &&
                        lastEvent.endTime == event.endTime
                    )
                )
            ) {
                lastEvent.endTime = event.endTime;
                
                if (isNaN(parseFloat(event.value)))
                {
                    lastEvent.start = event.start;
                    lastEvent.end = event.end;
                }
                else
                {
                    lastEvent.value = event.value;
                }
            }
            else
            {
                events.push(event);
            }
        }
    };

    /*
    chartSimple.pushNote = chartSimple.pushNote.bind(chartSimple);
    chartSimple.pushEventToLine = chartSimple.pushEventToLine.bind(chartSimple);
    */
    
    if (!isNaN(rawChart[0])) chart.offset = parseFloat((parseFloat(rawChart.shift()) / 1000).toFixed(4)) - 0.175;
    else return null;

    rawChart.forEach((_command, commandIndex) =>
    {
        if (!_command) return;
        if (_command == '') return;
        if (_command.replace(/\s/g, '') == '') return;

        let command = _command.split(' ');

        for (let commandIndex = 1; commandIndex < command.length; commandIndex++)
        {
            command[commandIndex] = parseFloat(command[commandIndex]);
        }

        switch (command[0])
        {
            // bpm 列表
            case 'bp': {
                chartSimple.bpm.push({
                    startBeat : command[1] || 0,
                    bpm       : command[2] || 120
                });
                break;
            }
            // note
            case 'n1':
            { // tap
                chartSimple.pushNote({
                    type      : 1,
                    lineId    : !isNaN(command[1]) ? command[1] : -1,
                    startTime : command[2] || 0,
                    positionX : command[3] || 0,
                    isAbove   : command[4] == 1 ? true : false,
                    isFake    : command[5] == 1 ? true : false
                });
                break;
            }
            case 'n2':
            { // hold
                chartSimple.pushNote({
                    type      : 3,
                    lineId    : !isNaN(command[1]) ? command[1] : -1,
                    startTime : command[2] || 0,
                    endTime   : command[3] || (command[2] || 0),
                    positionX : command[4] || 0,
                    isAbove   : command[5] == 1 ? true : false,
                    isFake    : command[6] == 1 ? true : false
                });
                break;
            }
            case 'n3':
            { // flick
                chartSimple.pushNote({
                    type      : 4,
                    lineId    : !isNaN(command[1]) ? command[1] : -1,
                    startTime : command[2] || 0,
                    positionX : command[3] || 0,
                    isAbove   : command[4] == 1 ? true : false,
                    isFake    : command[5] == 1 ? true : false
                });
                break;
            }
            case 'n4':
            { // drag
                chartSimple.pushNote({
                    type      : 2,
                    lineId    : !isNaN(command[1]) ? command[1] : -1,
                    startTime : command[2] || 0,
                    positionX : command[3] || 0,
                    isAbove   : command[4] == 1 ? true : false,
                    isFake    : command[5] == 1 ? true : false
                });
                break;
            }
            // note 附加信息
            case '#':
            { // 速度
                chartSimple.notes[chartSimple.notes.length - 1].speed = !isNaN(command[1]) ? command[1] : 1;
                break;
            }
            case '&':
            { // 缩放
                chartSimple.notes[chartSimple.notes.length - 1].xScale = !isNaN(command[1]) ? command[1] : 1;
                break;
            }
            // 判定线事件相关
            case 'cv':
            { // speed
                chartSimple.pushEventToLine(command[1], 'speed', {
                    startTime : command[2] || 0,
                    endTime   : NaN,
                    value     : !isNaN(command[3]) ? command[3] / 7 : 1
                });
                break;
            }
            case 'cm':
            { // moveX & moveY
                chartSimple.pushEventToLine(command[1], 'moveX', {
                    startTime  : command[2] || 0,
                    endTime    : command[3] || (command[2] || 0),
                    start      : NaN,
                    end        : command[4] / 2048 - 0.5 || 0,
                    easingType : command[6] || 1
                });
                chartSimple.pushEventToLine(command[1], 'moveY', {
                    startTime  : command[2] || 0,
                    endTime    : command[3] || (command[2] || 0),
                    start      : NaN,
                    end        : command[5] / 1400 - 0.5 || 0,
                    easingType : command[6] || 1
                });
                break;
            }
            case 'cp':
            { // moveX & moveY（瞬时）
                chartSimple.pushEventToLine(command[1], 'moveX', {
                    startTime  : command[2] || 0,
                    endTime    : NaN,
                    start      : command[3] / 2048 - 0.5 || 0,
                    end        : command[3] / 2048 - 0.5 || 0,
                    easingType : 1
                });
                chartSimple.pushEventToLine(command[1], 'moveY', {
                    startTime  : command[2] || 0,
                    endTime    : NaN,
                    start      : command[4] / 1400 - 0.5 || 0,
                    end        : command[4] / 1400 - 0.5 || 0,
                    easingType : 1
                });
                break;
            }
            case 'cr':
            { // rotate
                chartSimple.pushEventToLine(command[1], 'rotate', {
                    startTime  : command[2] || 0,
                    endTime    : command[3] || (command[2] || 0),
                    start      : NaN,
                    end        : command[4] || 0,
                    easingType : command[5] || 1
                });
                break;
            }
            case 'cd':
            { // rotate（瞬时）
                chartSimple.pushEventToLine(command[1], 'rotate', {
                    startTime  : command[2] || 0,
                    endTime    : NaN,
                    start      : command[3] || 0,
                    end        : command[3] || 0,
                    easingType : 1
                });
                break;
            }
            case 'cf':
            { // alpha
                chartSimple.pushEventToLine(command[1], 'alpha', {
                    startTime  : command[2] || 0,
                    endTime    : command[3] || (command[2] || 0),
                    start      : NaN,
                    end        : command[4] || 0,
                    easingType : 1
                });
                break;
            }
            case 'ca':
            { // alpha（瞬时）
                chartSimple.pushEventToLine(command[1], 'alpha', {
                    startTime  : command[2] || 0,
                    endTime    : NaN,
                    start      : command[3] || 0,
                    end        : command[3] || 0,
                    easingType : 1
                });
                break;
            }
            default :
            {
                console.warn('Unsupported command: ' + command[0] + ', ignoring.\nAt line ' + (commandIndex + 2) + ':\n' + command.join(' '));
            }
        }
    });

    if (chartSimple.bpm.length <= 0)
    {
        chartSimple.bpm.push({
            startBeat : 0,
            endBeat   : 1e4,
            bpm       : 120
        });
    }

    chartSimple.bpm.sort((a, b) => a.startBeat - b.startBeat);

    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        chartSimple.bpm.forEach((bpm, index) =>
        {   

            bpm.endBeat = chartSimple.bpm[index + 1] ? chartSimple.bpm[index + 1].startBeat : 1e4;

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;
            bpm.endTime = currentBeatRealTime * (bpm.endBeat - bpmChangedBeat);

            bpmChangedBeat += (bpm.startBeat - bpmChangedBeat);
            
            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });
    }

    // note 和 bpm 按时间排序
    chartSimple.bpm.sort((a, b) => b.startBeat - a.startBeat);
    for (const lineId in chartSimple.notesPerLine)
    {
        chartSimple.notesPerLine[lineId].sort((a, b) => a.startTime - b.startTime);
    }

    for (const lineId in chartSimple._judgelines)
    {
        let judgeline = chartSimple._judgelines[lineId];

        judgeline.sortEvent();

        // 事件参数补齐
        judgeline.eventLayers[0].alpha.forEach((event, eventIndex, array) =>
        {
            if (isNaN(event.endTime)) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e5;
            if (isNaN(event.start)) event.start = eventIndex > 0 ? array[eventIndex - 1].end : 0;
        });
        judgeline.eventLayers[0].moveX.forEach((event, eventIndex, array) =>
        {
            if (isNaN(event.endTime)) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e5;
            if (isNaN(event.start)) event.start = eventIndex > 0 ? array[eventIndex - 1].end : 0;
        });
        judgeline.eventLayers[0].moveY.forEach((event, eventIndex, array) =>
        {
            if (isNaN(event.endTime)) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e5;
            if (isNaN(event.start)) event.start = eventIndex > 0 ? array[eventIndex - 1].end : 0;
        });
        judgeline.eventLayers[0].rotate.forEach((event, eventIndex, array) =>
        {
            if (isNaN(event.endTime)) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e5;
            if (isNaN(event.start)) event.start = eventIndex > 0 ? array[eventIndex - 1].end / (Math.PI / 180) : 0;

            event.start = event.start * (Math.PI / 180);
            event.end = event.end * (Math.PI / 180);
        });
        judgeline.eventLayers[0].speed.forEach((event, eventIndex, array) =>
        {
            if (isNaN(event.endTime)) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e5;
        });

        // Alpha 事件单独进行计算
        judgeline.eventLayers[0].alpha.forEach((event) =>
        {
            let noNoteSetsVisibleTime = true;

            if (event.start == -1) event.start = -255;
            else if (event.start == -2) event.start = -510;
            else if (event.start < -100 && event.start >= -1000)
            {
                for (let eventCountIndex = 0, eventCountLength = Math.ceil((event.endTime - event.startTime) / utils.CalcBetweenTime); eventCountIndex < eventCountLength; eventCountIndex++)
                {
                    let currentTime = (event.startTime + (eventCountIndex * utils.CalcBetweenTime)) >= event.endTime ? event.endTime : (event.startTime + (eventCountIndex * utils.CalcBetweenTime));
                    let currentEventValue = utils.valueCalculator(event, Easing, currentTime);
                    let visibleBeat = ((currentEventValue + 100) * -1) / 10;

                    if (currentEventValue >= -100) break;

                    for (const note of chartSimple.notesPerLine[lineId])
                    {
                        if (note.startTime < currentTime) continue;
                        if (note.startTime > currentTime) break;

                        note.visibleBeat = visibleBeat;
                        noNoteSetsVisibleTime = false;
                    }
                }

                event.start = noNoteSetsVisibleTime ? -255 : 0;
            }

            if (event.end == -1) event.end = -255;
            else if (event.end == -2) event.end = -510;
            else if (event.end < -100) event.end = noNoteSetsVisibleTime ? -255 : 0;

            event.start = event.start / 255;
            event.end = event.end / 255;
        });

        // 拆分缓动
        for (const name in judgeline.eventLayers[0])
        {
            if (name == 'speed' || !(judgeline.eventLayers[0][name] instanceof Array)) continue;
            
            let newEvents = [];
            judgeline.eventLayers[0][name].forEach((event) =>
            {
                utils.calculateEventEase(event, Easing)
                    .forEach((newEvent) =>
                    {
                        newEvents.push(newEvent);
                    }
                );
            });
            judgeline.eventLayers[0][name] = newEvents;
        }
        
        // 合并相同变化量事件
        /*
        for (const name in judgeline.eventLayers[0])
        {
            if (name != 'speed' && (judgeline.eventLayers[0][name] instanceof Array))
            {
                judgeline.eventLayers[0][name] = utils.arrangeSameValueEvent(judgeline.eventLayers[0][name]);
            }
        }
        judgeline.eventLayers[0].speed = utils.arrangeSameSingleValueEvent(judgeline.eventLayers[0].speed);
        */

        // 计算事件真实时间
        for (const name in judgeline.eventLayers[0])
        {
            if (!(judgeline.eventLayers[0][name] instanceof Array)) continue;
            judgeline.eventLayers[0][name] = utils.calculateRealTime(chartSimple.bpm, judgeline.eventLayers[0][name]);
        }

        judgeline.sortEvent();
        judgeline.calcFloorPosition();
    };

    for (const lineId in chartSimple.notesPerLine)
    {
        let notes = chartSimple.notesPerLine[lineId];

        // 计算 Note 高亮
        notes.forEach((note) =>
        {
            if (chartSimple.sameTimeNoteCount[floorNum(note.startTime)] > 1) note.isMulti = true;
        });

        notes = calculateRealVisibleTime(chartSimple.bpm, notes);
        notes = utils.calculateRealTime(chartSimple.bpm, notes);
        notes.sort((a, b) => a.startTime - b.startTime);

        notes.forEach((note, noteIndex) =>
        {
            let judgeline = chartSimple._judgelines[note.lineId];

            if (!judgeline)
            {
                console.warn('Judgeline ' + note.lineId + ' doesn\'t exist, ignoring.');
                return;
            }

            {  // 计算 Note 的 floorPosition
                let noteStartSpeedEvent = judgeline.getFloorPosition(note.startTime);
                note.floorPosition = noteStartSpeedEvent ? noteStartSpeedEvent.floorPosition + noteStartSpeedEvent.value * (note.startTime - noteStartSpeedEvent.startTime) : 0;

                if (note.type == 3)
                {
                    let noteEndSpeedEvent = judgeline.getFloorPosition(note.endTime);
                    note.holdLength = (noteEndSpeedEvent ? noteEndSpeedEvent.floorPosition + noteEndSpeedEvent.value * (note.endTime - noteEndSpeedEvent.startTime) : 0) - note.floorPosition;
                }
                else
                {
                    note.holdLength = 0;
                }
            }

            // 推送 Note
            chart.notes.push(new Note({
                id            : noteIndex,
                type          : note.type,
                time          : note.startTime,
                holdTime      : note.endTime - note.startTime,
                speed         : note.speed,
                isAbove       : note.isAbove,
                isMulti       : note.isMulti,
                isFake        : note.isFake,
                positionX     : note.positionX * 9 / 1024,
                floorPosition : note.floorPosition,
                holdLength    : note.holdLength,
                xScale        : note.xScale,
                visibleTime   : note.visibleTime,
                judgeline     : judgeline
            }));
        });
    }

    for (const lineId in chartSimple._judgelines)
    {
        chart.judgelines.push(chartSimple._judgelines[lineId]);
    }

    chart.judgelines.sort((a, b) => a.id - b.id);
    chart.notes.sort((a, b) => a.time - b.time);

    chart.bpmList = utils.calculateHoldBetween(chartSimple.bpm);

    return chart;
}


function floorNum(num)
{
    return Math.floor(num * 8);
    // return Math.floor(num * (10 ** n)) / (10 ** n);
}

function calculateRealVisibleTime(_bpmList, _notes)
{
    let bpmList = _bpmList.slice();
    let notes = _notes.slice();

    notes.forEach((note) =>
    {
        if (!note.visibleBeat) return;

        for (let bpmIndex = 0, bpmLength = bpmList.length; bpmIndex < bpmLength; bpmIndex++)
        {
            let bpm = bpmList[bpmIndex];

            if (bpm.startBeat > note.visibleBeat) continue;
            note.visibleTime = note.visibleBeat * bpm.beatTime;

            break;
        }
    });

    return notes;
}