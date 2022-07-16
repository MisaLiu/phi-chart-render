import * as PIXI from 'pixi.js-legacy';

export default class Render
{
    constructor(params)
    {
        if (!params.texture) throw new Error('Render must use a texture object for creating sprites.');

        this.chart = undefined;
        this.music = undefined;
        this.bg = undefined;

        this.noteScale = !isNaN(Number(params.noteScale)) ? Number(params.noteScale) : 8000;
        this.audioOffset = 0;
        this.bgDim = 0.5;
        
        this.parentNode = params.resizeTo ? params.resizeTo : (params.canvas ? params.canvas.parentNode : document.documentElement);
        this.pixi = new PIXI.Application({
            width           : !isNaN(Number(params.width)) ? Number(params.width) : document.documentElement.clientWidth,
            height          : !isNaN(Number(params.height)) ? Number(params.height) : document.documentElement.clientHeight,
            resolution      : !isNaN(Number(params.resolution)) ? Number(params.resolution) : window.devicePixelRatio,
            autoDensity     : params.autoDensity instanceof Boolean ? params.autoDensity : true,
            antialias       : params.antialias instanceof Boolean ? params.antialias : true,
            forceCanvas     : params.forceCanvas instanceof Boolean ? params.forceCanvas : false,
            view            : params.canvas ? params.canvas : undefined,
            backgroundAlpha : 1
        });

        this.texture = params.texture;
        this.zipFiles = params.zipFiles;

        this.sprites = {};
        this.audioContext = undefined;

        this.renderSize = {};

        this.resize();
        window.addEventListener('resize', () => { this.resize() });

        this.tick = this.tick.bind(this);
    }

    static from (params)
    {
        if (!params) throw new Error('Please input an argument');
        if (!params.chart) throw new Error('You must input a chart');
        if (!params.music) throw new Error('You must input a music');
        if (!params.render || !params.render.canvas) throw new Error('You must input a canvas as stage');

        let render = new Render(params.render);

        render.chart = params.chart;
        render.music = params.music;
        render.bg = params.bg;

        return render;
    }

    createSprites()
    {
        this.sprites.mainContainer = new PIXI.Container();
        this.pixi.stage.addChild(this.sprites.mainContainer);

        this.chart.createSprites(this.sprites.mainContainer, this.renderSize, this.texture, this.zipFiles);

        this.sprites.mainContainer.sortChildren();
        this.resize();
    }

    addSprite(sprite)
    {
        if (this.sprites.mainContainer)
        {
            this.sprites.mainContainer.addChild(sprite);
        }
    }

    start()
    {
        this.pixi.view.style.backgroundColor = '#000000';
        this.chart.start(this.pixi.ticker);
        this.resize();
    }
    
    resize()
    {
        if (!this.pixi) return;

        this.pixi.renderer.resize(this.parentNode.clientWidth, this.parentNode.clientHeight);

        this.renderSize.width = (this.parentNode.clientHeight / 9 * 16 < this.parentNode.clientWidth ? this.parentNode.clientHeight / 9 * 16 : this.parentNode.clientWidth);
        this.renderSize.widthPercent = this.renderSize.width * (9 / 160);
        this.renderSize.widthOffset = (this.parentNode.clientWidth - this.renderSize.width) / 2;
        this.renderSize.height = this.parentNode.clientHeight;

        this.renderSize.startX = -this.renderSize.width / 5;
        this.renderSize.endX = this.renderSize.width + this.renderSize.width / 5;
        this.renderSize.startY = -this.renderSize.height / 5;
        this.renderSize.endY = this.renderSize.height + this.renderSize.height / 5;

        this.renderSize.noteSpeed = this.renderSize.height * 0.6;
        this.renderSize.noteScale = this.renderSize.width / this.noteScale;
        this.renderSize.lineScale = this.renderSize.height > this.renderSize.height * 0.75 ? this.renderSize.height / 18.75 : this.renderSize.width / 14.0625;

        if (this.chart)
        {
            this.chart.resizeSprites(this.renderSize);
        }
        

        if (this.sprites)
        {
            if (this.sprites.mainContainer)
            {
                this.sprites.mainContainer.position.x = this.renderSize.widthOffset;
            }
        }
    }
};