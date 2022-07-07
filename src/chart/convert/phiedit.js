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
    let bpmList = [];
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
                    value     : !isNaN(Number(command[3])) ? Number(command[3]) : 1
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
                    end        : !isNaN(Number(command[4])) ? Number(command[4]) / 1024 : 0.5,
                    easingType : !isNaN(Number(command[6])) && Number(command[6]) >= 1 ? Number(command[6]) : 1
                });
                commands.judgelineEvent.moveY.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : !isNaN(Number(command[3])) && Number(command[3]) >= Number(command[2]) ? Number(command[3]) : Number(command[2]),
                    start      : null,
                    end        : !isNaN(Number(command[5])) ? Number(command[5]) / 700 : 0.5,
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
                    start      : !isNaN(Number(command[3])) ? Number(command[3]) / 1024 : 0.5,
                    end        : !isNaN(Number(command[3])) ? Number(command[3]) / 1024 : 0.5,
                    easingType : 1
                });
                commands.judgelineEvent.moveY.push({
                    lineId     : !isNaN(Number(command[1])) && Number(command[1]) >= 0 ? Number(command[1]) : -1,
                    startTime  : !isNaN(Number(command[2])) && Number(command[2]) >= 0 ? Number(command[2]) : 0,
                    endTime    : null,
                    start      : !isNaN(Number(command[4])) ? Number(command[4]) / 700 : 0.5,
                    end        : !isNaN(Number(command[4])) ? Number(command[4]) / 700 : 0.5,
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
                    satrt      : null,
                    end        : !isNaN(Number(command[4])) ? Number(command[4]) : 1,
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
                    satrt      : !isNaN(Number(command[3])) ? Number(command[3]) : 1,
                    end        : !isNaN(Number(command[3])) ? Number(command[3]) : 1,
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

    
    console.log(chart);
    console.log(commands);
    console.log(bpmList);
    /*
    console.log(judgelines);
    console.log(notes);
    */

    function sortTime(a, b)
    {
        return a.startTime - b.startTime || a.startBeat - b.startBeat;
    }
}