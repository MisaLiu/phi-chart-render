import * as PIXI from 'pixi.js-legacy';

export default class Render
{
    constructor(params)
    {
        if (!params.texture) throw new Error('Render must use a texture object for creating sprites.');

        this.chart = null;
        this.music = null;
        this.bg = null;

        this.noteScale = !isNaN(Number(params.noteScale)) ? Number(params.noteScale) : 8000;
        this.audioOffset = 0;
        
        this.pixi = new PIXI.Application({
            width       : !isNaN(Number(params.width)) ? Number(params.width) : document.documentElement.clientWidth,
            height      : !isNaN(Number(params.height)) ? Number(params.height) : document.documentElement.clientHeight,
            resolution  : !isNaN(Number(params.resolution)) ? Number(params.resolution) : window.devicePixelRatio,
            autoDensity : (params.autoDensity !== undefined && params.autoDensity !== null) ? params.autoDensity : true,
            antialias   : (params.antialias !== undefined && params.antialias !== null) ? params.antialias : true,
            forceCanvas : (params.forceCanvas !== undefined && params.forceCanvas !== null) ? params.forceCanvas : false,
            view        : params.canvas ? params.canvas : undefined,
            resizeTo    : params.resizeTo ? params.resizeTo : (params.canvas ? params.canvas.parentElement : undefined)
        });

        this.texture = params.texture;

        this.resize();
        window.addEventListener('resize', () => { this.resize() });
    }

    static from (params)
    {
        if (!params) throw new Error('Please input an argument');
        if (!params.chart) throw new Error('You must input a chart');
        if (!params.music) throw new Error('You must input a music');
        if (!params.bg) throw new Error('You must input a bg');
        if (!params.render || !params.render.canvas) throw new Error('You must input a canvas as stage');

        let render = new Render(params.render);

        render.chart = params.chart;
        render.music = params.music;
        render.bg = params.bg;

        return render;
    }
    
    resize()
    {
        if (!this.pixi) return;

        this.pixi.renderer.fixedWidth = (this.pixi.resizeTo.clientHeight / 9 * 16 < this.pixi.resizeTo.clientWidth ? this.pixi.resizeTo.clientHeight / 9 * 16 : this.pixi.resizeTo.clientWidth);
        this.pixi.renderer.fixedWidthOffset = this.pixi.resizeTo.clientWidth - this.pixi.renderer.fixedWidth;

        this.pixi.renderer.noteSpeed = this.pixi.resizeTo.clientHeight * 0.6;
        this.pixi.renderer.noteScale = this.pixi.renderer.fixedWidth / this.noteScale;
        this.pixi.renderer.lineScale = this.pixi.renderer.fixedWidth > this.pixi.resizeTo.clientHeight * 0.75 ? this.pixi.resizeTo.clientHeight / 18.75 : this.pixi.renderer.fixedWidth / 14.0625;
    }
};