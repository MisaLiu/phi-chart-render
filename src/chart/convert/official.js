import Chart from '../index';
import Judgeline from '../judgeline';
import EventLayer from '../eventlayer';
import Note from '../note';
import utils from './utils';

export default function OfficialChartConverter(_chart)
{
    let chart = new Chart();
    let rawChart = convertOfficialVersion(_chart);

    chart.offset = rawChart.offset;

    rawChart.judgeLineList.forEach((_judgeline, index) =>
    {
        let judgeline = new Judgeline({ id: index });
        let events = new EventLayer();
        let notes = [];

        _judgeline.speedEvents.forEach((e) =>
        {
            events.speed.push({
                startTime     : calcRealTime(e.startTime, _judgeline.bpm),
                endTime       : calcRealTime(e.endTime, _judgeline.bpm),
                value         : e.value
            });
        });
        _judgeline.judgeLineMoveEvents.forEach((e) => 
        {
            events.moveX.push({
                startTime     : calcRealTime(e.startTime, _judgeline.bpm),
                endTime       : calcRealTime(e.endTime, _judgeline.bpm),
                start         : e.start - 0.5,
                end           : e.end - 0.5
            });
            events.moveY.push({
                startTime : calcRealTime(e.startTime, _judgeline.bpm),
                endTime   : calcRealTime(e.endTime, _judgeline.bpm),
                start     : e.start2 - 0.5,
                end       : e.end2 - 0.5
            });
        });
        _judgeline.judgeLineRotateEvents.forEach((e) => 
        {
            events.rotate.push({
                startTime : calcRealTime(e.startTime, _judgeline.bpm),
                endTime   : calcRealTime(e.endTime, _judgeline.bpm),
                start     : -(Math.PI / 180) * e.start,
                end       : -(Math.PI / 180) * e.end
            });
        });
        _judgeline.judgeLineDisappearEvents.forEach((e) =>
        {
            events.alpha.push({
                startTime : calcRealTime(e.startTime, _judgeline.bpm),
                endTime   : calcRealTime(e.endTime, _judgeline.bpm),
                start     : e.start,
                end       : e.end
            });
        });

        judgeline.eventLayers.push(events);
        judgeline.sortEvent();

        judgeline.eventLayers[0].moveX = utils.arrangeSameValueEvent(judgeline.eventLayers[0].moveX);
        judgeline.eventLayers[0].moveY = utils.arrangeSameValueEvent(judgeline.eventLayers[0].moveY);
        judgeline.eventLayers[0].rotate = utils.arrangeSameValueEvent(judgeline.eventLayers[0].rotate);
        judgeline.eventLayers[0].alpha = utils.arrangeSameValueEvent(judgeline.eventLayers[0].alpha);

        judgeline.calcFloorPosition();

        _judgeline.notesAbove.forEach((rawNote, rawNoteIndex) =>
        {
            let note = pushNote(rawNote, judgeline, rawNoteIndex, _judgeline.bpm, true);
            notes.push(note);
        });
        _judgeline.notesBelow.forEach((rawNote, rawNoteIndex) =>
        {
            let note = pushNote(rawNote, judgeline, rawNoteIndex, _judgeline.bpm, false);
            notes.push(note);
        });

        notes.sort((a, b) => a.time - b.time);
        notes.forEach((note, noteIndex) =>
        {
            note.id = noteIndex;
            chart.notes.push(note);
        });

        chart.judgelines.push(judgeline);
    });

    chart.notes.sort((a, b) => a.time - b.time);

    return chart;

    function pushNote(rawNote, judgeline, id = -1, bpm = 120, isAbove = true)
    {
        rawNote.isAbove = isAbove;
        rawNote.time = calcRealTime(rawNote.time, bpm);
        rawNote.holdTime = calcRealTime(rawNote.holdTime, bpm);
        rawNote.holdEndTime = rawNote.time + rawNote.holdTime;

        if (rawNote.type == 3)
        {
            rawNote.speed = 1;
        }

        {  // 考虑到 js 精度，此处重新计算 Note 的 floorPosition 值
            let noteStartSpeedEvent = judgeline.getFloorPosition(rawNote.time);
            rawNote.floorPosition = noteStartSpeedEvent ? noteStartSpeedEvent.floorPosition + noteStartSpeedEvent.value * (rawNote.time - noteStartSpeedEvent.startTime) : 0;

            if (rawNote.type == 3)
            {
                let noteEndSpeedEvent = judgeline.getFloorPosition(rawNote.holdEndTime);
                rawNote.holdLength = (noteEndSpeedEvent ? noteEndSpeedEvent.floorPosition + noteEndSpeedEvent.value * (rawNote.holdEndTime - noteEndSpeedEvent.startTime) : 0) - rawNote.floorPosition;
            }
            else
            {
                rawNote.holdLength = 0;
            }
        }

        return new Note({
            id            : id,
            lineId        : rawNote.lineId,
            type          : rawNote.type,
            time          : rawNote.time,
            holdTime      : rawNote.holdTime,
            holdLength    : rawNote.holdLength,
            positionX     : rawNote.positionX,
            floorPosition : rawNote.floorPosition,
            speed         : rawNote.speed,
            isAbove       : rawNote.isAbove,
            judgeline     : judgeline
        });
    }
};


function convertOfficialVersion(chart)
{
    let newChart = JSON.parse(JSON.stringify(chart));
    
    switch (newChart.formatVersion)
    {
        case 1:
        {
            newChart.formatVersion = 3;
            for (const i of newChart.judgeLineList)
            {
                let floorPosition = 0;
                
                for (const x of i.speedEvents)
                {
                    if (x.startTime < 0) x.startTime = 0;
                    x.floorPosition = floorPosition;
                    floorPosition += (x.endTime - x.startTime) * x.value / i.bpm * 1.875;
                }
                
                for (const x of i.judgeLineDisappearEvents)
                {
                    x.start2 = 0;
                    x.end2   = 0;
                }
                
                for (const x of i.judgeLineMoveEvents)
                {
                    x.start2 = x.start % 1e3 / 520;
                    x.end2   = x.end % 1e3 / 520;
                    x.start  = parseInt(x.start / 1e3) / 880;
                    x.end    = parseInt(x.end / 1e3) / 880;
                }
                
                for (const x of i.judgeLineRotateEvents)
                {
                    x.start2 = 0;
                    x.end2   = 0;
                }
            }
        }
        case 3: {
            break;
        }
        default:
            throw new Error('Unsupported chart version: ' + newChart.formatVersion);
    }
    
    return newChart;
}

function calcRealTime(time, bpm) {
    return time / bpm * 1.875;
}