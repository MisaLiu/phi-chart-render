import * as Convert from './convert';

export default class Chart
{
    constructor()
    {
        this.judgelines = [];
        this.notes = [];
        this.offset = 0;

        this.function = {
            judgeline: [],
            note: []
        }
    }

    static from(rawChart)
    {
        let chart;

        if (rawChart instanceof Object)
        {
            if (!isNaN(Number(rawChart.formatVersion)))
            {
                chart =  Convert.Official(rawChart);
            }
        }
        else if (rawChart instanceof String)
        {
            
        }

        if (!chart) throw new Error('Unsupported chart format');

        chart.judgelines.forEach((judgeline) =>
        {
            judgeline.event.speed = arrangeSpeedEvents(judgeline.event.speed);
            judgeline.event.moveX = arrangeLineEvents(judgeline.event.moveX);
            judgeline.event.moveY = arrangeLineEvents(judgeline.event.moveY);
            judgeline.event.rotate = arrangeLineEvents(judgeline.event.rotate);
            judgeline.event.alpha = arrangeLineEvents(judgeline.event.alpha);

            judgeline.sortEvent();
        });

        return chart;
    }

    addFunction(type, func)
    {
        if (!this.function[type]) throw new Error('Invaild function type');
        this.function[type].push(func);
    }

    calcTime(currentTime, size)
    {
        this.judgelines.forEach((judgeline) =>
        {
            judgeline.calcTime(currentTime, size);
            this.function.judgeline.forEach((func) =>
            {
                func(currentTime, judgeline);
            });
        });
        this.notes.forEach((note) =>
        {
            note.calcTime(currentTime, size);
            this.function.note.forEach((func) =>
            {
                func(currentTime, note);
            });
        })
    }

    get totalNotes() {
        return this.notes.length;
    }

    get totalRealNotes() {
        let result = 0;
        this.notes.forEach((note) => {
            if (!note.isFake) result++;
        });
        return result;
    }

    get totalFakeNotes() {
        let result = 0;
        this.notes.forEach((note) => {
            if (note.isFake) result++;
        });
        return result;
    }
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