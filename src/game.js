import Render from './render';
import Judgement from './judgement';

import * as PIXI from 'pixi.js-legacy';

export default class Game
{
    constructor(params)
    {
        this.render = new Render({
            width       : params.render.width,
            height      : params.render.height,
            resolution  : params.render.resolution,
            autoDensity : params.render.autoDensity,
            antialias   : params.render.antialias,
            forceCanvas : params.render.forceCanvas,
            canvas      : params.render.canvas,
            resizeTo    : params.render.resizeTo,

            noteScale : params.render.noteScale,
            bgDim     : params.render.bgDim
        });
        this.judgement = new Judgement({
            chart   : params.chart,
            stage   : this.render.sprites.mainContainer,
            canvas  : params.render.canvas,
            texture : params.texture.clickRaw
        });
        this.chart    = params.chart;
        this.texture  = params.texture;
        this.zipFiles = params.zipFiles;

        this.sprites = {};

        this._music = null;

        if (!this.chart) throw new Error('You must select a chart to play');
        if (!this.texture) throw new Error('Render must use a texture object for creating sprites.');
        if (!this.zipFiles) this.zipFiles = {};

        this.resize = this.resize.bind(this);
        this._tick = this._tick.bind(this);

        this.render.resize();
        window.addEventListener('resize', this.resize);
    }

    createSprites()
    {
        // 创建舞台主渲染区
        this.render.mainContainer = new PIXI.Container();
        this.render.mainContainer.zIndex = 10;
        this.render.pixi.stage.addChild(this.render.mainContainer);
        
        // 创建舞台主渲染区可见范围
        this.render.mainContainerMask = new PIXI.Graphics();
        // this.render.mainContainer.mask = this.render.mainContainerMask;

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

            this.render.pixi.stage.addChild(this.render.mainContainerCover);
        }

        this.chart.createSprites(
            this.render.mainContainer,
            this.render.sizer,
            this.render.bgDim,
            this.texture,
            this.zipFiles
        );

        this.judgement.stage = this.render.mainContainer;
        this.judgement.createSprites();

        this.render.createBgSprites(this.chart.bg);

        this.render.mainContainer.sortChildren();
        this.render.pixi.stage.sortChildren();
        this.render.sprites.mainContainer.sortChildren();
    }

    start()
    {
        this.resize();
        this.chart.addFunction('note', this.judgement.calcNote);
        this.render.start();
        this.render.pixi.ticker.add(this.judgement.calcTick);
        this.chart.start(this.render.pixi.ticker);
    }

    _tick()
    {

    }

    resize()
    {
        if (!this.render) return;

        // this.render.resize();
        this.render.pixi.renderer.resize(this.render.parentNode.clientWidth, this.render.parentNode.clientHeight);

        // 计算新尺寸相关数据
        this.render.sizer = calcResizer(this.render.parentNode.clientWidth, this.render.parentNode.clientHeight, this.render.noteScale);

        // 主舞台区尺寸重计算
        this.render.mainContainer.position.x = this.render.sizer.widthOffset;

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
        
        if (this.render.mainContainerCover)
        {
            let bgScaleWidth = this.render.pixi.screen.width / this.render.mainContainerCover.texture.width;
            let bgScaleHeight = this.render.pixi.screen.height / this.render.mainContainerCover.texture.height;
            let bgScale = bgScaleWidth > bgScaleHeight ? bgScaleWidth : bgScaleHeight;

            this.render.mainContainerCover.scale.set(bgScale);
            this.render.mainContainerCover.position.set(this.render.pixi.screen.width / 2, this.render.pixi.screen.height / 2);

            this.render.mainContainerCover.visible = this.render.sizer.widerScreen;
        }
        
        this.render.resize();

        this.judgement.resizeSprites(this.render.sizer);
        this.chart.resizeSprites(this.render.sizer);
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