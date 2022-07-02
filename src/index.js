import Chart from './chart';
import Render from './render';
import { Loader, Texture } from 'pixi.js-legacy';
import { Sound } from '@pixi/sound';
import * as StackBlur from 'stackblur-canvas';

const doms = {
    fileSelect: document.querySelector('div.file-select'),
    file : {
        chart: document.querySelector('input#file-chart'),
        music: document.querySelector('input#file-music'),
        bg: document.querySelector('input#file-bg')
    },
    startBtn : document.querySelector('button#start'),
    canvas : document.querySelector('canvas#canvas'),
    debug: document.querySelector('div#debug')
};

const files = {
    chart: null,
    music: null,
    bg: null
};

const textures = {};

window.doms = doms;
window.files = files;
window.textures = textures;

window.loader = new Loader();

doms.file.chart.addEventListener('input', function () {
    if (this.files.length <= 0 || !this.files[0]) return;

    let reader = new FileReader();

    reader.onload = function () {
        files.rawChart = JSON.parse(this.result);
        files.chart = Chart.from(JSON.parse(this.result));
    };

    reader.readAsText(this.files[0]);
});

doms.file.music.addEventListener('input', function () {
    if (this.files.length <= 0 || !this.files[0]) return;

    let reader = new FileReader();

    reader.onload = function () {
        files.music = Sound.from({
            source: this.result,
            autoPlay: false,
            preload: true,
            singleInstance: true
        });
    };

    reader.readAsArrayBuffer(this.files[0]);
});

doms.file.bg.addEventListener('input', function () {
    if (this.files.length <= 0 || !this.files[0]) return;

    let reader = new FileReader();

    reader.onload = async function () {
        // VS Code: 别用 await，没有效果
        // Me: 加了 await 之后就没有 error 了
        let bg = await Texture.from(this.result);
        let blur = await Texture.from(blurImage(bg, 50));
        files.bg = blur;
    };

    reader.readAsDataURL(this.files[0]);
});

doms.startBtn.addEventListener('click', () => {
    window.render = Render.from({
        chart: files.chart,
        music: files.music,
        bg: files.bg,
        render: {
            canvas: doms.canvas,
            resizeTo: document.documentElement,
            texture: textures
        }
    });

    render.debug = doms.debug;
    
    render.createSprites();
    
    render.chart.addFunction('note', (currentTime, note) =>
    {
        if (currentTime < note.time) return;
        if (currentTime - 0.2 > note.time) return;
        note.sprite.alpha = 1 - (currentTime - note.time) / 0.2;
    });

    render.start();

    doms.fileSelect.style.display = 'none';
});






window.addEventListener('load', () => {
    loader.add([
        { name: 'tap', url: '/assets/Tap.png' },
        { name: 'tapHL', url: '/assets/TapHL.png' },
        { name: 'drag', url: '/assets/Drag.png' },
        { name: 'dragHL', url: '/assets/DragHL.png' },
        { name: 'flick', url: '/assets/Flick.png' },
        { name: 'flickHL', url: '/assets/FlickHL.png' },
        { name: 'holdHead', url: '/assets/HoldHead.png' },
        { name: 'holdHeadHL', url: '/assets/HoldHeadHL.png' },
        { name: 'holdBody', url: '/assets/Hold.png' },
        { name: 'holdBodyHL', url: '/assets/HoldHL.png' },
        { name: 'holdEnd', url: '/assets/HoldEnd.png' },
        { name: 'judgeline', url: '/assets/JudgeLine.png' }
    ]).load((loader, resources) => {
        for (const name in resources) {
            textures[name] = resources[name].texture;
        }
    });
});


function blurImage(_texture, radius = 10)
{
    let canvas = document.createElement('canvas');
    let texture;

    if (_texture.baseTexture) texture = _texture.baseTexture.resource.source;
    else texture = _texture;

    // console.log(texture);

    StackBlur.image(texture, canvas, radius);
    return canvas;
}

