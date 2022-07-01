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
        ],
        [
            {
                startTime: 0.5,
                endTime: 5,
                start: 1.5,
                end: 2
            }
        ]
    ];
    let newEvents = [];

    eventLayers.forEach((eventLayer, lIndex) =>
    {
        eventLayer.forEach((event) =>
        {
            if (lIndex <= 0)
            {
                newEvents.push(event);
                return;
            }

            let _newEvents = JSON.parse(JSON.stringify(newEvents));

            newEvents.forEach((newEvent, nIndex) =>
            {
                // 不处理完全不与其重叠的事件
                if (event.startTime < newEvent.startTime && event.endTime < newEvent.startTime) return;
                if (event.startTime > newEvent.endTime && event.endTime > newEvent.endTime) return;

                let separatedEvent = [];

                if (event.startTime >= newEvent.startTime && event.endTime <= newEvent.endTime)
                {
                    separatedEvent = separateEvent(newEvent, event);
                }
                else if (event.startTime >= newEvent.startTime && event.endTime > newEvent.endTime)
                {
                    separatedEvent = separateEvent(newEvent, event);
                }
                else if (event.startTime < newEvent.startTime && event.endTime <= newEvent.endTime)
                {
                    separatedEvent = separateEvent(newEvent, event);
                }
                else if (event.startTime < newEvent.startTime && event.endTime > newEvent.endTime)
                {
                    separatedEvent = separateEvent(newEvent, event);
                }

                if (separatedEvent.length >= 1)
                {
                    _newEvents.splice(nIndex, 1);
                    separatedEvent.forEach((sEvent, sIndex) =>
                    {
                        _newEvents.splice(nIndex + sIndex, 0, sEvent);
                    });
                }
            });

            newEvents = JSON.parse(JSON.stringify(_newEvents));
        });
    });

    console.log(newEvents);

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