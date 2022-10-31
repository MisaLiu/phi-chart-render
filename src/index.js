import Chart from './chart';
import Game from './game';
import * as PhiChartRender from './main';
import FontFaceObserver from 'fontfaceobserver';
import JSZip, { file } from 'jszip';
import { Loader, Texture, Rectangle, utils as PIXIutils } from 'pixi.js-legacy';
import { Howl } from 'howler';
import * as StackBlur from 'stackblur-canvas';
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

(() =>
{
    // Init sentry
    Sentry.init({
        dsn: "https://c0f2c5052bd740c3b734b74c7dd6d350@o4504077358792704.ingest.sentry.io/4504077363183616",
        integrations: [ new BrowserTracing() ],
        tracesSampleRate: 1.0,
        maxBreadcrumbs: 50,
        debug: (GITHUB_CURRENT_GIT_HASH == '{{' + 'CURRENT_HASH' + '}}'),
        release: (GITHUB_CURRENT_GIT_HASH != '{{' + 'CURRENT_HASH' + '}}')
    });
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
    canvas : document.querySelector('canvas#canvas-game'),
    fullscreenBtn : document.querySelector('button#fullscreen'),

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
    info: null,
    line: null,
    zip: null
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

window.loader = new Loader();

doms.chartPackFile.addEventListener('input', function ()
{
    if (this.files.length <= 0 || !this.files[0]) return;

    files.charts = {};
    files.musics = {};
    files.images = {};
    files.info = null;
    files.line = null;
    files.zip = null;
    
    currentFile.chart = null;
    currentFile.music = null;
    currentFile.bg = null;

    let reader = new FileReader();
    let zip = new JSZip();

    reader.onload = function ()
    {
        zip.loadAsync(this.result, { createFolders: false })
            .then((e) => decodeZipFile(e));
    };

    reader.readAsArrayBuffer(this.files[0]);

    async function decodeZipFile(zipDecodeResult)
    {
        const chartFormat = ('json,pec').split(',');
        const imageFormat = ('jpeg,jpg,gif,png,webp').split(',');
		const audioFormat = ('aac,flac,mp3,ogg,wav,webm').split(',');
        let zipFiles = zipDecodeResult.files;
        let result = {};

        // 文件预处理
        for (const name in zipFiles)
        {
            let zipFile = zipFiles[name];
            if (zipFile.dir) continue;

            zipFile.realName = name.split('/')[name.split('/').length - 1];
            zipFile.format   = zipFile.realName.split('.')[zipFile.realName.split('.').length - 1];
            zipFile.isHidden = zipFile.realName.indexOf('.') === 0;

            doms.chartPackFileReadProgress.innerHTML = 'Loading ' + zipFile.name + ' ...';

            if (chartFormat.indexOf(zipFile.format.toLowerCase()) >= 0)
            {
                let _text = (await zipFile.async('text'));
                try {
                    files.charts[name] = JSON.parse(_text);
                } catch (e) {
                    files.charts[name] = _text;
                }
            }
            else if (imageFormat.indexOf(zipFile.format.toLowerCase()) >= 0)
            {
                files.images[name] = 'data:image/' + zipFile.format.toLowerCase() + ';base64,' + (await zipFile.async('base64'));
            }
            else if (audioFormat.indexOf(zipFile.format.toLowerCase()) >= 0)
            {
                files.musics[name] = 'data:audio/' + zipFile.format.toLowerCase() + ';base64,' + (await zipFile.async('base64'));
            }
            else if (zipFile.name.toLowerCase() === 'info.csv')
            {
                files.info = (await zipFile.async('text'));
            }
            else if (zipFile.name.toLowerCase() === 'line.csv')
            {
                files.line = (await zipFile.async('text'));
            }
        }

        // 处理图片文件
        doms.file.bg.innerHTML = '';
        for (const name in files.images)
        {
            doms.chartPackFileReadProgress.innerHTML = 'Processing ' + name + ' ...';

            let _result = await Texture.from(files.images[name]);
            files.images[name] = _result;
            result[name] = _result;

            let selectOption = document.createElement('option');
            selectOption.innerText = selectOption.value = name;
            doms.file.bg.appendChild(selectOption);

            if (!currentFile.bg)
            {
                currentFile.bg = _result;
                doms.file.bg.value = name;
            }
        }

        // 处理音频文件
        doms.file.music.innerHTML = '';
        for (const name in files.musics)
        {
            doms.chartPackFileReadProgress.innerHTML = 'Processing ' + name + ' ...';

            let _result = new Howl({
                src: files.musics[name],
                preload: true,
                autoPlay: false,
                loop: false
            });

            _result.load();
            files.musics[name] = _result;
            result[name] = _result;

            let selectOption = document.createElement('option');
            selectOption.innerText = selectOption.value = name;
            doms.file.music.appendChild(selectOption);

            if (!currentFile.music)
            {
                currentFile.music = _result;
                doms.file.music.value = name;
            }
        }

        // 处理 info.csv
        if (files.info)
        {
            try {
                files.info = CsvReader(files.info);
                result['info.csv'] = files.info;
            } catch (e) {
                files.info = null;
            }
        }

        // 处理 line.csv
        if (files.line)
        {
            try {
                files.line = CsvReader(files.line);
                result['line.csv'] = files.line;
            } catch (e) {
                files.line = null;
            }
        }

        // 处理谱面文件
        doms.file.chart.innerHTML = '';
        for (const name in files.charts)
        {
            doms.chartPackFileReadProgress.innerHTML = 'Processing ' + name + ' ...';

            let chartInfo = {};
            let chartLineTextures = [];

            if (files.info)
            {
                for (const info of files.info)
                {
                    if (info.Chart === name)
                    {
                        chartInfo = info;
                        break;
                    }
                }

                chartInfo.name = chartInfo.Name;
                chartInfo.author = chartInfo.Designer;
                chartInfo.bgAuthor = chartInfo.Illustrator;
                chartInfo.difficult = chartInfo.Level;
            }

            if (files.line)
            {
                files.line.forEach((line) =>
                {
                    if (line.Chart !== name) return;
                    chartLineTextures.push(line);
                });
            }

            let _result = PhiChartRender.Chart.from(files.charts[name], chartInfo, chartLineTextures);
            files.charts[name] = _result;
            result[name] = _result;

            let selectOption = document.createElement('option');
            selectOption.innerText = selectOption.value = name;
            doms.file.chart.appendChild(selectOption);

            if (!currentFile.chart)
            {
                currentFile.chart = _result;
                doms.file.chart.value = name;
            }
        }

        doms.chartPackFileReadProgress.innerHTML = 'All done!';

        files.zip = result;

        if (files.info)
        {
            for (const info of files.info)
            {
                if (info.Chart === doms.file.chart.value)
                {
                    currentFile.music = files.zip[info.Music];
                    currentFile.bg = files.zip[info.Image];

                    doms.file.music.value = info.Music;
                    doms.file.bg.value = info.Image;

                    break;
                }
            }
        }
    }
});

doms.file.chart.addEventListener('input', function () {
    currentFile.chart = files.zip[this.value];
    if (files.info)
    {
        for (const info of files.info)
        {
            if (info.Chart === this.value)
            {
                currentFile.music = files.zip[info.Music];
                currentFile.bg = files.zip[info.Image];

                doms.file.music.value = info.Music;
                doms.file.bg.value = info.Image;

                break;
            }
        }
    }
});

doms.file.music.addEventListener('input', function () {
    currentFile.music = files.zip[this.value];
});

doms.file.bg.addEventListener('input', function () {
    currentFile.bg = files.zip[this.value];
});

doms.startBtn.addEventListener('click', async () => {
    currentFile.chart.music = currentFile.music;
    if (currentFile.bg) currentFile.chart.bg = await Texture.from(blurImage(currentFile.bg, doms.settings.bgBlur.value));;

    window._game = new Game({
        chart: currentFile.chart,
        assets: assets,
        zipFiles: files.zip,
        render: {
            canvas: doms.canvas,
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

    // eruda.hide();

    doms.fileSelect.style.display = 'none';
});

window.addEventListener('error', (err) =>
{
    doms.errorWindow.content.innerText = (err.error && err.error.stack ? err.error.stack : err.error.message);
    doms.errorWindow.window.style.display = 'block';
});
window.addEventListener('unhandledrejection', (err) =>
{
    doms.errorWindow.content.innerText = (err.reason && err.reason.stack ? err.reason.stack : err.reason.message);
    doms.errorWindow.window.style.display = 'block';
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
        { name: 'clickRaw', url: './assets/clickRaw128.png' },

        { name: 'pauseButton', url: './assets/pauseButton.png' }
    ]).load((loader, resources) => {
        for (const name in resources) {
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
    });

    loader.onComplete.add((l, res) =>
    {
        assets.sounds = SoundLoader([
            { name: 'tap', url: './assets/sounds/Hitsound-Tap.ogg' },
            { name: 'drag', url: './assets/sounds/Hitsound-Drag.ogg' },
            { name: 'flick', url: './assets/sounds/Hitsound-Flick.ogg' }
        ]);

        doms.loadingStatus.innerText = 'All done!';
        doms.chartPackFileReadProgress.innerText = 'No chart pack file selected';
        doms.chartPackFile.disabled = false;
    });

    calcHeightPercent();

    if (!PIXIutils.isWebGLSupported())
    {
        doms.settings.forceCanvas.checked = true;
        doms.settings.forceCanvas.disabled = true;
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

function SoundLoader(soundList)
{
    let result = {};

    for (const soundObj of soundList)
    {
        result[soundObj.name] = new Howl({
            src: soundObj.url,
            preload: true,
            autoplay: false,
            loop: false
        });

        result[soundObj.name].load();
    }

    return result;
}

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

function calcHeightPercent()
{
    document.body.style.setProperty('--height-percent', document.documentElement.clientHeight / 1080);
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

    qs('.game-paused').style.display = 'none';
    qs('.play-result').style.display = 'none';
}

function exitGame()
{
    if (!_game) return;

    _game.destroy();
    _game = undefined;

    qs('.game-paused').style.display = 'none';
    qs('.play-result').style.display = 'none';

    doms.fileSelect.style.display = 'block';
}


window.pauseGame = pauseGame;
window.restartGame  = restartGame;
window.exitGame = exitGame;


function showGameResultPopup(game)
{
    let judge = game.judgement;

    qs('.play-result .title').innerHTML = 'Play result';
    if (game._settings.challengeMode) qs('.play-result .title').innerHTML += ' (challenge)';
    if (Number((game._settings.speed).toFixed(2)) !== 1) qs('.play-result .title').innerHTML += ' (x' + (game._settings.speed).toFixed(2) + ')';

    qs('.play-result .general-info .score .value').innerText = fillZero((judge.score.score).toFixed(0));
    if (judge.score.judgeLevel == 6) qs('.play-result .general-info .score .judge-level').innerText = 'Phi';
    else if (judge.score.judgeLevel == 5) qs('.play-result .general-info .score .judge-level').innerText = 'V';
    else if (judge.score.judgeLevel == 4) qs('.play-result .general-info .score .judge-level').innerText = 'S';
    else if (judge.score.judgeLevel == 3) qs('.play-result .general-info .score .judge-level').innerText = 'A';
    else if (judge.score.judgeLevel == 2) qs('.play-result .general-info .score .judge-level').innerText = 'B';
    else if (judge.score.judgeLevel == 1) qs('.play-result .general-info .score .judge-level').innerText = 'C';
    else qs('.play-result .general-info .score .judge-level').innerText = 'False';

    qs('.play-result .general-info .accurate .value').innerText = (judge.score.acc * 100).toFixed(2) + '%';
    qs('.play-result .general-info .accurate .max-combo .value').innerText = judge.score.maxCombo;

    if (judge.score.APType == 2) qs('.play-result .general-info .accurate .status').innerText = 'All Perfect';
    else if (judge.score.APType == 1) qs('.play-result .general-info .accurate .status').innerText = 'Full Combo';
    else qs('.play-result .general-info .accurate .status').innerText = '';
    if (judge.score._autoPlay) qs('.play-result .general-info .accurate .status').innerText = 'Auto Play';

    qs('.play-result .judge-detail .perfect .value').innerText = judge.score.perfect;
    qs('.play-result .judge-detail .good .value').innerText = judge.score.good;
    qs('.play-result .judge-detail .bad .value').innerText = judge.score.bad;
    qs('.play-result .judge-detail .miss .value').innerText = judge.score.miss;

    {
        qs('.play-result .judge-histogram').innerHTML = '';

        let noteJudgeTime = (!game._settings.challengeMode ? 200 : 100) / 1000;
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
                if (-20 <= acc && acc <= 20) value.style.background = '#FFECA0';
                else if (-40 <= acc && acc <= 40) value.style.background = '#B4E1FF';
                else value.style.background = '#6c4343';
            }
            else
            {
                if (-20 <= acc && acc <= 20) value.style.background = '#FFECA0';
                else if (-37.5 <= acc && acc <= 37.5) value.style.background = '#B4E1FF';
                else value.style.background = '#6c4343';
            }
            

            qs('.play-result .judge-histogram').appendChild(value);
        }

        let center = document.createElement('div');
        center.className = 'center';
        qs('.play-result .judge-histogram').appendChild(center);
    }

    qs('.play-result').style.display = 'block';

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