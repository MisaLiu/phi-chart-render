import Judgement from './judgement';
import { Application, Container, Texture, Sprite, Graphics, Text } from 'pixi.js-legacy';

const PorgressBarCache = (() =>
{
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1920;
    canvas.height = 12;
    ctx.clearRect(0, 0, 1920, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1920, 12);

    return Texture.from(canvas);
})();

/**
  * {
  *     render: {
  *         width?,
  *         height?,
  *         resolution?,
  *         autoDensity?,
  *         antialias?,
  *         forceCanvas?,
  *         view?,
  *         resizeTo?
  *     },
  *     chart,
  *     assets,
  *     zipFiles?,
  *     watermark?,
  *     settings: {
  *         audioOffset?,
  *         hitsound?,
  *         hitsoundVolume?,
  *         speed?,
  *         noteScale?,
  *         bgDim?,
  *         multiNoteHL?,
  *         challengeMode?,
  *         autoPlay?,
  *         debug?
  *     }
  * }
 **/
export default class Game
{
    constructor(params)
    {
        /* ===== 加载谱面基本信息 ===== */
        this.chart    = params.chart;
        this.assets   = params.assets;
        this.zipFiles = params.zipFiles;

        if (!this.chart) throw new Error('You must select a chart to play');
        if (!this.assets) throw new Error('Render must use a texture object for creating sprites.');
        if (!this.zipFiles) this.zipFiles = {};

       /* ===== 创建 render ===== */
        this.render = new Application({
            width           : !isNaN(Number(params.render.width)) ? Number(params.render.width) : document.documentElement.clientWidth,
            height          : !isNaN(Number(params.render.height)) ? Number(params.render.height) : document.documentElement.clientHeight,
            resolution      : !isNaN(Number(params.render.resolution)) ? Number(params.render.resolution) : window.devicePixelRatio,
            autoDensity     : params.render.autoDensity ? !!params.render.autoDensity : true,
            antialias       : params.render.antialias ? !!params.render.antialias : true,
            forceCanvas     : params.render.forceCanvas ? !!params.render.forceCanvas : false,
            view            : params.render.canvas ? params.render.canvas : undefined,
            backgroundAlpha : 1
        });
        this.render.parentNode = params.render.resizeTo ? params.render.resizeTo : (params.render.canvas ? params.render.canvas.parentNode : this.render.view.parentElement);

        // 创建舞台主渲染区
        this.render.mainContainer = new Container();
        this.render.mainContainer.zIndex = 10;
        this.render.stage.addChild(this.render.mainContainer);

        // 创建舞台主渲染区可见范围
        this.render.mainContainerMask = new Graphics();
        this.render.mainContainerMask.cacheAsBitmap = true;

        /* ===== 创建判定 ===== */
        this.judgement = new Judgement({
            chart          : this.chart,
            stage          : this.render.mainContainer,
            canvas         : this.render.view,
            assets         : {
                textures : { normal: this.assets.textures.clickRaw, bad: this.assets.textures.clickRaw },
                sounds   : this.assets.sounds,
            },
            hitsound       : params.settings && params.settings.hitsound !== undefined && params.settings.hitsound !== null ? !!params.settings.hitsound : true,
            hitsoundVolume : params.settings && !isNaN(Number(params.settings.hitsoundVolume)) ? Number(params.settings.hitsoundVolume) : 1,
            showAPStatus   : params.settings && params.settings.showAPStatus !== undefined && params.settings.showAPStatus !== null ? !!params.settings.showAPStatus : true,
            challengeMode  : params.settings && params.settings.challengeMode !== undefined && params.settings.challengeMode !== null ? !!params.settings.challengeMode : false,
            autoPlay       : params.settings && params.settings.autoPlay !== undefined && params.settings.autoPlay !== null ? !!params.settings.autoPlay : false
        });

        this.sprites = {};
        this.functions = {
            start: [],
            pause: [],
            end: []
        };

        /* ===== 用户设置暂存 ===== */
        this._settings = {};
        this._settings.noteScale    = params.settings && !isNaN(Number(params.settings.noteScale)) ? Number(params.settings.noteScale) : 8000;
        this._settings.bgDim        = params.settings && !isNaN((Number(params.settings.bgDim))) ? Number(params.settings.bgDim) : 0.5;
        this._settings.offset       = params.settings && !isNaN(Number(params.settings.audioOffset)) ? Number(params.settings.audioOffset) : 0;
        this._settings.speed        = params.settings && !isNaN(Number(params.settings.speed)) ? Number(params.settings.speed) : 1;
        this._settings.showFPS      = params.settings && params.settings.showFPS !== undefined && params.settings.showFPS !== null ? !!params.settings.showFPS : true;
        this._settings.multiNoteHL  = params.settings && params.settings.multiNoteHL !== undefined && params.settings.multiNoteHL !== null ? !!params.settings.multiNoteHL : true;
        this._settings.showAPStatus = params.settings && params.settings.showAPStatus !== undefined && params.settings.showAPStatus !== null ? !!params.settings.showAPStatus : true;
        this._settings.debug        = params.settings && params.settings.debug ? !!params.settings.debug : false;

        this._watermarkText = params.watermark && params.watermark != '' ? params.watermark : 'github/MisaLiu/phi-chart-render';

        this._music = null;
        this._audioOffset = 0;
        this._animateStatus = NaN;
        this._gameStartTime = NaN;
        this._gameEndTime   = NaN;
        this._isPaused = false;

        this.resize = this.resize.bind(this);
        this._pauseBtnClickCallback = this._pauseBtnClickCallback.bind(this);
        this._calcTick = this._calcTick.bind(this);
        this._gameEndCallback = this._gameEndCallback.bind(this);

        if (this._settings.speed < 0.25) throw new Error('Speed too slow');
        else if (this._settings.speed > 2) throw new Error('Speed too fast');

        this.resize(false);
        window.addEventListener('resize', this.resize);
    }

