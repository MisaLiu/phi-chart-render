import Chart from './chart';
import Game from './game';
import FontFaceObserver from 'fontfaceobserver';
import { Loader, Texture, Rectangle } from 'pixi.js-legacy';
import { Sound } from '@pixi/sound';
import * as StackBlur from 'stackblur-canvas';

const fonts = {
    'MiSans'               : new FontFaceObserver('MiSans'),
    'A-OTF Shin Go Pr6N H' : new FontFaceObserver('A-OTF Shin Go Pr6N H')
}

const doms = {
    fileSelect: document.querySelector('div.file-select'),
    file : {
        chart: document.querySelector('input#file-chart'),
        music: document.querySelector('input#file-music'),
        bg: document.querySelector('input#file-bg')
    },
    settings: {
        autoPlay: document.querySelector('input#settings-autoplay'),
        debug: document.querySelector('input#settings-debug'),
        offset: document.querySelector('input#settings-offset')
    },
    startBtn : document.querySelector('button#start'),
    loadingStatus : document.querySelector('div#loading-status'),
    canvas : document.querySelector('canvas#canvas'),
    debug: document.querySelector('div#debug')
};

const files = {
    chart: null,
    music: null,
    bg: null
};

const assets = {
    textures: {},
    sounds: {}
};

window.doms = doms;
window.files = files;
window.assets = assets;

window.loader = new Loader();

doms.file.chart.addEventListener('input', function () {
    if (this.files.length <= 0 || !this.files[0]) return;

    let reader = new FileReader();

    reader.onload = function () {
        try {
            files.rawChart = JSON.parse(this.result);
        } catch (e) {
            console.log(e);
            files.rawChart = this.result;
        }

        files.chart = Chart.from(files.rawChart);
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
    files.chart.music = files.music;
    files.chart.bg = files.bg;

    window._game = new Game({
        chart: files.chart,
        assets: assets,
        render: {
            canvas: doms.canvas,
            resizeTo: document.documentElement,
            
        },
        settings: {
            audioOffset: doms.settings.offset.value / 1000,
            debug : doms.settings.debug.checked
        }
    });

    _game.createSprites();
    
    /*
    _game.chart.addFunction('note', (currentTime, note) =>
    {
        if (note.isFake) return;
        if (currentTime < note.time) return;
        if (currentTime - 0.2 > note.time) return;
        if (note.type !== 3 && note.sprite.alpha != 0)
        {
            note.sprite.alpha = 0;
            // console.log(note);
        }
        // note.sprite.alpha = 1 - (currentTime - note.time) / 0.2;
    });
    */
    _game.start();

    doms.fileSelect.style.display = 'none';
});






window.addEventListener('load', async () =>
{
    for (const name in fonts)
    {
        try
        {
            doms.loadingStatus.innerText = 'Loading font ' + name + ' ...';
            await fonts[name].load(null, 30000);
        }
        catch (e)
        {
            console.error(e);
        }
    }
    document.body.classList.add('font-loaded');
    
    loader.onProgress.add((l, res) =>
    {
        doms.loadingStatus.innerText = 'Loading asset ' + res.name + ' ...';
    });

    loader.add([
        { name: 'tap', url: './assets/Tap.png' },
        { name: 'tapHL', url: './assets/TapHL.png' },
        { name: 'drag', url: './assets/Drag.png' },
        { name: 'dragHL', url: './assets/DragHL.png' },
        { name: 'flick', url: './assets/Flick.png' },
        { name: 'flickHL', url: './assets/FlickHL.png' },
        { name: 'holdHead', url: './assets/HoldHead.png' },
        { name: 'holdHeadHL', url: './assets/HoldHeadHL.png' },
        { name: 'holdBody', url: './assets/Hold.png' },
        { name: 'holdBodyHL', url: './assets/HoldHL.png' },
        { name: 'holdEnd', url: './assets/HoldEnd.png' },
        { name: 'judgeline', url: './assets/JudgeLine.png' },
        { name: 'clickRaw', url: './assets/clickRaw128.png' }
    ]).load((loader, resources) => {
        for (const name in resources) {
            if (resources[name].texture)
            {
                assets.textures[name] = resources[name].texture;

                if (name == 'clickRaw')
                {
                    let _clickTextures = [];
                    
                    for (let i = 0; i < Math.floor(assets.textures[name].height / assets.textures[name].width); i++) {
                        let rectangle = new Rectangle(0, i * assets.textures[name].width, assets.textures[name].width, assets.textures[name].width);
                        let texture = new Texture(assets.textures[name].baseTexture, rectangle);
                        
                        _clickTextures.push(texture);
                    }
                    
                    assets.textures[name] = _clickTextures;
                }
            }
            
        }
        
        doms.loadingStatus.innerText = 'All done!';
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
