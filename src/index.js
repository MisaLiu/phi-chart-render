import * as PhiChartRender from './main';
import FontFaceObserver from 'fontfaceobserver';
import JSZip from 'jszip';
import { Texture, Rectangle, utils as PIXIutils } from 'pixi.js-legacy';
import { Howl } from 'howler';
import { canvasRGB as StackBlur } from 'stackblur-canvas';
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

(() =>
{
    if (GITHUB_CURRENT_GIT_HASH != '{{' + 'CURRENT_HASH' + '}}')
    {
        // Init sentry
        Sentry.init({
            dsn: "https://c0f2c5052bd740c3b734b74c7dd6d350@o4504077358792704.ingest.sentry.io/4504077363183616",
            integrations: [ new BrowserTracing() ],
            tracesSampleRate: 1.0,
            maxBreadcrumbs: 50,
            debug: (GITHUB_CURRENT_GIT_HASH == '{{' + 'CURRENT_HASH' + '}}'),
            release: (GITHUB_CURRENT_GIT_HASH != '{{' + 'CURRENT_HASH' + '}}'),
            beforeSend: (event, hint) => {
                let err = hint.originalException;

                doms.errorWindow.content.innerText = err.stack ? err.stack : err.message ? err.message : err;
                doms.errorWindow.window.style.display = 'block';

                return event;
            }
        });
    }
})();


const qs = (selector) => document.querySelector(selector);

const fonts = {
    'MiSans'               : new FontFaceObserver('MiSans'),
    'A-OTF Shin Go Pr6N H' : new FontFaceObserver('A-OTF Shin Go Pr6N H')
}

const doms = {
    fileSelect: document.querySelector('div.file-select'),
    chartPackFile: document.querySelector('input#file-chart-pack'),
    chartPackFileReadProgress: document.querySelector('div#file-read-progress'),

    file : {
        chart: document.querySelector('select#file-chart'),
        music: document.querySelector('select#file-music'),
        bg: document.querySelector('select#file-bg')
    },
    settings: {
        multiNoteHL: document.querySelector('input#settings-multi-note-hl'),
        showAPStatus: document.querySelector('input#settings-show-ap-status'),
        showInputPoint: document.querySelector('input#settings-show-input-point'),
        noteScale: document.querySelector('input#settings-note-scale'),
        bgDim: document.querySelector('input#settings-bg-dim'),
        bgBlur: document.querySelector('input#settings-bg-blur'),

        offset: document.querySelector('input#settings-audio-offset'),
        testInputDelay: document.querySelector('button#settings-test-input-delay'),
        speed: document.querySelector('input#settings-audio-speed'),

        hitsound: document.querySelector('input#settings-hitsound'),
        hitsoundVolume: document.querySelector('input#settings-hitsound-volume'),

        challengeMode: document.querySelector('input#settings-challenge-mode'),
        autoPlay: document.querySelector('input#settings-autoplay'),
        forceCanvas: document.querySelector('input#settings-force-canvas'),
        antiAlias: document.querySelector('input#settings-anti-alias'),
        lowResolution: document.querySelector('input#settings-low-resolution'),
        debug: document.querySelector('input#settings-debug')
    },
    startBtn : document.querySelector('button#start'),
    loadingStatus : document.querySelector('div#loading-status'),
    fullscreenBtn : document.querySelector('button#fullscreen'),

    playResult: {
        container: document.querySelector('div.play-result'),
        scoreBar: document.querySelector('div.play-result .info-bar.score'),
        accBar: document.querySelector('div.play-result .info-bar.acc-bar'),
    },

    errorWindow : {
        window: document.querySelector('div.error-window'),
        closeBtn: document.querySelector('div.error-window button.close'),
        content: document.querySelector('div.error-window code.content')
    }
};

const files = {
    charts: {},
    musics: {},
    images: {},
    infos: [],
    lines: [],
    all: {}
};

