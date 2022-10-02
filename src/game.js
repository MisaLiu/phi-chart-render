import Judgement from './judgement';
import { Application, Container, Texture, Sprite, Graphics, Text } from 'pixi.js-legacy';

const PorgressBarCache = (() =>
{
    const pointSize = 18;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1920;
    canvas.height = 10;
    ctx.clearRect(0, 0, 1920, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1920, 10);

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
  *     asstes,
  *     zipFiles?,
  *     settings: {
  *         audioOffset?,
  *         hitsound?,
  *         hitsoundVolume?,
  *         speed?,
  *         noteScale?,
  *         bgDim?,
  *         multiHL?,
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
            hitsoundVolume : params.settings && !isNaN(Number(params.settings.hitsoundVolume)) ? Number(params.settings.hitsoundVolume) : 0.75,
            showAPStatus   : params.settings && params.settings.showAPStatus !== undefined && params.settings.showAPStatus !== null ? !!params.settings.showAPStatus : true,
            challengeMode  : params.settings && params.settings.challengeMode !== undefined && params.settings.challengeMode !== null ? !!params.settings.challengeMode : false,
            autoPlay       : params.settings && params.settings.autoPlay !== undefined && params.settings.autoPlay !== null ? !!params.settings.autoPlay : false
        });

        this.sprites = {};

        /* ===== 用户设置暂存 ===== */
        this._settings = {};
        this._settings.noteScale    = params.settings && !isNaN(Number(params.settings.noteScale)) ? Number(params.settings.noteScale) : 8000;
        this._settings.bgDim        = params.settings && !isNaN((Number(params.settings.bgDim))) ? Number(params.settings.bgDim) : 0.5;
        this._settings.offset       = params.settings && !isNaN(Number(params.settings.audioOffset)) ? Number(params.settings.audioOffset) : 0;
        this._settings.speed        = params.settings && !isNaN(Number(params.settings.speed)) ? Number(params.settings.speed) : 1;
        this._settings.showFPS      = params.settings && params.settings.showFPS ? !!params.settings.showFPS : true;
        this._settings.multiHL      = params.settings && params.settings.multiHL ? !!params.settings.multiHL : true;
        this._settings.showAPStatus = params.settings && params.settings.showAPStatus !== undefined && params.settings.showAPStatus !== null ? !!params.settings.showAPStatus : true;
        this._settings.debug        = params.settings && params.settings.debug ? !!params.settings.debug : false;

        this._music = null;
        this._audioOffset = 0;
        this._isPaused = false;

        this.resize = this.resize.bind(this);
        this._pauseBtnClickCallback = this._pauseBtnClickCallback.bind(this);
        this._calcTick = this._calcTick.bind(this);

        if (this._settings.speed < 0.25) throw new Error('Speed too slow');
        else if (this._settings.speed > 2) throw new Error('Speed too fast');

        this.resize(false);
        window.addEventListener('resize', this.resize);
    }

    createSprites()
    {
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
            this._settings.multiHL,
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

        this.render.mainContainer.sortChildren();
        this.render.stage.sortChildren();
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

        setTimeout(async () =>
        {
            this._music = await this.chart.music.play({ speed: this._settings.speed });
            this._audioOffset = this._music._source.context.baseLatency;

            this.chart.addFunction('note', this.judgement.calcNote);
            this.render.ticker.add(this._calcTick);
        }, 200);
    }

    pause()
    {
        this._isPaused = !this._isPaused;
        this.chart.music.paused = this._isPaused;
        this.judgement.input._isPaused = this._isPaused;
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

        if (!this.chart) return;
        if (!this._music) return;
        if (this._isPaused) return;
        let currentTime = this._music.progress * this.chart.music.duration - this._audioOffset - this.chart.offset + this._settings.offset;
        currentTime = currentTime > 0 ? currentTime : 0;

        this.chart.calcTime(currentTime);
        this.judgement.calcTick();

        this.sprites.progressBar.width =this._music.progress * this.render.sizer.width;
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
                this.sprites.progressBar.scale.y = this.render.sizer.heightPercent;
            }

            if (this.sprites.pauseButton)
            {
                this.sprites.pauseButton.position.x = this.render.sizer.width - this.render.sizer.heightPercent * 72;
                this.sprites.pauseButton.position.y = this.render.sizer.heightPercent * 74.5;
                this.sprites.pauseButton.scale.set(this.render.sizer.heightPercent * 0.94);
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
        
        if (withChartSprites)
        {
            this.judgement.resizeSprites(this.render.sizer);
            this.chart.resizeSprites(this.render.sizer);
        }
    }
}

function calcResizer(width, height,  noteScale = 8000)
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
    result.lineScale     = result.height > result.height * 0.75 ? result.height / 18.75 : result.width / 14.0625;
    result.heightPercent = result.height / 1080;

    return result;
}