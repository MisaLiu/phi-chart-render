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