    createSprites()
    {
        if (Math.round(this._settings.speed * 100) !== 100) 
        {
            this.chart.info.name += ' (x' + this._settings.speed.toFixed(2) + ')';
        }

        if (this.chart.bg)
        { // 创建超宽屏舞台覆盖
            this.render.mainContainerCover = new Sprite(this.chart.bg);
            let bgCover = new Graphics();

            bgCover.beginFill(0x000000);
            bgCover.drawRect(0, 0, this.render.mainContainerCover.texture.width, this.render.mainContainerCover.texture.height);
            bgCover.endFill();

            bgCover.position.x = -this.render.mainContainerCover.width / 2;
            bgCover.position.y = -this.render.mainContainerCover.height / 2;
            bgCover.alpha = 0.5;

            this.render.mainContainerCover.zIndex = 1;
            this.render.mainContainerCover.addChild(bgCover);
            this.render.mainContainerCover.anchor.set(0.5);

            this.render.stage.addChild(this.render.mainContainerCover);
        }

        this.chart.createSprites(
            this.render.mainContainer,
            this.render.sizer,
            this.assets.textures,
            this.zipFiles,
            this._settings.bgDim,
            this._settings.multiNoteHL,
            this._settings.debug
        );
        
        if (this._settings.showAPStatus)
        {
            this.chart.judgelines.forEach((judgeline) =>
            {
                if (!judgeline.sprite) return;
                judgeline.sprite.tint = 0xFFECA0;
            });
        }

        this.judgement.stage = this.render.mainContainer;
        this.judgement.createSprites();

        // 进度条
        this.sprites.progressBar = new Sprite(PorgressBarCache);
        this.sprites.progressBar.width = 0;
        this.sprites.progressBar.alpha = 0.75;
        this.sprites.progressBar.zIndex = 99999;
        this.render.mainContainer.addChild(this.sprites.progressBar);

        // 暂停按钮
        this.sprites.pauseButton = new Sprite(this.assets.textures.pauseButton);

        this.sprites.pauseButton.interactive = true;
        this.sprites.pauseButton.buttonMode = true;
        this.sprites.pauseButton.on('pointerdown', this._pauseBtnClickCallback);

        this.sprites.pauseButton.clickCount = 0;
        this.sprites.pauseButton.lastClickTime = Date.now();
        this.sprites.pauseButton.isEndRendering = false;
        this.sprites.pauseButton.lastRenderTime = Date.now();

        this.sprites.pauseButton.anchor.set(1, 0);
        this.sprites.pauseButton.alpha = 0.5;
        this.sprites.pauseButton.zIndex = 99999;
        this.render.mainContainer.addChild(this.sprites.pauseButton);

        // 假判定线，过场动画用
        this.sprites.fakeJudgeline = new Sprite(this.assets.textures.judgeline);
        this.sprites.fakeJudgeline.anchor.set(0.5);
        this.sprites.fakeJudgeline.zIndex = 99999;
        if (this._settings.showAPStatus) this.sprites.fakeJudgeline.tint = 0xFFECA0;
        this.render.mainContainer.addChild(this.sprites.fakeJudgeline);

        if (this._settings.showFPS)
        {
            this.render.fpsText = new Text('FPS: 0', {
                fontFamily: 'MiSans',
                align: 'right',
                fill: 0xFFFFFF
            });
            this.render.fpsText.anchor.x = 1;
            this.render.fpsText.alpha = 0.5;
            this.render.fpsText.zIndex = 999999;

            this.render.mainContainer.addChild(this.render.fpsText);
        }

        this.render.watermark = new Text(this._watermarkText, {
            fontFamily: 'MiSans',
            align: 'right',
            fill: 0xFFFFFF
        });
        this.render.watermark.anchor.set(1);
        this.render.watermark.alpha = 0.5;
        this.render.watermark.zIndex = 999999;
        this.render.mainContainer.addChild(this.render.watermark);

        this.render.mainContainer.sortChildren();
        this.render.stage.sortChildren();

        // 预播放 hitsound，也许能减轻打击未打击过的某类 note 时的卡顿问题？
        for (const name in this.assets.sounds)
        {
            this.assets.sounds[name].play({ volume: 0 });
        }
    }

