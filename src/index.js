import * as PhiChartRender from './main';
import FontFaceObserver from 'fontfaceobserver';
import JSZip from 'jszip';
import { Texture, Rectangle } from 'pixi.js';
import { canvasRGB as StackBlur } from 'stackblur-canvas';
import Pica from 'pica';
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import './phizone';

(() =>
{
    if (import.meta.env.MODE === 'production')
    {
        // Init sentry
        Sentry.init({
            dsn: "https://c0f2c5052bd740c3b734b74c7dd6d350@o4504077358792704.ingest.sentry.io/4504077363183616",
            integrations: [ new BrowserTracing() ],
            tracesSampleRate: 1.0,
            maxBreadcrumbs: 50,
            debug: (import.meta.env.MODE === 'development'),
            release: (import.meta.env.MODE === 'production'),
            beforeSend: (event, hint) => {
                let err = hint.originalException;

                doms.errorWindow.content.innerText = (err.stack ? err.stack : err.message ? err.message : JSON.stringify(err, null, 4));
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
    skinPackFile: document.querySelector('input#file-skin-pack'),
    skinPackFileReadProgress: document.querySelector('div#loading-skin-pack'),

    file : {
        chart: document.querySelector('select#file-chart'),
        music: document.querySelector('select#file-music'),
        bg: document.querySelector('select#file-bg')
    },
    settings: {
        showBG: document.querySelector('input#settings-show-bg'),
        multiNoteHL: document.querySelector('input#settings-multi-note-hl'),
        showAPStatus: document.querySelector('input#settings-show-ap-status'),
        showInputPoint: document.querySelector('input#settings-show-input-point'),
        noteScale: document.querySelector('input#settings-note-scale'),
        bgDim: document.querySelector('input#settings-bg-dim'),
        bgBlur: document.querySelector('input#settings-bg-blur'),
        bgQuality: document.querySelector('select#settings-bg-quality'),

        offset: document.querySelector('input#settings-audio-offset'),
        useBrowserLatency: document.querySelector('input#settings-use-browser-latency'),
        testInputDelay: document.querySelector('button#settings-test-input-delay'),
        speed: document.querySelector('input#settings-audio-speed'),

        hitsound: document.querySelector('input#settings-hitsound'),
        hitsoundVolume: document.querySelector('input#settings-hitsound-volume'),

        challengeMode: document.querySelector('input#settings-challenge-mode'),
        plyndb: document.querySelector('input#settings-plyndb'),
        autoPlay: document.querySelector('input#settings-autoplay'),
        antiAlias: document.querySelector('input#settings-anti-alias'),
        lowResolution: document.querySelector('input#settings-low-resolution'),
        debug: document.querySelector('input#settings-debug'),
        prprExtra: document.querySelector('input#settings-prpr-extra')
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
    shaders: {},
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

var GlobalGame;

if (import.meta.env.MODE === 'development')
{
    window.qs = qs;
    window.doms = doms;
    window.files = files;
    window.assets = assets;
    window.currentFile = currentFile;
}

doms.chartPackFile.addEventListener('input', function ()
{
    if (this.files.length <= 0) return;
    console.log(this.files);
    loadChartFiles(this.files);
});

doms.skinPackFile.addEventListener('input', function ()
{
    if (this.files.length <= 0 || !this.files[0]) return;

    JSZip.loadAsync(this.files[0], { createFolders: false })
        .then(async (result) =>
        {
            let loadSuccessCount = 0;

            for (const name in result.files)
            {
                let file = result.files[name];
                if (file.dir) continue;

                let fileFormatSplit = file.name.split('.');
                let fileFormat = fileFormatSplit[fileFormatSplit.length - 1];
                let newFile = new File(
                    [ (await file.async('blob')) ],
                    name,
                    {
                        type: '',
                        lastModified: file.date
                    }
                );

                newFile.format = fileFormat;

                (await (new Promise(() =>
                {
                    throw new Error('Just make a promise, plz ignore me');
                }))
                .catch(async () =>
                {
                    let imgBitmap = await createImageBitmap(newFile);
                    let texture = await Texture.from(imgBitmap);

                    let textureName = /^([a-zA-Z]+)\.[a-zA-Z]+$/.exec(newFile.name)[1];
                    textureName = textureName.replace(textureName[0], textureName[0].toLowerCase());

                    if (textureName.toLowerCase() == 'judgeline' || textureName.toLowerCase() == 'pauseButton') return;
                    if (!assets.textures[textureName]) return;

                    Texture.addToCache(texture, textureName);
                    assets.textures[textureName] = texture;

                    loadSuccessCount++;
                    doms.skinPackFileReadProgress.innerText = 'Load ' + newFile.name + ' successfully.';

                    return;
                })
                .catch(async () =>
                {
                    let audio = await loadAudio(newFile, false, true);

                    if (newFile.name.indexOf('Hitsound-') == 0)
                    {
                        let audioName = /^Hitsound\-([a-zA-Z]+)\.[a-zA-Z\d]+$/.exec(newFile.name)[1].toLowerCase();
                        if (!assets.sounds[audioName]) return;

                        assets.sounds[audioName] = audio;

                        loadSuccessCount++;
                        doms.skinPackFileReadProgress.innerText = 'Load ' + newFile.name + ' successfully.';
                    }

                    return;
                })
                .catch((e) =>
                {
                    /* No */
                }));
            }

            if (!(assets.textures.clickRaw instanceof Array))
            {
                let _clickTextures = [];

                for (let i = 0; i < Math.floor(assets.textures.clickRaw.height / assets.textures.clickRaw.width); i++) {
                    let rectangle = new Rectangle(0, i * assets.textures.clickRaw.width, assets.textures.clickRaw.width, assets.textures.clickRaw.width);
                    let texture = new Texture(assets.textures.clickRaw.baseTexture, rectangle);

                    Texture.addToCache(texture, 'clickRaw' + (i + 0));

                    texture.defaultAnchor.set(0.5);
                    _clickTextures.push(texture);
                }
                
                assets.textures.clickRaw = _clickTextures;
            }

            doms.skinPackFileReadProgress.innerText = 'Successfully load ' + loadSuccessCount + ' skin file(s).';
        })
        .catch((e) =>
        {
            doms.skinPackFileReadProgress.innerText = this.files[0].name + ' may not a vaild zip file.';
            console.error(e);
        }
    );
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

    let zipFiles = { ...files.all };

    if (!zipFiles['Tap.png']) zipFiles['Tap.png'] = assets.textures.tap;
    if (!zipFiles['TapHL.png']) zipFiles['TapHL.png'] = assets.textures.tapHL;
    if (!zipFiles['Drag.png']) zipFiles['Drag.png'] = assets.textures.drag;
    if (!zipFiles['DragHL.png']) zipFiles['DragHL.png'] = assets.textures.dragHL;
    if (!zipFiles['Flick.png']) zipFiles['Flick.png'] = assets.textures.flick;
    if (!zipFiles['FlickHL.png']) zipFiles['FlickHL.png'] = assets.textures.flickHL;
    if (!zipFiles['HoldHead.png']) zipFiles['HoldHead.png'] = assets.textures.holdHeadHL;
    if (!zipFiles['HoldHeadHL.png']) zipFiles['HoldHeadHL.png'] = assets.textures.holdHeadHL;
    if (!zipFiles['Hold.png']) zipFiles['Hold.png'] = assets.textures.holdBody;
    if (!zipFiles['HoldHL.png']) zipFiles['HoldHL.png'] = assets.textures.holdBodyHL;
    if (!zipFiles['HoldEnd.png']) zipFiles['HoldEnd.png'] = assets.textures.holdEnd;

    currentFile.chart.music = currentFile.music;
    if (currentFile.bg && doms.settings.showBG.checked)
    {
        let bgBlur = await Texture.from(await blurImage(await resizeImage(currentFile.bg, parseInt(doms.settings.bgQuality.value)), doms.settings.bgBlur.value));
        Texture.addToCache(bgBlur, doms.file.bg.value + '_blured');
        currentFile.chart.bg = bgBlur;
    }
    else
    {
        currentFile.chart.bg = null;
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

    GlobalGame = new PhiChartRender.Game({
        chart: currentFile.chart,
        assets: assets,
        effects: files.effects,
        zipFiles: zipFiles,
        render: {
            resizeTo: document.documentElement,
            resolution: doms.settings.lowResolution.checked ? 1 : window.devicePixelRatio,
            antialias: doms.settings.antiAlias.checked
        },
        settings: {
            multiNoteHL: doms.settings.multiNoteHL.checked,
            showAPStatus: doms.settings.showAPStatus.checked,
            showInputPoint: doms.settings.showInputPoint.checked,
            bgDim: doms.settings.bgDim.value,
            noteScale: 10000 - doms.settings.noteScale.value,

            audioOffset: doms.settings.offset.value / 1000 + (doms.settings.useBrowserLatency.checked ? PhiChartRender.WAudio.globalLatency : 0),
            speed: doms.settings.speed.value,

            hitsound: doms.settings.hitsound.checked,
            hitsoundVolume: doms.settings.hitsoundVolume.value,

            challengeMode: doms.settings.challengeMode.checked,
            autoPlay: doms.settings.autoPlay.checked,
            debug: doms.settings.debug.checked,
            shader: doms.settings.prprExtra.checked
        },
        watermark: 'github/MisaLiu/phi-chart-render ' + GIT_VERSION + (import.meta.env.MODE === 'development' ? ' [Develop Mode]' : '')
    });

    document.body.appendChild(GlobalGame.render.view);
    GlobalGame.render.view.classList.add('canvas-game');

    GlobalGame.on('start', () => console.log('Game started!'));
    GlobalGame.on('pause', () => {
        console.log('Game paused!');
        qs('.game-paused').style.display = 'block';
    });
    GlobalGame.on('end', (game) => {
        console.log('Game ended!');
        showGameResultPopup(game);
    });

    if (doms.settings.plyndb.checked) GlobalGame.on('tick', PlayLikeYouNeverDidBefore);

    GlobalGame.createSprites();
    GlobalGame.start();

    // eruda.hide();

    if (import.meta.env.MODE === 'development')
    {
        window._game = GlobalGame;
        window.globalThis.__PIXI_APP__ = GlobalGame.render;
    }

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

    (await (async (resources = [], options = {}) =>
    {
        for (const resource of resources)
        {
            doms.loadingStatus.innerText = 'Loading hitsound ' + resource.name + ' ...';

            try
            {
                let res = await requestFile(resource.url);
                let audio = await loadAudio(res, false, options.noTimer);

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
    ], { noTimer: true }));

    (await (async (resources = [], options = {}) =>
    {
        for (const resource of resources)
        {
            doms.loadingStatus.innerText = 'Loading result music ' + resource.name + ' ...';

            try
            {
                let res = await requestFile(resource.url);
                let audio = await loadAudio(res, options.loop, options.noTimer);

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
        { name: 'at', url: './assets/sounds/result/at.ogg' },
        { name: 'sp', url: './assets/sounds/result/sp.ogg' },
        { name: 'spGlitch', url: './assets/sounds/result/sp_glitch.ogg' },
    ], { loop: true, noTimer: true }));

    doms.loadingStatus.innerText = 'All done!';
    doms.chartPackFileReadProgress.innerText = 'No chart pack file selected';
    doms.chartPackFile.disabled = false;
    doms.skinPackFile.disabled = false;

    calcHeightPercent();

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

    {
        let listTabs = document.querySelectorAll('div.tab div.bar > *');
        let listTabContents = document.querySelectorAll('div.tab div.content > *[id^="tab-"]');

        for (const tab of listTabs)
        {
            tab.addEventListener('click', switchTab);
        }

        for (let i = 0; i < listTabContents.length; i++)
        {
            let content = listTabContents[i];
            if (i === 0) content.style.display = 'block';
            else content.style.display = 'none';
        }
    }

    if (import.meta.env.MODE === 'production')
    {
        fetch('https://www.googletagmanager.com/gtag/js?id=G-PW9YT2TVFV')
            .then(res => res.text())
            .then(res =>
            {
                eval(res);
                window.dataLayer = window.dataLayer || [];
                window.gtag = function() {dataLayer.push(arguments);};
                gtag('js', new Date());
                gtag('config', 'G-PW9YT2TVFV');
            })
            .catch(e =>
            {
                console.error('Failed to load Google Analytics');
                console.error(e);
            }
        );
    }

    initConsoleEasterEgg();

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
});

function readArrayBuffer(file)
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

        reader.readAsArrayBuffer(file);
    });
}

function loadAudio(file, loop = false, noTimer = false)
{
    return new Promise(async (res, rej) =>
    {
        try {
            let arrayBuffer = await readArrayBuffer(file);
            let audio = await PhiChartRender.WAudio.from(arrayBuffer, loop, noTimer);
            res(audio);
        } catch (e) {
            rej(e);
        }
    });
}

function CsvReader(_text)
{
    let firstRow = [];
    let result = [];

    _text.split(/[\r\n]+/).forEach((row, rowIndex) =>
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
    let rows = (_text + '').split(/[\r\n]+/);
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

function resizeImage(_texture, quality = 1)
{
    let canvas = document.createElement('canvas');
    let texture;
    let pica = Pica({
        features: ['all']
    });

    if (_texture.baseTexture) texture = _texture.baseTexture.resource.source;
    else texture = _texture;

    switch (quality)
    {
        case 0: {
            canvas.width = 480;
            canvas.height = texture.height * (480 / texture.width);
            break;
        }
        case 1:
        {
            canvas.width = 720;
            canvas.height = texture.height * (720 / texture.width);
            break;
        }
        case 2:
        {
            canvas.width = 1080;
            canvas.height = texture.height * (1080 / texture.width);
            break;
        }
        default:
        {
            canvas.width = texture.width;
            canvas.height = texture.height;
        }
    }

    return (new Promise(async (res, rej) =>
    {
        res(await createImageBitmap(await pica.resize(texture, canvas)));
    }));
}

function calcHeightPercent()
{
    let realWidth = document.documentElement.clientHeight / 9 * 16 < document.documentElement.clientWidth ? document.documentElement.clientHeight / 9 * 16 : document.documentElement.clientWidth;

    document.body.style.setProperty('--height-percent', document.documentElement.clientHeight / 1080);
    document.body.style.setProperty('--width-offset', (document.documentElement.clientWidth - realWidth) / 2 + 'px');
}

function pauseGame()
{
    if (!GlobalGame) return;

    GlobalGame.pause();

    if (GlobalGame._isPaused)
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
    if (!GlobalGame) return;

    GlobalGame.restart();

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
    if (!GlobalGame) return;

    GlobalGame.destroy(true);
    GlobalGame = undefined;

    if (import.meta.env.MODE === 'development')
    {
        window._game = undefined;
        window.globalThis.__PIXI_APP__ = undefined;
    }

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
            case 'sp':
            {
                if (judge.score.levelPassed)
                {
                    assets.sounds.result.spGlitch.stop();
                    assets.sounds.result.spGlitch.play();
                }
                else
                {
                    assets.sounds.result.sp.stop();
                    assets.sounds.result.sp.play();
                }
                
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

function switchTab(e)
{
    let targetTab = e.target;
    let targetTabContent = targetTab.dataset.tabId;

    if (!document.querySelector('div.tab div.content > *#tab-' + targetTabContent)) return;

    for (const tab of document.querySelectorAll('div.tab div.bar > *'))
    {
        tab.classList.remove('active');
    }
    
    for (const content of document.querySelectorAll('div.tab div.content > *[id^="tab-"]'))
    {
        content.style.display = 'none';
    }

    targetTab.classList.add('active');
    document.querySelector('div.tab div.content > *#tab-' + targetTabContent).style.display = 'block';
}

async function loadChartFiles(_files)
{
    let fileList = [ ..._files ];

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
        else if (file.name === 'extra.json')
        {
            if (files.effects instanceof Array)
            {
                console.warn('Already loaded an extra.json, previously loaded file will be overwritten');
                files.effects = null;
            }

            try {
                let rawText = await readText(file);
                let effects = PhiChartRender.Effect.from(JSON.parse(rawText));

                files.effects = effects;
                files.all[file.name] = effects;

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
                let audio = await loadAudio(file, false, false);

                files.musics[file.name] = audio;
                files.all[file.name] = audio;
                doms.file.music.appendChild(createSelectOption(file));

                return;
            })
            .catch(async () =>
            {
                let shaderRaw = await readText(file);
                let shader = PhiChartRender.Shader.from(shaderRaw, file.name);

                files.shaders[file.name] = shader;
                files.all[file.name] = shader;
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

    function createSelectOption(file)
    {
        let option = document.createElement('option');
        option.innerText = option.value = file.name;
        return option;
    }
}

async function initConsoleEasterEgg()
{
    try {
        let url = await getImageBase64('./icons/64.png');
        console.log('%c ', 'padding:32px;background:url(' + url + ') center center no-repeat;');
    } catch (e) {}
    
    console.log('%cphi-chart-render%c' + GIT_VERSION, 'padding:8px;background-color:#1C1C1C;color:#FFF', 'padding:8px;background-color:#1E90FF;color:#FFF;');
    
    try {
        let url = await getImageBase64('./icons/github.png');
        console.log('%chttps://github.com/MisaLiu/phi-chart-render', 'padding:4px;padding-left:22px;background:url(' + url + ') left center no-repeat;background-color:#1C1C1C;background-size:contain;color:#FFF;');
    } catch (e) {
        console.log('%cGitHub: https://github.com/MisaLiu/phi-chart-render', 'padding:4px;background-color:#1C1C1C;color:#FFF;');
    }
    
    console.groupCollapsed('❤️ Support me');
    try {
        let url = await getImageBase64('./icons/patreon.png');
        console.log('%chttps://patreon.com/HIMlaoS_Misa', 'padding:4px;padding-left:22px;background:url(' + url + ') left center no-repeat;background-color:#f3455c;background-size:contain;color:#FFF;');
    } catch (e) {
        console.log('%Patreon: https://patreon.com/HIMlaoS_Misa', 'padding:4px;background-color:#f3455c;color:#FFF;');
    }
    
    try {
        let url = await getImageBase64('./icons/afdian.png');
        console.log('%chttps://afdian.net/@MisaLiu', 'padding:4px;padding-left:22px;background:url(' + url + ') left center no-repeat;background-color:#946CE6;background-size:contain;color:#FFF;');
    } catch (e) {
        console.log('%爱发电: https://afdian.net/@MisaLiu', 'padding:4px;background-color:#946CE6;color:#FFF;');
    }

    console.groupEnd();

    function getImageBase64(url) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(res => res.blob())
                .then(res => {
                    let reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result);
                    };
                    reader.onerror = (e) => {
                        reject(e);
                    };
                    reader.readAsDataURL(res);
                }
            );
        });
    }
}

function PlayLikeYouNeverDidBefore(game, currentTime)
{
    let currentSpeed = 1 + 0.5 * Math.sin(1.5708 * (currentTime % 2));
    game.chart.music.speed = currentSpeed;
    game.chart.sprites.info.songName.text = game.chart.info.name + ' (x' + Math.round(currentSpeed * 100) / 100 + ')';
}

export { loadChartFiles };
