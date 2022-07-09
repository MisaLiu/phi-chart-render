import Chart from '../index';
import Judgeline from '../judgeline';
import Note from '../note';

const Easing = [
    pos => pos, //0
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
	pos => 1 - Easing[26](1 - pos), //27
	pos => (pos *= 2) < 1 ? Easing[26](pos) / 2 : Easing[27](pos - 1) / 2 + .5, //28
	pos => pos < 0.5 ? 2 ** (20 * pos - 11) * Math.sin((160 * pos + 1) * Math.PI / 18) : 1 - 2 ** (9 - 20 * pos) * Math.sin((160 * pos + 1) * Math.PI / 18) //29
];

export default function PhiEditChartConverter(_chart)
{
    let rawChart = _chart.split(/[(\r\n)\r\n]+/);
    let chart = new Chart();
    let judgelines = [];
    let notes = [];
    let commands = {
        bpm: [],
        note: [],

        judgelineEvent: {
            speed: [],
            moveX: [],
            moveY: [],
            rotate: [],
            alpha: []
        }
    }

    if (!isNaN(Number(rawChart[0])))
    {
        chart.offset = Number((Number(rawChart.shift()) / 1000).toFixed(4));
    }

    rawChart.forEach((_command, commandIndex) =>
    {
        if (!_command) return;
        if (_command == '') return;
        if (_command.replace(/\s/g, '') == '') return;

        let command = _command.split(' ');

        switch (command[0])
        {
            // bpm 列表
            case 'bp': {
                commands.bpm.push({
                    startBeat : !isNaN(Number(command[1])) ? Number(command[1]) : 0,
                    bpm       : !isNaN(Number(command[2])) && Number(command[2]) >= 1 ? Number(command[2]) : 120
                });
                break;
            }
            // note
            case 'n1':
            { // tap
                commands.note.push({
                    type      : 1,
                    lineId    : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    positionX : !isNaN(Number(command[3])) ? Number(command[3]) : 0,
                    isAbove   : command[4] == 1 ? true : false,
                    isFake    : command[5] == 1 ? true : false
                });
                break;
            }
            case 'n2':
            { // hold
                commands.note.push({
                    type      : 3,
                    lineId    : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime   : !isNaN(Number(command[3])) && Number(command[3]) >= Number(command[2]) ? Number(command[3]) : Number(command[2]),
                    positionX : !isNaN(Number(command[4])) ? Number(command[4]) : 0,
                    isAbove   : command[5] == 1 ? true : false,
                    isFake    : command[6] == 1 ? true : false
                });
                break;
            }
            case 'n3':
            { // flick
                commands.note.push({
                    type      : 4,
                    lineId    : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    positionX : !isNaN(Number(command[3])) ? Number(command[3]) : 0,
                    isAbove   : command[4] == 1 ? true : false,
                    isFake    : command[5] == 1 ? true : false
                });
                break;
            }
            case 'n4':
            { // drag
                commands.note.push({
                    type      : 2,
                    lineId    : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    positionX : !isNaN(Number(command[3])) ? Number(command[3]) : 0,
                    isAbove   : command[4] == 1 ? true : false,
                    isFake    : command[5] == 1 ? true : false
                });
                break;
            }
            // note 附加信息
            case '#':
            { // 速度
                commands.note[commands.note.length - 1].speed = !isNaN(Number(command[1])) ? Number(command[1]) : 1;
                break;
            }
            case '&':
            { // 缩放
                commands.note[commands.note.length - 1].xScale = !isNaN(Number(command[1])) ? Number(command[1]) : 1;
                break;
            }
            // 判定线事件相关
            case 'cv':
            { // speed
                commands.judgelineEvent.speed.push({
                    lineId    : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime   : null,
                    value     : !isNaN(Number(command[3])) ? Number(command[3]) / 7 : 1
                });
                break;
            }
            case 'cm':
            { // moveX & moveY
                commands.judgelineEvent.moveX.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : !isNaN(Number(command[3])) && Number(command[3]) >= Number(command[2]) ? Number(command[3]) : Number(command[2]),
                    start      : null,
                    end        : !isNaN(Number(command[4])) ? Number(command[4]) / 2048 : 0.5,
                    easingType : !isNaN(Number(command[6])) && Number(command[6]) >= 1 ? Number(command[6]) : 1
                });
                commands.judgelineEvent.moveY.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : !isNaN(Number(command[3])) && Number(command[3]) >= Number(command[2]) ? Number(command[3]) : Number(command[2]),
                    start      : null,
                    end        : !isNaN(Number(command[5])) ? Number(command[5]) / 1400 : 0.5,
                    easingType : !isNaN(Number(command[6])) && Number(command[6]) >= 1 ? Number(command[6]) : 1
                });
                break;
            }
            case 'cp':
            { // moveX & moveY（瞬时）
                commands.judgelineEvent.moveX.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : null,
                    start      : !isNaN(Number(command[3])) ? Number(command[3]) / 2048 : 0.5,
                    end        : !isNaN(Number(command[3])) ? Number(command[3]) / 2048 : 0.5,
                    easingType : 1
                });
                commands.judgelineEvent.moveY.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : null,
                    start      : !isNaN(Number(command[4])) ? Number(command[4]) / 1400 : 0.5,
                    end        : !isNaN(Number(command[4])) ? Number(command[4]) / 1400 : 0.5,
                    easingType : 1
                });
                break;
            }
            case 'cr':
            { // rotate
                commands.judgelineEvent.rotate.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : !isNaN(Number(command[3])) && Number(command[3]) >= Number(command[2]) ? Number(command[3]) : Number(command[2]),
                    start      : null,
                    end        : !isNaN(Number(command[4])) ? Number(command[4]) : 0,
                    easingType : !isNaN(Number(command[5])) && Number(command[5]) >= 1 ? Number(command[5]) : 1
                });
                break;
            }
            case 'cd':
            { // rotate（瞬时）
                commands.judgelineEvent.rotate.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : null,
                    start      : !isNaN(Number(command[3])) ? Number(command[3]) : 0,
                    end        : !isNaN(Number(command[3])) ? Number(command[3]) : 0,
                    easingType : 1
                });
                break;
            }
            case 'cf':
            { // alpha
                commands.judgelineEvent.alpha.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : !isNaN(Number(command[3])) && Number(command[3]) >= Number(command[2]) ? Number(command[3]) : Number(command[2]),
                    start      : null,
                    end        : !isNaN(Number(command[4])) ? Number(command[4]) / 255 : 1,
                    easingType : 1
                });
                break;
            }
            case 'ca':
            { // alpha（瞬时）
                commands.judgelineEvent.alpha.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : null,
                    start      : !isNaN(Number(command[3])) ? Number(command[3]) / 255 : 1,
                    end        : !isNaN(Number(command[3])) ? Number(command[3]) / 255 : 1,
                    easingType : 1
                });
                break;
            }
            default :
            {
                console.warn('Unsupported command: ' + command[0] + ', ignoring.');
            }
        }
    });

    // note 和 bpm 按时间排序
    commands.bpm.sort(sortTime);
    commands.note.sort(sortTime);

    if (commands.bpm.length <= 0)
    {
        commands.bpm.push({
            startBeat : 0,
            endBeat   : 1e9,
            bpm       : 120
        });
    }

    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        commands.bpm.forEach((bpm, index) =>
        {   
            if (index < commands.bpm.length - 1)
            {
                bpm.endBeat = commands.bpm[index + 1].startBeat;
            }
            else
            {
                bpm.endBeat = 1e9;
            }

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;
            bpm.endTime = currentBeatRealTime * (bpm.endBeat - bpmChangedBeat);

            bpmChangedBeat += (bpm.startBeat - bpmChangedBeat);
            
            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });
    }

    // 将事件推送给对应的判定线
    for (const eventName in commands.judgelineEvent)
    {
        let events = commands.judgelineEvent[eventName];
        
        events.forEach((event) =>
        {
            if (event.lineId < 0)
            {
                console.warn('Invaild line ID: ' + event.lineId + ', ignoring');
                return;
            }
            if (!judgelines[event.lineId]) judgelines[event.lineId] = new Judgeline({ id: event.lineId });

            judgelines[event.lineId].event[eventName].push(event);
        });
    }

    judgelines.forEach((judgeline) =>
    {
        judgeline.sortEvent();

        // 事件参数补齐
        judgeline.event.alpha.forEach((event, eventIndex, array) =>
        {
            if (event.endTime == null) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e9;
            if (event.start == null) event.start = eventIndex > 0 ? array[eventIndex - 1].end : 1;
        });
        judgeline.event.moveX.forEach((event, eventIndex, array) =>
        {
            if (event.endTime == null) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e9;
            if (event.start == null) event.start = eventIndex > 0 ? array[eventIndex - 1].end : 0.5;
        });
        judgeline.event.moveY.forEach((event, eventIndex, array) =>
        {
            if (event.endTime == null) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e9;
            if (event.start == null) event.start = eventIndex > 0 ? array[eventIndex - 1].end : 0.5;
        });
        judgeline.event.rotate.forEach((event, eventIndex, array) =>
        {
            if (event.endTime == null) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e9;
            if (event.start == null) event.start = eventIndex > 0 ? array[eventIndex - 1].end / (Math.PI / 180) : 0;

            event.start = event.start * (Math.PI / 180);
            event.end = event.end * (Math.PI / 180);
        });
        judgeline.event.speed.forEach((event, eventIndex, array) =>
        {
            if (event.endTime == null) event.endTime = eventIndex < array.length - 1 ? array[eventIndex + 1].startTime : 1e9;
        });

        judgeline.sortEvent();

        // 拆分缓动
        judgeline.event.alpha = calculateEventEase(judgeline.event.alpha);
        judgeline.event.moveX = calculateEventEase(judgeline.event.moveX);
        judgeline.event.moveY = calculateEventEase(judgeline.event.moveY);
        judgeline.event.rotate = calculateEventEase(judgeline.event.rotate);
        
        // 合并相同变化量事件
        for (const name in judgeline.event)
        {
            if (name != 'speed')
            {
                judgeline.event[name] = arrangeSameValueEvent(judgeline.event[name]);
            }
            else
            {
                judgeline.event[name] = arrangeSameValueSpeedEvent(judgeline.event[name]);
            }
        }

        judgeline.sortEvent();

        // 计算事件真实时间
        for (const name in judgeline.event)
        {
            judgeline.event[name] = calculateRealTime(commands.bpm, judgeline.event[name]);
        }

        judgeline.event.speed = calculateSpeedEventFloorPosition(judgeline.event.speed);
    });

    // 计算 note 的真实时间
    commands.note = calculateRealTime(commands.bpm, commands.note);

    commands.note.forEach((note) =>
    {
        let judgeline = judgelines[note.lineId];

        if (!judgeline)
        {
            console.warn('Judgeline ' + note.lineId + ' doesn\'t exist, ignoring.');
            return;
        }

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

            if (note.type == 3)
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

        // 推送 Note
        notes.push(new Note({
            type          : note.type,
            time          : note.startTime,
            holdTime      : note.endTime,
            speed         : note.speed,
            isAbove       : note.isAbove,
            isFake        : note.isFake,
            positionX     : note.positionX * 9 / 1024,
            floorPosition : note.floorPosition,
            holdLength    : note.holdLength,
            xScale        : note.xScale,
            judgeline     : judgeline
        }));
    });

    notes.sort((a, b) => a.time - b.time);

    chart.judgelines = judgelines;
    chart.notes = notes;

    chart.notes.forEach((note, index) =>
    {
        let nextNote = chart.notes[index + 1];
        if (!nextNote) return;

        if (note.time == nextNote.time)
        {
            note.isMulti = true;
            nextNote.isMulti = true;
        }
    })

    return chart;

    function sortTime(a, b)
    {
        return a.startTime - b.startTime || a.startBeat - b.startBeat;
    }
}

