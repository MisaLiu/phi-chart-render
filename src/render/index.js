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

        if (this.bg)
        {
            this.sprites.bg = new PIXI.Sprite(this.bg);

            let bgCover = new PIXI.Graphics();

            bgCover.beginFill(0x000000);
            bgCover.drawRect(0, 0, this.sprites.bg.texture.width, this.sprites.bg.texture.height);
            bgCover.endFill();

            bgCover.position.x = -this.sprites.bg.width / 2;
            bgCover.position.y = -this.sprites.bg.height / 2;
            bgCover.alpha = 1 - this.bgDim;

            this.sprites.bg.addChild(bgCover);
            this.sprites.bg.anchor.set(0.5);
            // this.pixi.stage.addChild(this.sprites.bg);
            this.sprites.mainContainer.addChild(this.sprites.bg);
        }

        this.chart.judgelines.forEach((judgeline, index) =>
        {
            judgeline.createSprite(this.texture, this.zipFiles);

            judgeline.sprite.position.x = this.renderSize.width / 2;
            judgeline.sprite.position.y = this.renderSize.height / 2;
            judgeline.sprite.zIndex = index + 1;

            // this.pixi.stage.addChild(judgeline.sprite);
            this.sprites.mainContainer.addChild(judgeline.sprite);
        });

        this.chart.notes.forEach((note, index) =>
        {
            note.createSprite(this.texture, this.zipFiles);
            note.sprite.zIndex = this.chart.judgelines.length + (note.type === 3 ? index : index + 10);

            // this.pixi.stage.addChild(note.sprite);
            this.sprites.mainContainer.addChild(note.sprite);
        });

        this.sprites.mainContainer.sortChildren();
        this.resize();
    }

    addSprite(sprite, name)
    {
        if (this.sprites.mainContainer)
        {
            if (name) this.sprites[name] = sprite;
            this.sprites.mainContainer.addChild(sprite);
        }
    }

    async start()
    {
        this.pixi.view.style.backgroundColor = '#000000';
        this.audioContext = this.music.play();
        this.pixi.ticker.add(this.tick);
    }

    tick()
    {
        let currentTime = (this.audioContext.progress * this.music.duration) - this.audioOffset - this.chart.offset;
        this.chart.calcTime(currentTime, this.renderSize);
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

        if (this.sprites)
        {
            if (this.sprites.mainContainer)
            {
                this.sprites.mainContainer.position.x = this.renderSize.widthOffset;
            }

            if (this.sprites.bg)
            {
                let bgScaleWidth = this.renderSize.width / this.sprites.bg.texture.width;
                let bgScaleHeight = this.renderSize.height / this.sprites.bg.texture.height;
                let bgScale = bgScaleWidth > bgScaleHeight ? bgScaleWidth : bgScaleHeight;

                this.sprites.bg.scale.set(bgScale);
                this.sprites.bg.position.set(this.renderSize.width / 2, this.renderSize.height / 2);
            }
        }

        if (this.chart)
        {
            if (this.chart.judgelines && this.chart.judgelines.length > 0)
            {
                this.chart.judgelines.forEach((judgeline) =>
                {
                    if (!judgeline.sprite) return;

                    judgeline.sprite.height = this.renderSize.lineScale * 18.75 * 0.008;
                    judgeline.sprite.width = judgeline.sprite.height * judgeline.sprite.texture.width / judgeline.sprite.texture.height * 1.042;
                });
            }

            if (this.chart.notes && this.chart.notes.length > 0)
            {
                this.chart.notes.forEach((note) =>
                {
                    if (note.type === 3)
                    {
                        note.sprite.children[1].height = note.holdLength * this.renderSize.noteSpeed / this.renderSize.noteScale;
                        note.sprite.children[2].position.y = -(note.holdLength * this.renderSize.noteSpeed / this.renderSize.noteScale);
                    }

                    note.sprite.scale.set(this.renderSize.noteScale * note.xScale, this.renderSize.noteScale);
                });
            }
        }
    }
};