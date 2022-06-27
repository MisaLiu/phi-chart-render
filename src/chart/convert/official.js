import Chart from '../index';
import Judgeline from '../judgeline';
import Note from '../note';

export default function OfficialChartConverter(_chart)
{
    let chart = new Chart();
    let rawChart = convertOfficialVersion(_chart);
    let notes = [];

    chart.offset = rawChart.offset;

    rawChart.judgeLineList.forEach((_judgeline, index) =>
    {
        let judgeline = new Judgeline({ id: index });

        _judgeline.speedEvents.forEach((e) =>
        {
            judgeline.event.speed.push({
                startTime     : calcRealTime(e.startTime, _judgeline.bpm),
                endTime       : calcRealTime(e.endTime, _judgeline.bpm),
                value         : e.value,
                floorPosition : e.floorPosition
            });
        });
        _judgeline.judgeLineMoveEvents.forEach((e) => 
        {
            judgeline.event.moveX.push({
                startTime     : calcRealTime(e.startTime, _judgeline.bpm),
                endTime       : calcRealTime(e.endTime, _judgeline.bpm),
                start         : e.start,
                end           : e.end
            });
            judgeline.event.moveY.push({
                startTime     : calcRealTime(e.startTime, _judgeline.bpm),
                endTime       : calcRealTime(e.endTime, _judgeline.bpm),
                start         : e.start2,
                end           : e.end2
            });
        });
        _judgeline.judgeLineRotateEvents.forEach((e) => 
        {
            judgeline.event.rotate.push({
                startTime     : calcRealTime(e.startTime, _judgeline.bpm),
                endTime       : calcRealTime(e.endTime, _judgeline.bpm),
                start      : -(Math.PI / 180) * e.start,
                end        : -(Math.PI / 180) * e.end
            });
        });
        _judgeline.judgeLineDisappearEvents.forEach((e) =>
        {
            judgeline.event.alpha.push({
                startTime     : calcRealTime(e.startTime, _judgeline.bpm),
                endTime       : calcRealTime(e.endTime, _judgeline.bpm),
                start         : e.start,
                end           : e.end
            });
        });

        judgeline.event.speed = arrangeSpeedEvents(judgeline.event.speed);
        judgeline.event.moveX = arrangeLineEvents(judgeline.event.moveX);
        judgeline.event.moveY = arrangeLineEvents(judgeline.event.moveY);
        judgeline.event.rotate = arrangeLineEvents(judgeline.event.rotate);
        judgeline.event.alpha = arrangeLineEvents(judgeline.event.alpha);
        
        judgeline.sortEvent();

        _judgeline.notesAbove.forEach((note) =>
        {
            note.lineId = index;
            note.isAbove = true;
            note.time = calcRealTime(note.time, _judgeline.bpm);
            note.holdTime = calcRealTime(note.holdTime, _judgeline.bpm);
            notes.push(note);
        });
        _judgeline.notesBelow.forEach((note) =>
        {
            note.lineId = index;
            note.isAbove = false;
            note.time = calcRealTime(note.time, _judgeline.bpm);
            note.holdTime = calcRealTime(note.holdTime, _judgeline.bpm);
            notes.push(note);
        });

        chart.judgelines.push(judgeline);
    });

    notes.forEach((note) =>
    {
        chart.notes.push(new Note({
            lineId        : note.lineId,
            type          : note.type,
            time          : note.time,
            holdTime      : note.holdTime,
            positionX     : note.position,
            floorPosition : note.floorPosition,
            speed         : note.speed,
            isAbove       : note.isAbove
        }));
    });

    chart.notes.sort((a, b) => a.time - b.time);
    chart.notes.forEach((note, index) =>
    {
        if (!chart.notes[index + 1]) return;
        if (Number(chart.notes[index + 1].time.toFixed(4)) === Number(note.time.toFixed(4))) {
            note.isMulti = true;
            chart.notes[index + 1].isMulti = true;
        }
    });

    return chart;
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

function arrangeLineEvents(events) {
    let oldEvents = JSON.parse(JSON.stringify(events));
    let newEvents2 = [];
    let newEvents = [{ // 以 1-1e6 开始
        startTime : 1 - 1e6,
        endTime   : 0,
        start     : oldEvents[0] ? oldEvents[0].start : 0,
        end       : oldEvents[0] ? oldEvents[0].end : 0
    }];
    
    oldEvents.push({ // 以 1e9 结束
        startTime : 0,
        endTime   : 1e9,
        start     : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].start : 0,
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
    
    // 合并相同变化率事件
    newEvents2 = [ newEvents.shift() ];
    for (let newEvent of newEvents)
    {
        let lastNewEvent2 = newEvents2[newEvents2.length - 1];
        let duration1 = lastNewEvent2.endTime - lastNewEvent2.startTime;
        let duration2 = newEvent.endTime - newEvent.startTime;
        
        if (newEvent.startTime == newEvent.endTime)
        {
            // 忽略此分支    
        }
        else if (
            lastNewEvent2.end == newEvent.start &&
            (lastNewEvent2.end - lastNewEvent2.start) * duration2 == (newEvent.end - newEvent.start) * duration1
        )
        {
            lastNewEvent2.endTime = newEvent.endTime;
            lastNewEvent2.end     = newEvent.end;
        }
        else
        {
            newEvents2.push(newEvent);
        }
    }
    
    return JSON.parse(JSON.stringify(newEvents2));
}

function arrangeSpeedEvents(events)
{
    let newEvents = [];
    for (let i of events) {
        let lastEvent = newEvents[newEvents.length - 1];
        
        if (!lastEvent || lastEvent.value != i.value) {
            newEvents.push(i);
        } else {
            lastEvent.endTime = i.endTime;
        }
    }
    
    return JSON.parse(JSON.stringify(newEvents));
}

function calcRealTime(time, bpm) {
    return time / bpm * 1.875;
}