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
                startDeg      : -(Math.PI / 180) * e.start,
                endDeg        : -(Math.PI / 180) * e.end
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

    notes.sort((a, b) => a.time - b.time);
    notes.forEach((note, index) =>
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

function calcRealTime(time, bpm) {
    return time / bpm * 1.875;
}