function arrangeSameValueEvent(_events)
{
    let events = JSON.parse(JSON.stringify(_events));
    let eventIndexOffset = 0;
    let result = [];

    for (let eventIndex = 0, eventLength = events.length; eventIndex + eventIndexOffset < eventLength; eventIndex++)
    {
        let event = events[eventIndex + eventIndexOffset];
        result.push({
            startTime  : event.startTime,
            endTime    : event.endTime,
            start      : event.start,
            end        : event.end
        });

        if (event.start != event.end) continue;

        for (let nextEventIndex = eventIndex + eventIndexOffset + 1; nextEventIndex < eventLength; nextEventIndex++)
        {
            let nextEvent = events[nextEventIndex];

            if (nextEvent.startTime < event.startTime && nextEvent.endTime < event.startTime) continue;
            if (nextEvent.start != event.start || nextEvent.end != event.end) break;

            result[result.length - 1].endTime = nextEvent.endTime;
            eventIndexOffset++;
        }
    }

    return JSON.parse(JSON.stringify(result));
}

function arrangeSameValueSpeedEvent(_events)
{
    let events = JSON.parse(JSON.stringify(_events));
    let eventIndexOffset = 0;
    let result = [];

    for (let eventIndex = 0, eventLength = events.length; eventIndex + eventIndexOffset < eventLength; eventIndex++)
    {
        let event = events[eventIndex + eventIndexOffset];
        result.push({
            startTime  : event.startTime,
            endTime    : event.endTime,
            value      : event.value
        });

        for (let nextEventIndex = eventIndex + eventIndexOffset + 1; nextEventIndex < eventLength; nextEventIndex++)
        {
            let nextEvent = events[nextEventIndex];

            if (nextEvent.startTime < event.startTime && nextEvent.endTime < event.startTime) continue;
            if (nextEvent.value != event.value) break;

            result[result.length - 1].endTime = nextEvent.endTime;
            eventIndexOffset++;
        }
    }

    return JSON.parse(JSON.stringify(result));
}

