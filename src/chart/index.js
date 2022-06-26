import Judgeline from './judgeline';

export default class Chart
{
    constructor()
    {
        this.judgeLines = [];
        this.notes = [];
        this.offset = 0;
    }

    static from(rawChart)
    {
        let chart = new Chart();
        let newChart;
        let newNote = [];

        if (rawChart instanceof Object)
        {
            if (!isNaN(Number(rawChart.formatVersion)))
            {
                newChart = convertOfficialVersion(rawChart);
            }
            else
            {
                throw new Error('Unsupported chart format');
            }

        }
        else if (rawChart instanceof String)
        {
            throw new Error('Unsupported chart format');
        }
        else
        {
            throw new Error('Unsupported chart format');
        }

        chart.offset = newChart.offset;

        console.log(newChart);

        newChart.judgeLineList.forEach((judgeline, index) =>
        {
            chart.judgeLines.push(Judgeline.from(judgeline, index));

            judgeline.notesAbove.forEach((note, noteIndex) =>
            {

            });
        });

        return chart;
    }
}


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
		case 3473: {// Special thanks!
			break;
        }
		default:
			throw 'Unsupported chart version: ' + newChart.formatVersion;
	}
	
	return newChart;
}

function calcRealTime(time, bpm) {
    return time / bpm * 1.875;
}