const currentFile = {
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

window.qs = qs;
window.doms = doms;
window.files = files;
window.assets = assets;
window.currentFile = currentFile;
window.fullscreen = fullscreen;

doms.chartPackFile.addEventListener('input', async function ()
{
    if (this.files.length <= 0) return;

    let fileList = [ ...this.files ];

    for (let fileIndex = 0; fileIndex < fileList.length; fileIndex++)
    {
        if (!fileList[fileIndex]) continue;

        let file = fileList[fileIndex];
        let fileFormatSplit = file.name.split('.');
        let fileFormat = fileFormatSplit[fileFormatSplit.length - 1];

        file.format = fileFormat;

        doms.chartPackFileReadProgress.innerText = 'Loading files: ' + file.name + ' ...(' + (fileIndex + 1) + '/' + fileList.length + ')';

        if (file.name === 'info.csv')
        {
            try {
                let rawText = await readText(file);
                let infos = CsvReader(rawText);

                files.infos.push(...infos);
                files.all[file.name] = infos;

            } catch (e) {
                
            }
        }
        else if (file.name === 'line.csv')
        {
            try {
                let rawText = await readText(file);
                let lines = CsvReader(rawText);

                files.lines.push(...lines);
                files.all[file.name] = lines;

            } catch (e) {
                
            }
        }
        else if (file.name === 'Settings.txt' || file.name === 'info.txt')
        {
            try {
                let rawText = await readText(file);
                let info = SettingsReader(rawText);

                files.infos.push(info);
                files.all[file.name] = info;

            } catch (e) {
                
            }
        }
        else
        {
            (await (new Promise(() =>
            {
                throw new Error('Just make a promise, plz ignore me');
            }))
            .catch(async () =>
            {
                let zipFiles = await JSZip.loadAsync(file, { createFolders: false });

                for (const name in zipFiles.files)
                {
                    if (zipFiles.files[name].dir) continue;

                    let zipFile = zipFiles.files[name];
                    let newFile = new File(
                        [ (await zipFile.async('blob')) ],
                        name,
                        {
                            type: '',
                            lastModified: zipFile.date
                        }
                    );

                    fileList.push(newFile);
                }

                return;
            })
            .catch(async () =>
            {
                let imgBitmap = await createImageBitmap(file);
                let texture = await Texture.from(imgBitmap);

                Texture.addToCache(texture, file.name);

                files.images[file.name] = texture;
                files.all[file.name] = texture;
                doms.file.bg.appendChild(createSelectOption(file));

                return;
            })
            .catch(async () =>
            {
                let audio = await loadAudio(file);

                files.musics[file.name] = audio;
                files.all[file.name] = audio;
                doms.file.music.appendChild(createSelectOption(file));

                return;
            })
            .catch(async () =>
            {
                let chartRaw = await readText(file);
                let chart;

                try {
                    chart = JSON.parse(chartRaw);
                } catch (e) {
                    chart = chartRaw;
                }

                chart = PhiChartRender.Chart.from(chart);

                files.charts[file.name] = chart;
                files.all[file.name] = chart;
                doms.file.chart.appendChild(createSelectOption(file));

                return;
            })
            .catch((e) =>
            {
                console.error('Unsupported file: ' + file.name);
                return;
            }));
        }
    }

    if (doms.file.chart.childNodes.length >= 1 && doms.file.music.childNodes.length >= 1)
    {
        doms.file.chart.dispatchEvent(new Event('input'));
        doms.startBtn.disabled = false;
    }

    doms.chartPackFileReadProgress.innerText = 'All done!';

    function readText(file)
    {
        return new Promise((res, rej) =>
        {
            let reader = new FileReader();

            reader.onloadend = () =>
            {
                res(reader.result);
            };

            reader.onerror = (e) =>
            {
                rej(e);
            };

            reader.readAsText(file);
        });
    }

    function readDataURL(file)
    {
        return new Promise((res, rej) =>
        {
            let reader = new FileReader();

            reader.onloadend = () =>
            {
                res(reader.result);
            };

            reader.onerror = (e) =>
            {
                rej(e);
            };

            reader.readAsDataURL(file);
        });
    }

    function loadAudio(file)
    {
        return new Promise(async (res, rej) =>
        {
            let dataUrl = await readDataURL(file);
            let audio = new Howl({
                src: dataUrl,
                format: file.format,
                preload: true,
                autoPlay: false,
                loop: false,

                onload: () =>
                {
                    res(audio);
                },
                onloaderror: (id, e) =>
                {
                    rej(id, e);
                }
            });

            audio.load();
        });
    }

    function createSelectOption(file)
    {
        let option = document.createElement('option');
        option.innerText = option.value = file.name;
        return option;
    }
});

doms.file.chart.addEventListener('input', function () {
    currentFile.chart = files.charts[this.value];

    if (files.infos && files.infos.length > 0)
    {
        for (const info of files.infos)
        {
            if (info.Chart === this.value)
            {
                currentFile.music = files.musics[info.Music];
                currentFile.bg = files.images[info.Image];

                doms.file.music.value = info.Music;
                doms.file.bg.value = info.Image;

                break;
            }
        }
    }

    doms.file.music.dispatchEvent(new Event('input'));
    doms.file.bg.dispatchEvent(new Event('input'));
});

doms.file.music.addEventListener('input', function () {
    currentFile.music = files.musics[this.value];
});

doms.file.bg.addEventListener('input', function () {
    currentFile.bg = files.images[this.value];
});

doms.startBtn.addEventListener('click', async () => {
    if (!currentFile.chart)
    {
        alert('No chart selected.');
        return;
    }
    if (!currentFile.music)
    {
        alert('No music selected.');
        return;
    }

    currentFile.chart.music = currentFile.music;
    if (currentFile.bg)
    {
        let bgBlur = await Texture.from(await blurImage(currentFile.bg, doms.settings.bgBlur.value));
        Texture.addToCache(bgBlur, doms.file.bg.value + '_blured');
        currentFile.chart.bg = bgBlur;
    }

    if (files.infos && files.infos.length > 0)
    {
        for (const info of files.infos)
        {
            if (info.Chart === doms.file.chart.value)
            {
                currentFile.chart.info.name = info.Name;
                currentFile.chart.info.artist = info.Composer;
                currentFile.chart.info.author = info.Designer;
                currentFile.chart.info.bgAuthor = info.Illustrator;
                currentFile.chart.info.difficult = info.Level;

                break;
            }
        }
    }

    if (files.lines && files.lines.length > 0)
    {
        let lines = [];

        for (const line of files.lines)
        {
            if (line.Chart === doms.file.chart.value)
            {
                lines.push(line);
            }
        }

        currentFile.chart.readLineTextureInfo(lines);
    }

    window._game = new PhiChartRender.Game({
        chart: currentFile.chart,
        assets: assets,
        zipFiles: files.all,
        render: {
            resizeTo: document.documentElement,
            resolution: doms.settings.lowResolution.checked ? 1 : window.devicePixelRatio,
            antialias: doms.settings.antiAlias.checked,
            forceCanvas: doms.settings.forceCanvas.checked
        },
        settings: {
            multiNoteHL: doms.settings.multiNoteHL.checked,
            showAPStatus: doms.settings.showAPStatus.checked,
            showInputPoint: doms.settings.showInputPoint.checked,
            bgDim: doms.settings.bgDim.value,
            noteScale: 10000 - doms.settings.noteScale.value,

            audioOffset: doms.settings.offset.value / 1000,
            speed: doms.settings.speed.value,

            hitsound: doms.settings.hitsound.checked,
            hitsoundVolume: doms.settings.hitsoundVolume.value,

            challengeMode: doms.settings.challengeMode.checked,
            autoPlay: doms.settings.autoPlay.checked,
            debug : doms.settings.debug.checked
        },
        watermark: 'github/MisaLiu/phi-chart-render ' + GITHUB_CURRENT_GIT_HASH
    });

    document.body.appendChild(_game.render.view);
    _game.render.view.classList.add('canvas-game');

    _game.on('start', () => console.log('Game started!'));
    _game.on('pause', () => {
        console.log('Game paused!');
        qs('.game-paused').style.display = 'block';
    });
    _game.on('end', (game) => {
        console.log('Game ended!');
        showGameResultPopup(game);
    });

    _game.createSprites();
    _game.start();

    // eruda.hide();

    doms.fileSelect.style.display = 'none';
});

doms.errorWindow.closeBtn.addEventListener('click', () =>
{
    doms.errorWindow.window.style.display = 'none';
});

window.addEventListener('resize', () =>
{
    calcHeightPercent();
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

    (await (async (resources = []) =>
    {
        for (const resource of resources)
        {
            doms.loadingStatus.innerText = 'Loading asset ' + resource.name + ' ...';

            try
            {
                let res = await requestFile(resource.url);
                let imgBitmap = await createImageBitmap(res);
                let texture = await Texture.from(imgBitmap);

                Texture.addToCache(texture, resource.name);
                assets.textures[resource.name] = texture;

                if (resource.name == 'clickRaw')
                {
                    let _clickTextures = [];
                    
                    for (let i = 0; i < Math.floor(assets.textures[resource.name].height / assets.textures[resource.name].width); i++) {
                        let rectangle = new Rectangle(0, i * assets.textures[resource.name].width, assets.textures[resource.name].width, assets.textures[resource.name].width);
                        let texture = new Texture(assets.textures[resource.name].baseTexture, rectangle);

                        Texture.addToCache(texture, resource.name + (i + 0));

                        texture.defaultAnchor.set(0.5);
                        _clickTextures.push(texture);
                    }
                    
                    assets.textures[resource.name] = _clickTextures;
                }
            }
            catch (e)
            {
                console.error('Failed getting resource: ' + resource.name, e);
            }
        }
    })([
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

        { name: 'pauseButton', url: './assets/pauseButton.png' }
    ]));

    (await (async (resources = []) =>
    {
        for (const resource of resources)
        {
            doms.loadingStatus.innerText = 'Loading hitsound ' + resource.name + ' ...';

            try
            {
                let res = await requestFile(resource.url);
                let dataUrl = await readDataURL(res);
                let audio = await decodeAudio(dataUrl);


                if (!assets.sounds) assets.sounds = {};
                assets.sounds[resource.name] = audio;
            }
            catch (e)
            {
                console.error('Failed getting resource: ' + resource.name, e);
            }
        }
    })([
        { name: 'tap', url: './assets/sounds/Hitsound-Tap.ogg' },
        { name: 'drag', url: './assets/sounds/Hitsound-Drag.ogg' },
        { name: 'flick', url: './assets/sounds/Hitsound-Flick.ogg' }
    ]));

    (await (async (resources = [], options = {}) =>
    {
        for (const resource of resources)
        {
            doms.loadingStatus.innerText = 'Loading result music ' + resource.name + ' ...';

            try
            {
                let res = await requestFile(resource.url);
                let dataUrl = await readDataURL(res);
                let audio = await decodeAudio(dataUrl, options);


                if (!assets.sounds.result) assets.sounds.result = {};
                assets.sounds.result[resource.name] = audio;
            }
            catch (e)
            {
                console.error('Failed getting resource: ' + resource.name, e);
            }
        }
    })([
        { name: 'ez', url: './assets/sounds/result/ez.ogg' },
        { name: 'hd', url: './assets/sounds/result/hd.ogg' },
        { name: 'in', url: './assets/sounds/result/in.ogg' },
        { name: 'at', url: './assets/sounds/result/at.ogg' }
    ], { loop: true }));

    doms.loadingStatus.innerText = 'All done!';
    doms.chartPackFileReadProgress.innerText = 'No chart pack file selected';
    doms.chartPackFile.disabled = false;

    calcHeightPercent();

    if (!PIXIutils.isWebGLSupported())
    {
        doms.settings.forceCanvas.checked = true;
        doms.settings.forceCanvas.disabled = true;
    }

    doms.settings.testInputDelay.testTimes = 0;
    doms.settings.testInputDelay.testDelays = 0;

    doms.settings.testInputDelay.addEventListener('touchstart', (e) =>
    {
        let getTime = () => performance ? performance.now() : Date.now();
        doms.settings.testInputDelay.testTimes += 1;
        doms.settings.testInputDelay.testDelays += (getTime() - e.timeStamp);
        doms.settings.testInputDelay.innerText = 'Tap on this button to test input delay...' + (Math.round((doms.settings.testInputDelay.testDelays / doms.settings.testInputDelay.testTimes) * 1000) / 1000) + 'ms';
    });

    doms.playResult.scoreBar.addEventListener('click', () => doms.playResult.accBar.classList.toggle('show'));

    function requestFile(url)
    {
        return new Promise((res, rej) =>
        {
            let xhr = new XMLHttpRequest();

            xhr.responseType = 'blob';

            xhr.onreadystatechange = () =>
            {
                if (xhr.readyState === 4 && xhr.status === 200)
                {
                    res(xhr.response);
                }
            };

            xhr.onerror = (e) =>
            {
                rej(e);
            };

            xhr.open('GET', url);
            xhr.send();
        });
    }

    function readDataURL(file)
    {
        return new Promise((res, rej) =>
        {
            let reader = new FileReader();

            reader.onloadend = () =>
            {
                res(reader.result);
            };

            reader.onerror = (e) =>
            {
                rej(e);
            };

            reader.readAsDataURL(file);
        });
    }

    function decodeAudio(dataUrl, options = {})
    {
        return new Promise((res, rej) =>
        {
            let sound = new Howl({
                src: dataUrl,
                preload: true,
                autoplay: false,
                loop: false,
                ...options,

                onload: () =>
                {
                    res(sound);
                },
                onloaderror: (id, code) =>
                {
                    rej(id, code);
                }
            });

            sound.load();
        });
    }
});

function CsvReader(_text)
{
    let firstRow = [];
    let result = [];

    _text.split(/\r\n|\n\r/).forEach((row, rowIndex) =>
    {
        row.split(',').forEach((text, columnIndex) =>
        {
            if (rowIndex <= 0)
            {
                firstRow.push(/([A-Za-z0-9]+)/.exec(text)[1]);
            }
            else
            {
                if (!result[rowIndex - 1]) result[rowIndex - 1] = {};
                result[rowIndex - 1][firstRow[columnIndex]] = text;
            }
        });
    });

    return result;
}

function SettingsReader(_text)
{
    let rows = (_text + '').split(/\r\n|\n\r/);
    let rowReg = /^([a-zA-Z]+):\s(.+)$/;
    let result = {};

    for (const row of rows)
    {
        let rowRegResult = rowReg.exec(row);
    
        if (!rowRegResult || rowRegResult.length < 3) continue;

        let infoKey = rowRegResult[1];
        let infoValue = rowRegResult[2];

        switch (infoKey)
        {
            case 'Name':
            {
                result['Name'] = infoValue;
                break;
            }
            case 'Level':
            {
                result['Level'] = infoValue;
                break;
            }
            case 'Charter':
            {
                result['Designer'] = infoValue;
                break;
            }
            case 'Chart':
            {
                result['Chart'] = infoValue;
                break;
            }
            case 'Song':
            {
                result['Music'] = infoValue;
                break;
            }
            case 'Picture':
            {
                result['Image'] = infoValue;
                break;
            }
            default: {
                result[infoKey] = infoValue;
            }
        }
    }

    return result;
}

function blurImage(_texture, radius = 10)
{
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let texture;

    if (_texture.baseTexture) texture = _texture.baseTexture.resource.source;
    else texture = _texture;

    canvas.width = texture.width;
    canvas.height = texture.height;

    ctx.drawImage(texture, 0, 0);

    StackBlur(canvas, 0, 0, texture.width, texture.height, radius);
    return new Promise((res, rej) =>
    {
        createImageBitmap(canvas)
            .then(result => res(result))
            .catch(e => rej(e))
    });
}

function calcHeightPercent()
{
    let realWidth = document.documentElement.clientHeight / 9 * 16 < document.documentElement.clientWidth ? document.documentElement.clientHeight / 9 * 16 : document.documentElement.clientWidth;

    document.body.style.setProperty('--height-percent', document.documentElement.clientHeight / 1080);
    document.body.style.setProperty('--width-offset', (document.documentElement.clientWidth - realWidth) / 2 + 'px');
}

function pauseGame()
{
    if (!_game) return;

    _game.pause();

    if (_game._isPaused)
    {
        qs('.game-paused').style.display = 'block';
    }
    else
    {
        console.log('Game unpaused!');
        qs('.game-paused').style.display = 'none';
    }
}

function restartGame()
{
    if (!_game) return;

    _game.restart();

    for (const name in assets.sounds.result)
    {
        let sound = assets.sounds.result[name];
        sound.stop();
    }

    qs('.game-paused').style.display = 'none';
    qs('.play-result').classList.remove('show');
    doms.playResult.accBar.classList.remove('show');
}

function exitGame()
{
    if (!_game) return;

    _game.destroy(true);
    _game = undefined;

    for (const name in assets.sounds.result)
    {
        let sound = assets.sounds.result[name];
        sound.stop();
    }

    qs('.game-paused').style.display = 'none';
    qs('.play-result').classList.remove('show');
    doms.playResult.accBar.classList.remove('show');

    doms.fileSelect.style.display = 'block';
}


window.pauseGame = pauseGame;
window.restartGame  = restartGame;
window.exitGame = exitGame;


function showGameResultPopup(game)
{
    let chart = game.chart;
    let judge = game.judgement;

    qs('.play-result .song-info .title').innerHTML = (chart.info.name || 'Untitled');
    qs('.play-result .song-info .subtitle.artist').innerHTML = (chart.info.artist || 'Unknown');
    qs('.play-result .song-info .subtitle.diff').innerHTML = (chart.info.difficult || 'SP Lv.?');
    if (game._settings.challengeMode) qs('.play-result .song-info .subtitle.diff').innerHTML += ' (challenge)';
    if (Number((game._settings.speed).toFixed(2)) !== 1) qs('.play-result .song-info .subtitle.diff').innerHTML += ' (x' + (game._settings.speed).toFixed(2) + ')';

    if (judge.score.judgeLevel == 6) qs('.play-result .judge-icon').innerText = 'φ';
    else if (judge.score.judgeLevel == 5) qs('.play-result .judge-icon').innerText = 'V';
    else if (judge.score.judgeLevel == 4) qs('.play-result .judge-icon').innerText = 'S';
    else if (judge.score.judgeLevel == 3) qs('.play-result .judge-icon').innerText = 'A';
    else if (judge.score.judgeLevel == 2) qs('.play-result .judge-icon').innerText = 'B';
    else if (judge.score.judgeLevel == 1) qs('.play-result .judge-icon').innerText = 'C';
    else qs('.play-result .judge-icon').innerText = 'False';

    if (judge.score.APType == 2) qs('.play-result .extra-info').innerText = 'All Perfect';
    else if (judge.score.APType == 1) qs('.play-result .extra-info').innerText = 'Full Combo';
    else qs('.play-result .extra-info').innerText = '';
    if (judge.score._autoPlay) qs('.play-result .extra-info').innerText = 'Auto Play';

    qs('.play-result .info-bar.score .score').innerText = fillZero((judge.score.score).toFixed(0));
    qs('.play-result .info-bar.score .acc').innerText = 'Accuracy ' + (judge.score.acc * 100).toFixed(2) + '%';

    qs('.play-result .info-bar.detail .detail-single .value.perfect').innerText = judge.score.perfect;
    qs('.play-result .info-bar.detail .detail-single .value.good').innerText = judge.score.good;
    qs('.play-result .info-bar.detail .detail-single .value.bad').innerText = judge.score.bad;
    qs('.play-result .info-bar.detail .detail-single .value.miss').innerText = judge.score.miss;
    qs('.play-result .info-bar.detail .max-combo').innerText = 'Max Combo ' + judge.score.maxCombo;

    {
        qs('.play-result .info-bar.acc-bar .judge-histogram').innerHTML = '';

        let noteJudgeTime = (!game._settings.challengeMode ? 180 : 90) / 1000;
        let noteTimeHigestCount = 0;
        let accHistogramValue = {};

        game.chart.notes.forEach((note) =>
        {
            if (note.isFake) return;
            if (isNaN(note.scoreTime)) return;

            accHistogramValue[Math.ceil((note.scoreTime / noteJudgeTime) * 50)] = accHistogramValue[Math.ceil((note.scoreTime / noteJudgeTime) * 50)] ? accHistogramValue[Math.ceil((note.scoreTime / noteJudgeTime) * 50)] + 1 : 1;
        });

        for (const acc in accHistogramValue)
        {
            if (accHistogramValue[acc] > noteTimeHigestCount) noteTimeHigestCount = accHistogramValue[acc];
        }
        for (const acc in accHistogramValue)
        {
            let value = document.createElement('div');
            value.style.opacity = (accHistogramValue[acc] / noteTimeHigestCount);
            value.style.setProperty('--pos', (Number(acc) + 50) + '%');

            if (!game._settings.challengeMode)
            {
                if (-(80 / 360 * 100) <= acc && acc <= (80 / 360 * 100)) value.style.background = '#FFECA0';
                else if (-(160 / 360 * 100) <= acc && acc <= (160 / 360 * 100)) value.style.background = '#B4E1FF';
                else value.style.background = '#6c4343';
            }
            else
            {
                if (-(40 / 180 * 100) <= acc && acc <= (40 / 180 * 100)) value.style.background = '#FFECA0';
                else if (-(75 / 180 * 100) <= acc && acc <= (75 / 180 * 100)) value.style.background = '#B4E1FF';
                else value.style.background = '#6c4343';
            }
            

            qs('.play-result .info-bar.acc-bar .judge-histogram').appendChild(value);
        }

        let center = document.createElement('div');
        center.className = 'center';
        qs('.play-result .info-bar.acc-bar .judge-histogram').appendChild(center);
    }

    {
        let diffType = chart.info.difficult ? /([a-zA-Z]+)\s[lL][vV]\.?(.+)/.exec(chart.info.difficult) : null;
        diffType = (diffType && diffType.length >= 1 ? diffType[1] : 'IN');

        switch ((diffType ? diffType.toLowerCase() : 'in'))
        {
            case 'ez':
            {
                assets.sounds.result.ez.stop();
                assets.sounds.result.ez.play();
                break;
            }
            case 'hd':
            {
                assets.sounds.result.hd.stop();
                assets.sounds.result.hd.play();
                break;
            }
            case 'at':
            {
                assets.sounds.result.at.stop();
                assets.sounds.result.at.play();
                break;
            }
            case 'in' :
            default :
            {
                assets.sounds.result.in.stop();
                assets.sounds.result.in.play();
                break;
            }
        }
    }

    qs('.play-result').classList.add('show');

    function fillZero(num)
    {
        let result = num + '';
        while (result.length < 7)
        {
            result = '0' + result;
        }
        return result;
    }
}