import { Sprite, Container } from 'pixi.js-legacy';

export default class Note
{
    constructor(params)
    {
        this.lineId        = (!isNaN(Number(params.lineId)) && params.lineId >= 0) ? Number(params.lineId) : -1;
        this.type          = !isNaN(Number(params.type)) ? Number(params.type) : 1;
        this.time          = !isNaN(Number(params.time)) ? Number(params.time) : -1;
        this.holdTime      = (this.type === 3 && !isNaN(Number(params.holdTime))) ? Number(params.holdTime) : 0;
        this.speed         = !isNaN(Number(params.speed)) ? Number(params.speed) : 1;
        this.holdLength    = this.type === 3 ? this.holdTime * this.speed : 0;
        this.floorPosition = !isNaN(Number(params.floorPosition)) ? Number(params.floorPosition) : 0;
        this.positionX     = !isNaN(Number(params.positionX)) ? Number(params.positionX) : 0;
        this.yOffset       = !isNaN(Number(params.yOffset)) ? Number(params.yOffset) : 0;
        this.xScale        = !isNaN(Number(params.xScale)) ? Number(params.xScale) : 1;
        this.isAbove       = (params.isAbove instanceof Boolean) ? params.isAbove : true;
        this.isFake        = (params.isFake instanceof Boolean) ? params.isFake : false;
        this.isMulti       = (params.isMulti instanceof Boolean) ? params.isMulti : false;
        this.forceSpeed    = (this.type === 3 && (params.forceSpeed instanceof Boolean)) ? params.forceSpeed : false;
        this.texture       = (params.texture && params.texture != '') ? params.texture : undefined;

        this.sprite = undefined;
    }

    createSprite(texture, zipFiles, multiHL = true)
    {
        if (this.sprite) return this.sprite;

        switch (this.type)
        {
            case 1:
            {
                this.sprite = new Sprite(
                    this.texture && this.texture != '' ?
                    zipFiles[this.texture] :
                    texture['tap' + (this.isMulti && multiHL ? 'HL' : '')]
                );
                break;
            }
            case 2:
            {
                this.sprite = new Sprite(
                    this.texture && this.texture != '' ?
                    zipFiles[this.texture] :
                    texture['drag' + (this.isMulti && multiHL ? 'HL' : '')]
                );
                break;
            }
            case 3:
            {
                if (this.texture && this.texture != '')
                {
                    this.sprite = new Sprite(zipFiles[this.texture]);
                    this.sprite.anchor.set(0.5, 1);
                    this.sprite.height = this.holdLength;
                }
                else
                {
                    this.sprite = new Container();

                    let head = new Sprite(texture['holdHead' + (this.isMulti && multiHL ? 'HL' : '')]);
                    let body = new Sprite(texture['holdBody' + (this.isMulti && multiHL ? 'HL' : '')]);
                    let end = new Sprite(texture['holdEnd']);

                    head.anchor.set(0.5);
                    body.anchor.set(0.5, 1);
                    end.anchor.set(0.5, 1);

                    body.height = this.holdLength;

                    head.position.set(0, head.height / 2);
                    body.position.set(0, 0);
                    end.position.set(0, -body.height);

                    this.sprite.addChild(head);
                    this.sprite.addChild(body);
                    this.sprite.addChild(end);
                }
                break;
            }
            case 4:
            {
                this.sprite = new Sprite(
                    this.texture && this.texture != '' ?
                    zipFiles[this.texture] :
                    texture['flick' + (this.isMulti && multiHL ? 'HL' : '')]
                );
                break;
            }
            default :
            {
                throw new Error('Unsupported note type: ' + this.type);
            }
        }

        if (this.type !== 3) this.sprite.anchor.set(0.5);
        if (!this.isAbove) this.sprite.angle = 180;
        this.sprite.alpha = 1;
        
        return this.sprite;
    }
};