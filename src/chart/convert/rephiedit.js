import Chart from '../index';
import Judgeline from '../judgeline';
import Note from '../note';

export default function RePhiEditChartConverter(_chart)
{
    let chart = new Chart();
    let rawChart = convertChartFormat(_chart);

    chart.offset = rawChart.META.offset / 1000;

    { // 将 Beat 计算为对应的时间（秒）
        let currentBeatRealTime = 0.5; // 当前每个 Beat 的实际时长（秒）
        let bpmChangedBeat = 0; // 当前 BPM 是在什么时候被更改的（Beat）
        let bpmChangedTime = 0; // 当前 BPM 是在什么时候被更改的（秒）

        rawChart.BPMList.forEach((bpm) =>
        {   
            bpm.startBeat = bpm.startTime[0] + bpm.startTime[1] / bpm.startTime[2];

            bpmChangedTime += currentBeatRealTime * (bpm.startBeat - bpmChangedBeat);
            bpm.startTime = bpmChangedTime;

            bpmChangedBeat += (bpm.startBeat - bpmChangedBeat);
            
            currentBeatRealTime = 60 / bpm.bpm;
            bpm.beatTime = 60 / bpm.bpm;
        });

        console.log(rawChart.BPMList);
    }

    // Beat 数组转换为小数
    rawChart.judgeLineList.forEach((judgeline) =>
    {
        judgeline.eventLayers.forEach((eventLayer) =>
        {
            for (const name in eventLayer)
            {
                eventLayer[name] = beat2Time(eventLayer[name]);
            }
        });
    });

    // 多层 EventLayer 叠加
    rawChart.judgeLineList.forEach((judgeline) =>
    {
        let finalEvent = {
            speed: [],
            moveX: [],
            moveY: [],
            rotate: [],
            alpha: []
        };

        judgeline.eventLayers.forEach((eventLayer) =>
        {

        });

        judgeline.event = finalEvent;
    });


    return chart;
}

function convertChartFormat(rawChart)
{
    let chart = JSON.parse(JSON.stringify(rawChart));

    switch (chart.META.RPEVersion)
    {
        case 100:
        {
            break;
        }
        default :
        {
            throw new Error('Unsupported chart version: ' + chart.META.RPEVersion);
        }
    }

    return JSON.parse(JSON.stringify(chart));
}

function beat2Time(event)
{
    event.forEach((e) =>
    {
        e.startTime = e.startTime[0] + e.startTime[1] / e.startTime[2];
        e.endTime = e.endTime[0] + e.endTime[1] / e.endTime[2];
    });
    return event;
}

function arrangeEventLayer(events, finalEvents)
{
    events.forEach((event) =>
    {
        if (finalEvents.length <= 0)
        {
            finalEvents.push(event);
            return;
        }

        
    });
}