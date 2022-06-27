import Chart from './chart';
import Render from './render';
import { Loader, Texture } from 'pixi.js-legacy';
import { Sound } from '@pixi/sound';


const doms = {
    file : {
        chart: document.querySelector('input#file-chart'),
        music: document.querySelector('input#file-music'),
        bg: document.querySelector('input#file-bg')
    },
    startBtn : document.querySelector('button#start'),
    canvas : document.querySelector('canvas#canvas')
};

const files = {
    chart: null,
    music: null,
    bg: null
};

const textures = {};

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

    reader.onload = function () {
        files.bg = Texture.from(this.result);
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
    
    render.createSprites();
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