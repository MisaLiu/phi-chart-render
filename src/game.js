import Judgement from './judgement';
import * as PIXI from 'pixi.js-legacy';

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
  *         noteScale?,
  *         bgDim?,
  *         audioOffset?
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
        this.render = new PIXI.Application({
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
        this.render.mainContainer = new PIXI.Container();
        this.render.mainContainer.zIndex = 10;
        this.render.stage.addChild(this.render.mainContainer);

        // 创建舞台主渲染区可见范围
        this.render.mainContainerMask = new PIXI.Graphics();

        /* ===== 创建判定 ===== */
        this.judgement = new Judgement({
            chart   : this.chart,
            stage   : this.render.mainContainer,
            canvas  : this.render.view,
            texture : this.assets.textures.clickRaw,
            sounds  : this.assets.sounds
        });

        /* ===== 用户设置暂存 ===== */
        this._settings = {};
        this._settings.noteScale = params.settings && !isNaN(Number(params.settings.noteScale)) ? Number(params.settings.noteScale) : 8000;
        this._settings.bgDim     = params.settings && !isNaN((Number(params.settings.bgDim))) ? Number(params.settings.bgDim) : 0.5;
        this._settings.offset    = params.settings && !isNaN(Number(params.settings.audioOffset)) ? Number(params.settings.audioOffset) : 0;

        this.sprites = {};

        this._music = null;
        this._audioOffset = 0;

        this.resize = this.resize.bind(this);
        this._calcTick = this._calcTick.bind(this);

        this.resize(false);
        window.addEventListener('resize', this.resize);
    }

    createSprites()
    {
        if (this.chart.bg)
        { // 创建超宽屏舞台覆盖
            this.render.mainContainerCover = new PIXI.Sprite(this.chart.bg);
            let bgCover = new PIXI.Graphics();

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
            this._settings.bgDim,
            this.assets.textures,
            this.zipFiles
        );

        this.judgement.stage = this.render.mainContainer;
        this.judgement.createSprites();

        this.render.mainContainer.sortChildren();
        this.render.stage.sortChildren();
    }

    start()
    {
        if (!this.render) return;
        if (!this.chart.music) throw new Error('You must have a music to play');

        this.resize();

        this.render.ticker.add(this._calcTick);
        
        this.render.ticker.add(this.judgement.calcTick);
        this.chart.addFunction('note', this.judgement.calcNote);

        setTimeout(async () =>
        {
            this._music = await this.chart.music.play();
            this._audioOffset = this._music._source.context.baseLatency;
        }, 100);
    }

    _calcTick()
    {
        if (!this.chart) return;
        if (!this._music) return;
        this.chart.calcTime(this._music.progress * this.chart.music.duration - this._audioOffset - this._settings.offset);
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

    result.startX = -result.width / 4;
    result.endX   = result.width + result.width / 4;
    result.startY = -result.height / 4;
    result.endY   = result.height + result.height / 4;

    result.noteSpeed     = result.height * 0.6;
    result.noteScale     = result.width / noteScale;
    result.noteWidth     = result.width * 0.117775;
    result.lineScale     = result.height > result.height * 0.75 ? result.height / 18.75 : result.width / 14.0625;
    result.heightPercent = result.height / 1080;

    return result;
}