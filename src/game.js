import Render from './render';
import Judgement from './judgement';

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
        this.chart.createSprites(
            this.render.sprites.mainContainer,
            this.render.renderSize,
            this.render.bgDim,
            this.texture,
            this.zipFiles
        );
        this.judgement.createSprites();
        this.render.createBgSprites(this.chart.bg);
        this.render.sprites.mainContainer.sortChildren();
    }

    start()
    {
        this.resizeRender();
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
        this.render.resize();
        this.judgement.resizeSprites(this.render.renderSize);
        this.chart.resizeSprites(this.render.renderSize);
    }
}