function testMultiLayerArrange()
{
    const eventLayers = [
        [
            {
                startTime: 1,
                endTime: 4,
                start: 1,
                end: 1.5
            },
            {
                startTime: 6,
                endTime: 10,
                start: 2,
                end: 3
            },
            {
                startTime: 12,
                endTime: 14,
                start: 5,
                end: 1
            }
        ],
        [
            {
                startTime: 2,
                endTime: 7,
                start: 1.5,
                end: 2
            },
        ],
        [
            {
                startTime: 3,
                endTime: 8,
                start: 1,
                end: 0
            }
        ]
    ];

    let result = [];

    eventLayers.forEach((eventLayer, eventLayerIndex) =>
    {
        eventLayer.forEach((addedEvent, addedEventIndex) =>
        {
            if (eventLayerIndex <= 0)
            {
                result.push(addedEvent);
                return;
            }

            let _result = JSON.parse(JSON.stringify(result));
            let basedEventIndexOffset = 0;
            let extraDeleteEventCount = 0;
            let mergedLayer = false;

            for (let basedEventIndex = 0, baseEventsLength = result.length; basedEventIndex < baseEventsLength; basedEventIndex++)
            {
                let basedEvent = result[basedEventIndex];

                // 不处理完全不与其重叠的事件
                if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime < basedEvent.startTime) continue;
                if (addedEvent.startTime > basedEvent.endTime && addedEvent.endTime > basedEvent.endTime) continue;

                let addedResult = [];

                if (addedEvent.startTime >= basedEvent.startTime && addedEvent.endTime <= basedEvent.endTime)
                { // 叠加事件在基础事件的时间范围内
                    addedResult = separateEvent(basedEvent, addedEvent);
                }
                else if (addedEvent.startTime >= basedEvent.startTime && addedEvent.endTime > basedEvent.endTime)
                { // 叠加事件的开始时间在基础事件时间范围内，结束时间在范围外
                    addedResult = separateEvent(basedEvent, addedEvent);

                    for (let extraIndex = basedEventIndex + 1, extraLength = result.length; extraIndex < extraLength; extraIndex++)
                    {
                        let extraEvent = result[extraIndex];
                        let _events = separateEvent(extraEvent, addedResult[addedResult.length - 1]);

                        if (_events.length >= 1)
                        {
                            addedResult.splice(addedResult.length - 1, 1);
                            _events.forEach((_event) =>
                            {
                                addedResult.push(_event);
                            });
                            extraDeleteEventCount++;
                        }
                    }
                }
                else if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime <= basedEvent.endTime)
                { // 叠加事件的开始时间在基础事件时间范围外，结束时间在范围内
                    addedResult = separateEvent(basedEvent, addedEvent);

                    for (let extraIndex = basedEventIndex - 1; extraIndex >= 0; extraIndex--)
                    {
                        let extraEvent = result[extraIndex];
                        let _events = separateEvent(extraEvent, addedResult[0]);

                        if (_events.length >= 1)
                        {
                            addedResult.splice(addedResult.length - 1, 1);
                            _events.forEach((_event) =>
                            {
                                addedResult.unshift(_event);
                            });
                            extraDeleteEventCount++;
                        }
                    }
                }
                else if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime > basedEvent.endTime)
                { // 叠加事件在基础事件的时间范围外

                }

                if (addedResult.length >= 1)
                {
                    mergedLayer = true;
                    _result.splice(addedEventIndex, 1 + extraDeleteEventCount);
                    addedResult.forEach((event, index) =>
                    {
                        _result.splice(addedEventIndex + index, 0, event);
                    });
                    break;
                }
            }

            if (!mergedLayer) _result.push(addedEvent);

            result = JSON.parse(JSON.stringify(_result));
        });
    });

    result.sort((a, b) => a.startTime - b.startTime);

    result.forEach((event, index) =>
    { // 事件去重
        let nextEvent = result[index + 1];
        if (!nextEvent) return;

        if (
            event.startTime == nextEvent.startTime &&
            event.endTime == nextEvent.endTime &&
            event.start == nextEvent.start &&
            event.end == nextEvent.end
        ) {
            console.log(event);
            console.log(nextEvent);
            result.splice(index, 1);
        }
    });

    console.log(result);

    function separateEvent(basedEvent, addedEvent)
    {
        let result = [];

        if (addedEvent.startTime < basedEvent.startTime && addedEvent.endTime < basedEvent.startTime) return result;
        if (addedEvent.startTime > basedEvent.endTime && addedEvent.endTime > basedEvent.endTime) return result;

        if (basedEvent.startTime <= addedEvent.startTime && basedEvent.endTime >= addedEvent.endTime)
        { // 叠加事件在基础事件的时间范围内
            result.push({
                startTime: basedEvent.startTime,
                endTime: addedEvent.startTime,
                start: basedEvent.start,
                end: valueCalculator(basedEvent, addedEvent.startTime)
            });

            result.push({
                startTime: addedEvent.startTime,
                endTime: addedEvent.endTime,
                start: valueCalculator(basedEvent, addedEvent.startTime) + addedEvent.start,
                end: valueCalculator(basedEvent, addedEvent.endTime) + addedEvent.end
            });

            result.push({
                startTime: addedEvent.endTime,
                endTime: basedEvent.endTime,
                start: valueCalculator(basedEvent, addedEvent.endTime),
                end: basedEvent.end
            });
        }
        else if (basedEvent.startTime <= addedEvent.startTime && basedEvent.endTime < addedEvent.endTime)
        { // 叠加事件的开始时间在基础事件时间范围内，结束时间在范围外
            result.push({
                startTime: basedEvent.startTime,
                endTime: addedEvent.startTime,
                start: basedEvent.start,
                end: valueCalculator(basedEvent, addedEvent.startTime)
            });

            result.push({
                startTime: addedEvent.startTime,
                endTime: basedEvent.endTime,
                start: valueCalculator(basedEvent, addedEvent.startTime) + addedEvent.start,
                end: basedEvent.end + valueCalculator(addedEvent, basedEvent.endTime)
            });

            result.push({
                startTime: basedEvent.endTime,
                endTime: addedEvent.endTime,
                start: valueCalculator(addedEvent, basedEvent.endTime),
                end: addedEvent.end
            });
        }
        else if (basedEvent.startTime > addedEvent.startTime && basedEvent.endTime >= addedEvent.endTime)
        { // 叠加事件的开始时间在基础事件时间范围外，结束时间在范围内
            result.push({
                startTime: addedEvent.startTime,
                endTime: basedEvent.startTime,
                start: addedEvent.start,
                end: valueCalculator(addedEvent, basedEvent.startTime)
            });

            result.push({
                startTime: basedEvent.startTime,
                endTime: addedEvent.endTime,
                start: basedEvent.start + valueCalculator(addedEvent, basedEvent.startTime),
                end: valueCalculator(basedEvent, addedEvent.endTime) + addedEvent.end
            });

            result.push({
                startTime: addedEvent.endTime,
                endTime: basedEvent.endTime,
                start: valueCalculator(basedEvent, addedEvent.endTime),
                end: basedEvent.end
            });
        }
        else if (basedEvent.startTime > addedEvent.startTime && basedEvent.endTime < addedEvent.endTime)
        { // 叠加事件在基础事件的时间范围外
            result.push({
                startTime: addedEvent.startTime,
                endTime: basedEvent.startTime,
                start: addedEvent.start,
                end: valueCalculator(addedEvent, basedEvent.startTime)
            });

            result.push({
                startTime: basedEvent.startTime,
                endTime: basedEvent.endTime,
                start: valueCalculator(addedEvent, basedEvent.startTime) + basedEvent.start,
                end: valueCalculator(addedEvent, basedEvent.endTime) + basedEvent.end
            });

            result.push({
                startTime: basedEvent.endTime,
                endTime: addedEvent.endTime,
                start: valueCalculator(addedEvent, basedEvent.endTime),
                end: addedEvent.end
            });
        }

        return result;
    }

    function valueCalculator(event, currentTime)
    {
        if (event.startTime > currentTime) throw new Error('currentTime must bigger than startTime');

        let time2 = (currentTime - event.startTime) / (event.endTime - event.startTime);
        let time1 = 1 - time2;

        return event.start * time1 + event.end * time2;
    }
}

(() => {
    testMultiLayerArrange();
})();