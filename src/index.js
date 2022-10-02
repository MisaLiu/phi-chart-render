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
        offset: document.querySelector('input#settings-audio-offset'),
        speed: document.querySelector('input#settings-audio-speed'),

        hitsound: document.querySelector('input#settings-hitsound'),
        hitsoundVolume: document.querySelector('input#settings-hitsound-volume'),

        showAPStatus: document.querySelector('input#settings-show-ap-status'),
        autoPlay: document.querySelector('input#settings-autoplay'),
        debug: document.querySelector('input#settings-debug')
    },
    startBtn : document.querySelector('button#start'),
    loadingStatus : document.querySelector('div#loading-status'),
    canvas : document.querySelector('canvas#canvas'),
    fullscreenBtn : document.querySelector('button#fullscreen'),

    errorWindow : {
        window: document.querySelector('div.error-window'),
        closeBtn: document.querySelector('div.error-window button.close'),
        content: document.querySelector('div.error-window code.content')
    }
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

// 全屏相关。代码来自 lchzh3473
const fullscreen = {
	// 切换全屏状态
	toggle(elem, inDocument = false) {
		// if (!this.enabled) return false;
		if (this.element) {
			if (!inDocument) {
				if (document.exitFullscreen) return document.exitFullscreen();
				if (document.cancelFullScreen) return document.cancelFullScreen();
				if (document.webkitCancelFullScreen) return document.webkitCancelFullScreen();
				if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
				if (document.msExitFullscreen) return document.msExitFullscreen();
			}
			
			if (this.element == elem) {
				elem.style.position = 'relative';
				elem.style.top = 'unset';
				elem.style.left = 'unset';
				elem.style.zIndex = 'unset';
				document.body.style.overflow = 'auto';
				
				document.inDocumentFullscreenElement = null;
				if (global.functions.resizeCanvas) global.functions.resizeCanvas();
				return true;
			}
			
			return false;
			
		} else {
			if (!inDocument) {
				if (!(elem instanceof HTMLElement)) elem = document.body;
				if (elem.requestFullscreen) return elem.requestFullscreen();
				if (elem.webkitRequestFullscreen) return elem.webkitRequestFullscreen();
				if (elem.mozRequestFullScreen) return elem.mozRequestFullScreen();
				if (elem.msRequestFullscreen) return elem.msRequestFullscreen();
			}
			
			if (elem != document.body) {
				elem.style.position = 'fixed';
				elem.style.top = '0';
				elem.style.left = '0';
				elem.style.zIndex = '5050';
				document.body.style.overflow = 'hidden';
				
				document.inDocumentFullscreenElement = elem;
				if (global.functions.resizeCanvas) global.functions.resizeCanvas();
				return true;
			}
			
			return false;
		}
	},
	
	// 检查当前全屏的元素
	check(elem) {
		if (!(elem instanceof HTMLElement)) elem = document.body;
		return this.element == elem;
	},
	
	// 返回当前浏览器的全屏组件。
	get element() {
		return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.inDocumentFullscreenElement;
	},
	
	// 返回当前浏览器是否支持全屏 API。
	get enabled() {
		return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
	},
	
	// 返回当前的全屏模式。2 == 网页内全屏，1 == API 全屏，0 == 没有开启全屏
	get type() {
		if (document.inDocumentFullscreenElement) {
			return 2;
		} else if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
			return 1;
		} else {
			return 0;
		}
	}
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

    for (const name in assets.sounds)
    {
        assets.sounds[name].play({ volume: 0 });
    }

    window._game = new Game({
        chart: files.chart,
        assets: assets,
        render: {
            canvas: doms.canvas,
            resizeTo: document.documentElement,
            
        },
        settings: {
            audioOffset: doms.settings.offset.value / 1000,
            speed: doms.settings.speed.value,

            hitsound: doms.settings.hitsound.checked,
            hitsoundVolume: doms.settings.hitsoundVolume.value,

            showAPStatus: doms.settings.showAPStatus.checked,
            autoPlay: doms.settings.autoPlay.checked,
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

doms.fullscreenBtn.addEventListener('click', () =>
{
    fullscreen.toggle(document.body, false);
});

window.addEventListener('error', (err) =>
{
    doms.errorWindow.content.innerHTML = (err.error && err.error.stack ? err.error.stack : err.error.message);
    doms.errorWindow.window.style.display = 'block';
});
window.addEventListener('unhandledrejection', (err) =>
{
    doms.errorWindow.content.innerHTML = (err.reason && err.reason.stack ? err.reason.stack : err.reason.message);
    doms.errorWindow.window.style.display = 'block';
});
doms.errorWindow.closeBtn.addEventListener('click', () =>
{
    doms.errorWindow.window.style.display = 'none';
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
    loader.onComplete.add((l, res) =>
    {
        doms.loadingStatus.innerText = 'All done!';
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
        { name: 'clickRaw', url: './assets/clickRaw128.png' },

        { name: 'pauseButton', url: './assets/pauseButton.png' },

        { name: 'soundTap', url: './assets/sounds/Hitsound-Tap.ogg' },
        { name: 'soundDrag', url: './assets/sounds/Hitsound-Drag.ogg' },
        { name: 'soundFlick', url: './assets/sounds/Hitsound-Flick.ogg' }
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
                        
                        texture.defaultAnchor.set(0.5);
                        _clickTextures.push(texture);
                    }
                    
                    assets.textures[name] = _clickTextures;
                }
            }
            else if (resources[name].sound)
            {
                assets.sounds[name.replace('sound', '').toLowerCase()] = resources[name].sound;
                assets.sounds[name.replace('sound', '').toLowerCase()].loop = false;
            }
            
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