    start()
    {
        if (!this.render) return;
        if (!this.chart.music) throw new Error('You must have a music to play');
        if (this._music) throw new Error('You have already started');

        this.resize();

        if (this.render.fpsText)
        {
            this.render.fpsCounter = setInterval(() =>
            {
                this.render.fpsText.text = 'FPS: ' + (this.render.ticker.FPS).toFixed(0);
            }, 500);
        }

        this._animateStatus = 0;
        this._gameStartTime = Date.now();

        this.chart.noteJudgeCallback = this.judgement.calcNote;
        this.render.ticker.add(this._calcTick);

        this.chart.calcTime(0);
        this.chart.judgelines.forEach((judgeline) =>
        {
            if (judgeline.sprite) judgeline.sprite.alpha = 0;
        });
        this.chart.notes.forEach((note) =>
        {
            if (note.sprite) note.sprite.alpha = 0;
        });
    }

    pause()
    {
        this._isPaused = !this._isPaused;

        if (!this._music) return;
        this.chart.music.paused = this._isPaused;
        this.judgement.input._isPaused = this._isPaused;

        if (this._isPaused)
        {
            this._runCallback('pause');
        }
    }

    restart()
    {

    }

    _pauseBtnClickCallback()
    {
        let pauseButton = this.sprites.pauseButton;
        pauseButton.clickCount++;
        if (pauseButton.clickCount >= 2 && Date.now() - pauseButton.lastClickTime <= 2000)
        {
            this.pause();

            pauseButton.lastRenderTime = Date.now();
            pauseButton.isEndRendering = true;
            pauseButton.clickCount = 0;
        }
        pauseButton.lastClickTime = Date.now();
    }

    _calcTick()
    {
        { // 为暂停按钮计算渐变
            let pauseButton = this.sprites.pauseButton;
            if (pauseButton.clickCount === 1)
            {
                if (pauseButton.alpha < 1)
                { // 按钮刚被点击一次
                    pauseButton.alpha = 0.5 + (0.5 * ((Date.now() - pauseButton.lastClickTime) / 200));
                }
                else if (pauseButton.alpha >= 1 && Date.now() - pauseButton.lastClickTime >= 2000)
                { // 按钮刚被点击一次，且 2s 后没有进一步操作
                    pauseButton.clickCount = 0;
                    pauseButton.lastRenderTime = Date.now();
                    pauseButton.isEndRendering = true;
                }
                else if (pauseButton.alpha >= 1)
                { // 按钮被点击一次，且 200ms 后不透明度已到 1
                    pauseButton.alpha = 1;
                    pauseButton.lastRenderTime = Date.now();
                }
            }
            else if (pauseButton.clickCount === 0 && pauseButton.isEndRendering)
            {
                if (pauseButton.alpha > 0.5)
                {
                    pauseButton.alpha = 1 - (0.5 * ((Date.now() - pauseButton.lastRenderTime) / 200));
                }
                else if (pauseButton.alpha <= 0.5)
                {
                    pauseButton.alpha = 0.5;
                    pauseButton.lastRenderTime = Date.now();
                    pauseButton.isEndRendering = false;
                }
            }
        }

        switch (this._animateStatus)
        {
            case 0:
            {
                this._calcGameAnimateTick(true);
                break;
            }
            case 1:
            {
                let currentTime = (this._music && this._music.progress ? this._music.progress * this.chart.music.duration : 0) - this._audioOffset - this.chart.offset + this._settings.offset;
                currentTime = currentTime > 0 ? currentTime : 0;

                this.chart.calcTime(currentTime);
                if (!this._isPaused) this.judgement.calcTick();

                this.sprites.progressBar.width = (this._music && this._music.progress ? this._music.progress : 0) * this.render.sizer.width;
                break;
            }
            case 2:
            {
                this._calcGameAnimateTick(false);
                break;
            }
            case 3:
            {
                break;
            }
        }
    }