function calculateEventEase(events, forceLinear = false)
{
    const calcBetweenTime = 0.125;
    let result = [];

    events.forEach((event) =>
    {
        let timeBetween = event.endTime - event.startTime;
        let valueBetween = event.end - event.start;

        for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
        {
            let timePercentStart = (timeIndex * calcBetweenTime) / timeBetween;
            let timePercentEnd = ((timeIndex + 1) * calcBetweenTime) / timeBetween;

            if (event.easingType && (event.easingType !== 1 || forceLinear))
            {
                result.push({
                    startTime: event.startTime + timeIndex * calcBetweenTime,
                    endTime: (
                        timeIndex + 1 == timeCount && event.startTime + (timeIndex + 1) * calcBetweenTime != event.endTime ?
                        event.endTime : event.startTime + (timeIndex + 1) * calcBetweenTime
                    ),
                    start: event.start + valueBetween * Easing[event.easingType](timePercentStart),
                    end: (
                        timeIndex + 1 == timeCount && event.start + valueBetween * Easing[event.easingType](timePercentEnd) != event.end ?
                        event.end : event.start + valueBetween * Easing[event.easingType](timePercentEnd)
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
    });
    
    return result;
}

function calculateRealTime(_bpmList, events)
{
    let bpmList = JSON.parse(JSON.stringify(_bpmList));
    let result = [];

    bpmList.sort((a, b) => b.startBeat - a.startBeat);

    events.forEach((event) =>
    {
        let newEvent = JSON.parse(JSON.stringify(event));

        for (let bpmIndex = 0, bpmLength = bpmList.length; bpmIndex < bpmLength; bpmIndex++)
        {
            let bpm = bpmList[bpmIndex];

            if (bpm.startBeat > newEvent.endTime) continue;
            newEvent.endTime = Number((bpm.startTime + ((newEvent.endTime - bpm.startBeat) * bpm.beatTime)).toFixed(4));

            for (let nextBpmIndex = bpmIndex; nextBpmIndex < bpmLength; nextBpmIndex++)
            {
                let nextBpm = bpmList[nextBpmIndex];

                if (nextBpm.startBeat > newEvent.startTime) continue;
                newEvent.startTime = Number((nextBpm.startTime + ((newEvent.startTime - nextBpm.startBeat) * nextBpm.beatTime)).toFixed(4));
                break;
            }

            result.push(newEvent);
            break;
        }
    });

    return result;
}

function calculateSpeedEventFloorPosition(events)
{
    let currentFloorPosition = 0;
    let result = [];

    // bpmList.sort((a, b) => b.startTime - a.startTime);

    events.forEach((event, index) =>
    {
        let newEvent = JSON.parse(JSON.stringify(event));
        newEvent.endTime = index < events.length - 1 ? events[index + 1].startTime : 1e9;

        newEvent.floorPosition = Math.fround(currentFloorPosition);
        currentFloorPosition += (newEvent.endTime - newEvent.startTime) * newEvent.value;

        result.push(newEvent);
    });

    result.sort((a, b) => a.startTime - b.startTime);

    return result;
}