
function calculateEventBeat(event)
{
    event.startTime = Math.fround(event.startTime[0] + (event.startTime[1] / event.startTime[2]));
    event.endTime = Math.fround(event.endTime[0] + (event.endTime[1] / event.endTime[2]))
    return event;
}

function valueCalculator(event, Easings, currentTime)
{
    if (event.start == event.end) return event.start;
    if (event.startTime > currentTime) throw new Error('currentTime must bigger than startTime');
    if (event.endTime < currentTime) throw new Error('currentTime must smaller than endTime');

    let timePercentStart = (currentTime - event.startTime) / (event.endTime - event.startTime);
    let timePercentEnd = 1 - timePercentStart;
    let easeFunction = Easings[event.easingType - 1] ? Easings[event.easingType - 1] : Easings[0];
    let easePercent = easeFunction((!isNaN(event.easingLeft) ? event.easingLeft : 0) * timePercentEnd + (!isNaN(event.easingRight) ? event.easingRight : 1) * timePercentStart);
    let easePercentStart = easeFunction(!isNaN(event.easingLeft) ? event.easingLeft : 0);
    let easePercentEnd = easeFunction(!isNaN(event.easingRight) ? event.easingRight : 1);

    easePercent = (easePercent - easePercentStart) / (easePercentEnd - easePercentStart);

    return Math.fround(event.start * (1 - easePercent) + event.end * easePercent);
}

function calculateRealTime(_bpmList, _events)
{
    let bpmList = _bpmList.slice();
    let events = _events.slice();

    events.forEach((event) =>
    {
        for (let bpmIndex = 0, bpmLength = bpmList.length; bpmIndex < bpmLength; bpmIndex++)
        {
            let bpm = bpmList[bpmIndex];

            if (bpm.startBeat > event.endTime) continue;
            event.endTime = Math.fround(bpm.startTime + ((event.endTime - bpm.startBeat) * bpm.beatTime));

            for (let nextBpmIndex = bpmIndex; nextBpmIndex < bpmLength; nextBpmIndex++)
            {
                let nextBpm = bpmList[nextBpmIndex];

                if (nextBpm.startBeat > event.startTime) continue;
                event.startTime = Math.fround(nextBpm.startTime + ((event.startTime - nextBpm.startBeat) * nextBpm.beatTime));
                break;
            }

            break;
        }
    });

    return events;
}

export default {
    calculateEventBeat,
    valueCalculator,
    calculateRealTime
}