    _calcGameAnimateTick(isStart = true)
    {
        let _progress = (Date.now() - (isStart ? this._gameStartTime : this._gameEndTime)) / 1500,
            progress = (isStart ? 1 - Math.pow(1 - _progress, 4) : Math.pow(1 - _progress, 4));
        let sprites = {
            score: this.judgement.score.sprites,
            chart: this.chart.sprites
        };

        // Combo、准度、分数、暂停按钮和进度条
        sprites.score.combo.container.position.y = -(sprites.score.combo.container.height + sprites.score.acc.height) + ((sprites.score.combo.container.height + sprites.score.acc.height + (this.render.sizer.heightPercent * 41)) * progress);
        sprites.score.acc.position.y = sprites.score.combo.container.position.y + (this.render.sizer.heightPercent * 72);
        sprites.score.score.position.y = -(sprites.score.score.height) + ((sprites.score.score.height + (this.render.sizer.heightPercent * 61)) * progress);
        if (this.sprites.pauseButton) this.sprites.pauseButton.position.y = -(this.sprites.pauseButton.height) + ((this.sprites.pauseButton.height + (this.render.sizer.heightPercent * 74.5)) * progress);
        if (this.sprites.progressBar) this.sprites.progressBar.position.y = -(this.render.sizer.heightPercent * 12) * (1 - progress);

        // 谱面信息
        sprites.chart.info.songName.position.y = (this.render.sizer.height + sprites.chart.info.songName.height) - ((sprites.chart.info.songName.height + (this.render.sizer.heightPercent * 66)) * progress);
        sprites.chart.info.songDiff.position.y = sprites.chart.info.songName.position.y + (this.render.sizer.heightPercent * 24);

        // 假判定线过场动画
        this.sprites.fakeJudgeline.width = this.render.sizer.width * progress;

        // 背景图亮度
        this.chart.sprites.bg.cover.alpha = this._settings.bgDim * progress;

        if (_progress >= 1)
        {
            if (isStart)
            {
                this._animateStatus = 1;
                this.resize();

                setTimeout(async () =>
                {
                    this._music = await this.chart.music.play({ speed: this._settings.speed, complete: this._gameEndCallback });
                    this._audioOffset = this._music._source.context.baseLatency;

                    this.chart.judgelines.forEach((judgeline) =>
                    {
                        if (judgeline.sprite) judgeline.sprite.alpha = 1;
                    });
                    this.chart.notes.forEach((note) =>
                    {
                        if (note.sprite) note.sprite.alpha = 1;
                    });

                    this._isPaused = false;
                    this.sprites.fakeJudgeline.visible = false;

                    this._runCallback('start');
                }, 200);
            }
            else
            {
                this._animateStatus = 3;
                this._isPaused = true;
                this._runCallback('end');
            }
        }
    }

    _gameEndCallback()
    {
        this._animateStatus = 2;
        this._gameEndTime = Date.now();
        this.sprites.fakeJudgeline.visible = true;
        if (this._settings.showAPStatus)
        {
            if (this.judgement.score.FCType === 1) this.sprites.fakeJudgeline.tint = 0xB4E1FF;
            else if (this.judgement.score.FCType === 0) this.sprites.fakeJudgeline.tint = 0xFFFFFF;
        }
        
        this.chart.judgelines.forEach((judgeline) =>
        {
            if (judgeline.sprite) judgeline.sprite.alpha = 0;
        });
        this.chart.notes.forEach((note) =>
        {
            if (note.sprite) note.sprite.alpha = 0;
        });

        this.judgement.input.sprite.clear();
    }

    on(type, callback)
    {
        if (!this.functions[type]) return;
        if (!(callback instanceof Function)) return;
        this.functions[type].push(callback);
    }

    _runCallback(type)
    {
        if (!this.functions[type]) return;
        this.functions[type].forEach((callback) => callback(this));
    }

