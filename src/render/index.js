import * as PIXI from 'pixi.js-legacy';

export default class Render
{
    constructor(params)
    {
        this.noteScale = !isNaN(Number(params.noteScale)) ? Number(params.noteScale) : 8000;
        this.audioOffset = 0;
        this.bgDim = !isNaN(Number(params.bgDim)) ? Number(params.bgDim) : 0.5;
        
        this.parentNode = params.resizeTo ? params.resizeTo : (params.canvas ? params.canvas.parentNode : document.documentElement);
        this.pixi = new PIXI.Application({
            width           : !isNaN(Number(params.width)) ? Number(params.width) : document.documentElement.clientWidth,
            height          : !isNaN(Number(params.height)) ? Number(params.height) : document.documentElement.clientHeight,
            resolution      : !isNaN(Number(params.resolution)) ? Number(params.resolution) : window.devicePixelRatio,
            autoDensity     : params.autoDensity ? !!params.autoDensity : true,
            antialias       : params.antialias ? !!params.antialias : true,
            forceCanvas     : params.forceCanvas ? !!params.forceCanvas : false,
            view            : params.canvas ? params.canvas : undefined,
            backgroundAlpha : 1
        });

        this.sprites = {};
        this.sizer   = {};

        this.resize = this.resize.bind(this);

        this.sprites.mainContainer = new PIXI.Container();
        this.sprites.mainContainer.zIndex = 10;
        // this.pixi.stage.addChild(this.sprites.mainContainer);

        this.sprites.mainContainerMask = new PIXI.Graphics();
        this.sprites.mainContainer.mask = this.sprites.mainContainerMask;

        this.resize();
    }

    createBgSprites(bg)
    {
        if (!this.sprites.bg && bg)
        {
            this.sprites.bg = new PIXI.Sprite(bg);

            let bgCover = new PIXI.Graphics();

            bgCover.beginFill(0x000000);
            bgCover.drawRect(0, 0, this.sprites.bg.texture.width, this.sprites.bg.texture.height);
            bgCover.endFill();

            bgCover.position.x = -this.sprites.bg.width / 2;
            bgCover.position.y = -this.sprites.bg.height / 2;
            bgCover.alpha = 0.5;

            this.sprites.bg.addChild(bgCover);
            this.sprites.bg.anchor.set(0.5);

            // this.pixi.stage.addChild(this.sprites.bg);

            this.pixi.stage.sortChildren();
        }
    }

    addSprite(sprite)
    {
        if (this.sprites.mainContainer)
        {
            this.sprites.mainContainer.addChild(sprite);
            this.sprites.mainContainer.sortChildren();
        }
    }

    start()
    {
        this.pixi.view.style.backgroundColor = '#000000';
        this.resize();
    }
    
    resize()
    {
        if (!this.pixi) return;

        if (this.sprites)
        {
            if (this.sprites.mainContainer)
            {
                this.sprites.mainContainer.position.x = this.sizer.widthOffset;
            }

            if (this.sprites.mainContainerMask)
            {
                this.sprites.mainContainerMask.clear();
                this.sprites.mainContainerMask.beginFill(0xFFFFFF)
                    .drawRect(this.sizer.widthOffset, 0, this.sizer.width, this.sizer.height)
                    .endFill();
            }

            if (this.sprites.bg)
            {
                let bgScaleWidth = this.pixi.screen.width / this.sprites.bg.texture.width;
                let bgScaleHeight = this.pixi.screen.height / this.sprites.bg.texture.height;
                let bgScale = bgScaleWidth > bgScaleHeight ? bgScaleWidth : bgScaleHeight;

                this.sprites.bg.scale.set(bgScale);
                this.sprites.bg.position.set(this.pixi.screen.width / 2, this.pixi.screen.height / 2);

                if (this.sizer.widthOffset <= 0) this.sprites.bg.visible = false;
                else this.sprites.bg.visible = true;
            }
        }
    }
};