export default class Judgeline
{
    constructor(params)
    {
        this.id = !isNaN(params.id) ? Number(params.id) : -1;
        this.bpm = !isNaN(params.bpm) ? Number(params.bpm) : 120;
        this.texture = 'judgeline';
        this.event = {
            speed: [],
            move: [],
            rotate: [],
            alpha: []
        };

        this.totalNotes = 0;
        this.totalRealNotes = 0;
        this.totalFakeNotes = 0;

        this.floorPosition = 0;
        this.alpha = 1;
        this.x = 0.5;
        this.y = 0.5;
        this.deg = 0;
        this.sinr = 0;
        this.cosr = 1;

        this.sprite = undefined;
    }

    sortEvent()
    {
        this.event.speed.sort(_sort);
        this.event.move.sort(_sort);
        this.event.rotate.sort(_sort);
        this.event.alpha.sort(_sort);

        function _sort(a, b) {
            return a.startTime - b.startTime;
        }
    }

    static from(rawJudgeline, id)
    {
        let judgeline = new Judgeline({
            id: id,
            bpm: rawJudgeline.bpm
        });

        rawJudgeline.speedEvents.forEach((e) =>
        {
            judgeline.event.speed.push({
                startTime     : calcRealTime(e.startTime, judgeline.bpm),
                endTime       : calcRealTime(e.endTime, judgeline.bpm),
                value         : e.value,
                floorPosition : e.floorPosition
            });
        });
        rawJudgeline.judgeLineMoveEvents.forEach((e) =>
        {
            judgeline.event.move.push({
                startTime     : calcRealTime(e.startTime, judgeline.bpm),
                endTime       : calcRealTime(e.endTime, judgeline.bpm),
                start         : e.start,
                start2        : e.start2,
                end           : e.end,
                end2          : e.end2
            });
        });
        rawJudgeline.judgeLineRotateEvents.forEach((e) =>
        {
            judgeline.event.rotate.push({
                startTime     : calcRealTime(e.startTime, judgeline.bpm),
                endTime       : calcRealTime(e.endTime, judgeline.bpm),
                startDeg      : -(Math.PI / 180) * e.start,
                endDeg        : -(Math.PI / 180) * e.end
            });
        });
        rawJudgeline.judgeLineDisappearEvents.forEach((e) =>
        {
            judgeline.event.alpha.push({
                startTime     : calcRealTime(e.startTime, judgeline.bpm),
                endTime       : calcRealTime(e.endTime, judgeline.bpm),
                start         : e.start,
                end           : e.end
            });
        });
        judgeline.sortEvent();


        judgeline.totalNotes = rawJudgeline.notesAbove.length + rawJudgeline.notesBelow.length;
        rawJudgeline.notesAbove.forEach((note) =>
        {
            if (!note.isFake) judgeline.totalRealNotes++;
            else judgeline.totalFakeNotes++;
        });
        rawJudgeline.notesBelow.forEach((note) =>
        {
            if (!note.isFake) judgeline.totalRealNotes++;
            else judgeline.totalFakeNotes++;
        });

        return judgeline;
    }

    calcTime(currentTime)
    {
        for (const i of this.event.speed)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            this.floorPosition = (currentTime - i.startTime) * i.value + i.floorPosition;
        }

        for (const i of this.event.move)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;
            
            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.x = i.start * time1 + i.end * time2;
            this.y = i.start2 * time1 + i.end2 * time2;

            if (this.sprite) {
                this.sprite.position.set(this.x * this.sprite.parent.width, this.y * this.sprite.parent.height);
            }
        }

        for (const i of this.event.rotate)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.deg = i.startDeg * time1 + i.endDeg * time2;
            this.cosr = Math.cos(this.deg);
            this.sinr = Math.sin(this.deg);

            if (this.sprite) {
                this.sprite.rotation = this.deg;
            }
        }

        for (const i of this.event.alpha)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.alpha = i.start * time1 + i.end * time2;

            if (this.sprite) {
                this.sprite.alpha = this.alpha;
            }
        }
    }
}

function calcRealTime(time, bpm) {
    return time / bpm * 1.875;
}