    resize(withChartSprites = true)
    {
        if (!this.render) return;

        this.render.renderer.resize(this.render.parentNode.clientWidth, this.render.parentNode.clientHeight);

        // 计算新尺寸相关数据
        this.render.sizer = calcResizer(this.render.screen.width, this.render.screen.height, this._settings.noteScale);

        // 主舞台区位置重计算
        this.render.mainContainer.position.x = this.render.sizer.widthOffset;
        // 主舞台可视区域计算
        if (this.render.sizer.widerScreen && this.render.mainContainer)
        {
            this.render.mainContainer.mask = this.render.mainContainerMask;

            this.render.mainContainerMask.clear()
                .beginFill(0xFFFFFF)
                .drawRect(this.render.sizer.widthOffset, 0, this.render.sizer.width, this.render.sizer.height)
                .endFill();
        }
        else
        {
            this.render.mainContainer.mask = null;
        }
        // 主舞台超宽屏覆盖计算
        if (this.render.sizer.widerScreen && this.render.mainContainerCover)
        {
            let bgScaleWidth = this.render.screen.width / this.render.mainContainerCover.texture.width;
            let bgScaleHeight = this.render.screen.height / this.render.mainContainerCover.texture.height;
            let bgScale = bgScaleWidth > bgScaleHeight ? bgScaleWidth : bgScaleHeight;

            this.render.mainContainerCover.scale.set(bgScale);
            this.render.mainContainerCover.position.set(this.render.screen.width / 2, this.render.screen.height / 2);

            this.render.mainContainerCover.visible = true;
        }
        else if (this.render.mainContainerCover)
        {
            this.render.mainContainerCover.visible = false;
        }

        if (this.sprites)
        {
            if (this.sprites.progressBar)
            {
                this.sprites.progressBar.position.set(0, 0);
                this.sprites.progressBar.scale.y = this.render.sizer.heightPercent;
                this.sprites.progressBar.width = this._music ? this._music.progress * this.render.sizer.width : 0;
            }

            if (this.sprites.pauseButton)
            {
                this.sprites.pauseButton.position.x = this.render.sizer.width - this.render.sizer.heightPercent * 72;
                this.sprites.pauseButton.position.y = this.render.sizer.heightPercent * 74.5;
                this.sprites.pauseButton.scale.set(this.render.sizer.heightPercent * 0.94);
            }

            if (this.sprites.fakeJudgeline)
            {
                this.sprites.fakeJudgeline.position.x = this.render.sizer.width / 2;
                this.sprites.fakeJudgeline.position.y = this.render.sizer.height / 2;

                this.sprites.fakeJudgeline.height = this.render.sizer.lineScale * 18.75 * 0.008;
                this.sprites.fakeJudgeline.width = 0;
            }
        }

        // FPS 计数器尺寸计算
        if (this.render.fpsText)
        {
            this.render.fpsText.position.x     = this.render.sizer.width;
            this.render.fpsText.position.y     = 0;
            this.render.fpsText.style.fontSize = this.render.sizer.heightPercent * 32;
            this.render.fpsText.style.padding  = this.render.sizer.heightPercent * 8;
        }

        if (this.render.watermark)
        {
            this.render.watermark.position.x     = this.render.sizer.width;
            this.render.watermark.position.y     = this.render.sizer.height;
            this.render.watermark.style.fontSize = this.render.sizer.heightPercent * 20;
        }
        
        if (withChartSprites)
        {
            this.judgement.resizeSprites(this.render.sizer);
            this.chart.resizeSprites(this.render.sizer);
        }
    }
}

function calcResizer(width, height, noteScale = 8000)
{
    let result = {};

    result.width  = height / 9 * 16 < width ? height / 9 * 16 : width;
    result.height = height;
    result.widthPercent = result.width * (9 / 160);
    result.widthOffset  = (width - result.width) / 2;

    result.widerScreen = result.width < width ? true : false;

    result.startX = -result.width / 6;
    result.endX   = result.width + result.width / 6;
    result.startY = -result.height / 6;
    result.endY   = result.height + result.height / 6;

    result.noteSpeed     = result.height * 0.6;
    result.noteScale     = result.width / noteScale;
    result.noteWidth     = result.width * 0.117775;
    result.lineScale     = result.width > result.height * 0.75 ? result.height / 18.75 : result.width / 14.0625;
    result.heightPercent = result.height / 1080;

    return result;
}