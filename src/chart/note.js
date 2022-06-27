import { Sprite } from 'pixi.js-legacy';

export default class Note {
    constructor(params) {
        this.lineId        = (!isNaN(Number(params.lineId)) && params.lineId >= 0) ? Number(params.lineId) : -1;
        this.type          = !isNaN(Number(params.type)) ? Number(params.type) : 1;
        this.time          = !isNaN(Number(params.time)) ? Number(params.time) : -1;
        this.holdTime      = (this.type === 3 && !isNaN(Number(params.holdTime))) ? Number(params.holdTime) : 0;
        this.speed         = !isNaN(Number(params.speed)) ? Number(params.speed) : 1;
        this.floorPosition = !isNaN(Number(params.floorPosition)) ? Number(params.floorPosition) : 0;
        this.positionX     = !isNaN(Number(params.positionX)) ? Number(params.positionX) : 0;
        this.yOffset       = !isNaN(Number(params.yOffset)) ? Number(params.yOffset) : 0;
        this.xScale        = !isNaN(Number(params.xScale)) ? Number(params.xScale) : 1;
        this.isAbove       = (params.isAbove instanceof Boolean) ? params.isAbove : true;
        this.isFake        = (params.isFake instanceof Boolean) ? params.isFake : false;
        this.isMulti       = (params.isMulti instanceof Boolean) ? params.isMulti : false;
        this.texture       = (params.texture && params.texture != '') ? params.texture : undefined;

        this.sprite = undefined;
    }

    createSprite(texture, zipFiles)
    {
        if (this.sprite) return this.sprite;

        this.sprite = new Sprite(
            (this.texture && this.texture != '' && this.texture != 'judgeline') ?
            zipFiles[judgeline.texture] :
            texture.judgeline
        );
        this.sprite.anchor.set(0.5);
        this.sprite.alpha = 1;
        
        return this.sprite;
    }
};