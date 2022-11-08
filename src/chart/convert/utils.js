const calcBetweenTime = 0.125; // 1/32

/**
 * 将一个事件的拍数数组转换为拍数小数
 * 
 * @param {Object} event 欲转换的事件
 * @return {Object} 转换出的事件
 */
function calculateEventBeat(event)
{
    event.startTime = parseFloat((event.startTime[0] + (event.startTime[1] / event.startTime[2])).toFixed(3));
    event.endTime = parseFloat((event.endTime[0] + (event.endTime[1] / event.endTime[2])).toFixed(3));
    return event;
}

/**
 * 将一组事件的拍数数组转换为拍数小数
 * 
 * @param {Array} events 欲转换的事件组
 * @return {Array} 转换出的事件组
 */
function calculateEventsBeat(events)
{
    events.forEach((event) =>
    {
        event = calculateEventBeat(event);
    });
    return events;
}

/**
 * 计算在某时间下某一事件的返回值
 * 
 * @param {Object} event 欲用于计算值的事件
 * @param {Array} Easings 该事件配套的缓动函数组
 * @param {Number} currentTime 欲计算的时间
 * @param {Number} [easingsOffset] 缓动函数偏移，默认为 `1`
 * @return {Number} 返回在指定时间下当前事件的值
 */
function valueCalculator(event, Easings, currentTime, easingsOffset = 1)
{
    if (event.start == event.end) return event.start;
    if (event.startTime > currentTime) throw new Error('currentTime must bigger than startTime');
    if (event.endTime < currentTime) throw new Error('currentTime must smaller than endTime');

    let timePercentStart = (currentTime - event.startTime) / (event.endTime - event.startTime);
    let timePercentEnd = 1 - timePercentStart;
    let easeFunction = Easings[event.easingType - easingsOffset] ? Easings[event.easingType - easingsOffset] : Easings[0];
    let easePercent = easeFunction((!isNaN(event.easingLeft) ? event.easingLeft : 0) * timePercentEnd + (!isNaN(event.easingRight) ? event.easingRight : 1) * timePercentStart);
    let easePercentStart = easeFunction(!isNaN(event.easingLeft) ? event.easingLeft : 0);
    let easePercentEnd = easeFunction(!isNaN(event.easingRight) ? event.easingRight : 1);

    easePercent = (easePercent - easePercentStart) / (easePercentEnd - easePercentStart);

    return event.start * (1 - easePercent) + event.end * easePercent;
}

/**
 * 计算一组事件/Note的绝对时间
 * 
 * @param {Array} _bpmList 一组已计算好绝对时间的 BPM 列表，传入前请先倒序排序
 * @param {Array} _events 欲计算绝对时间的事件/Note数组
 * @return {Array} 已经计算好时间的事件/Note数组
 */
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
            event.endTime = bpm.startTime + ((event.endTime - bpm.startBeat) * bpm.beatTime);

            for (let nextBpmIndex = bpmIndex; nextBpmIndex < bpmLength; nextBpmIndex++)
            {
                let nextBpm = bpmList[nextBpmIndex];

                if (nextBpm.startBeat > event.startTime) continue;
                event.startTime = nextBpm.startTime + ((event.startTime - nextBpm.startBeat) * nextBpm.beatTime);
                break;
            }

            break;
        }
    });

    return events.slice();
}

/**
 * 拆分事件缓动
 * 
 * @param {Object} event 欲拆分缓动的事件
 * @param {Array} Easings 该事件配套的缓动函数组
 * @param {Number} [easingsOffset] 缓动函数偏移，默认为 `1`
 * @param {Boolean} [forceLinear] 强制拆分 linear 缓动
 * @return {Array} 已拆分完缓动的事件数组
 */
function calculateEventEase(event, Easings, easingsOffset = 1, forceLinear = false)
{
    let result = [];
    let timeBetween = event.endTime - event.startTime;

    if (!event) return [];

    if (
        event.easingType && Easings[event.easingType - easingsOffset] && (event.easingType - easingsOffset !== 0 || forceLinear) &&
        event.easingType <= Easings.length &&
        event.start != event.end
    ) {
        for (let timeIndex = 0, timeCount = Math.ceil(timeBetween / calcBetweenTime); timeIndex < timeCount; timeIndex++)
        {
            let currentTime = event.startTime + (timeIndex * calcBetweenTime);
            let nextTime = event.startTime + ((timeIndex + 1) * calcBetweenTime) <= event.endTime ? event.startTime + ((timeIndex + 1) * calcBetweenTime) : event.endTime;

            result.push({
                startTime : currentTime,
                endTime   : nextTime,
                start     : valueCalculator(event, Easings, currentTime, easingsOffset),
                end       : valueCalculator(event, Easings, nextTime, easingsOffset)
            });
        }
    }
    else
    {
        result.push({
            startTime: event.startTime,
            endTime: event.endTime,
            start: event.start,
            end: event.end
        });
    }

    return result;
}

/**
 * 合并一组事件中值相同的事件
 * 
 * @param {Array} _events 欲合并相同值的事件组
 * @return {Array} 已合并相同值的事件组
 */
function arrangeSameValueEvent(_events)
{
    if (!_events || _events.length <= 0) return [];

    let events = _events.slice();
    let result = [ events.shift() ];

    for (const event of events)
    {
        if (
            result[result.length - 1].start == result[result.length - 1].end &&
            event.start == event.end &&
            result[result.length - 1].start == event.start
        ) {
            result[result.length - 1].endTime = event.endTime;
        }
        else
        {
            result.push(event);
        }
    }
    
    return result.slice();
}

/**
 * 合并一组速度事件中值相同的事件
 * 
 * @param {Array} events 欲合并相同值的速度事件组
 * @return {Array} 已合并相同值的速度事件组
 */
function arrangeSameSingleValueEvent(events)
{
    if (!events || events.length <= 0) return [];

    let newEvents = [];
    for (let i of events) {
        let lastEvent = newEvents[newEvents.length - 1];
        
        if (!lastEvent || lastEvent.value != i.value) {
            newEvents.push(i);
        } else {
            lastEvent.endTime = i.endTime;
        }
    }
    
    return newEvents.slice();
}

export default {
    CalcBetweenTime: calcBetweenTime,

    calculateEventBeat,
    calculateEventsBeat,
    
    valueCalculator,
    calculateRealTime,

    calculateEventEase,

    arrangeSameValueEvent,
    arrangeSameSingleValueEvent
}