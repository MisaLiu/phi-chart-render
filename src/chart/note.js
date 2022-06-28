import { Sprite, Container } from 'pixi.js-legacy';

export default class Note
{
    constructor(params)
    {
        this.type          = !isNaN(Number(params.type)) ? Number(params.type) : 1;
        this.time          = !isNaN(Number(params.time)) ? Number(Number(params.time).toFixed(4)) : -1;
        this.holdTime      = (this.type === 3 && !isNaN(Number(params.holdTime))) ? Number(Number(params.holdTime).toFixed(4)) : 0;
        this.speed         = !isNaN(Number(params.speed)) ? Number(params.speed) : 1;
        this.floorPosition = !isNaN(Number(params.floorPosition)) ? Number(params.floorPosition) : this.time;
        this.holdLength    = (this.type === 3 && !isNaN(Number(params.holdLength))) ? Number(params.holdLength) : 0;
        this.endPosition   = this.floorPosition + this.holdLength;
        this.positionX     = !isNaN(Number(params.positionX)) ? Number(Number(params.positionX).toFixed(6)) : 0;
        this.yOffset       = !isNaN(Number(params.yOffset)) ? Number(params.yOffset) : 0;
        this.xScale        = !isNaN(Number(params.xScale)) ? Number(params.xScale) : 1;
        this.isAbove       = (params.isAbove instanceof Boolean) ? params.isAbove : true;
        this.isFake        = (params.isFake instanceof Boolean) ? params.isFake : false;
        this.isMulti       = (params.isMulti instanceof Boolean) ? params.isMulti : false;
        this.forceSpeed    = (this.type === 3 && (params.forceSpeed instanceof Boolean)) ? params.forceSpeed : false;
        this.texture       = (params.texture && params.texture != '') ? params.texture : undefined;
        this.judgeline     = params.judgeline;
        
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

    calcTime(currentTime, size)
    {
        if (this.sprite)
        {
            let originX = size.widthPercent * this.positionX,
                originY = (this.floorPosition - this.judgeline.floorPosition) * this.speed * (this.isAbove ? -1 : 1) * size.noteSpeed,
                realX = 0,
                realY = 0;

            // Hold 的特殊位置写法
            if (this.type === 3 && this.floorPosition <= this.judgeline.floorPosition && this.endPosition > this.judgeline.floorPosition)
            {
                originY = 0;

                if (this.sprite.children[0].visible === true) this.sprite.children[0].visible = false;
                this.sprite.children[1].height = (this.endPosition - this.judgeline.floorPosition) * size.noteSpeed / size.noteScale;
                this.sprite.children[2].position.y = -((this.endPosition - this.judgeline.floorPosition) * size.noteSpeed / size.noteScale);
            }
            else if (this.type === 3 && this.floorPosition > this.judgeline.floorPosition && this.sprite.children[0].visible === false)
            {
                this.sprite.children[0].visible = true;
            }

            realX = originX * this.judgeline.cosr - originY * this.judgeline.sinr + this.judgeline.sprite.position.x;
            realY = originY * this.judgeline.cosr + originX * this.judgeline.sinr + this.judgeline.sprite.position.y;

            this.sprite.position.x = realX;
            this.sprite.position.y = realY;
            this.sprite.angle = this.judgeline.sprite.angle + (this.isAbove ? 0 : 180);

            // 不渲染在屏幕外边的 Note
            if (
                (-size.halfWidth >= realX || size.halfWidth <= realX) &&
                (-size.halfHeight >= realY || size.halfHeight <= realY) &&
                this.sprite.visible === true
            ) {
                this.sprite.visible = false;
            }
            else if (
                (-size.halfWidth < realX && size.halfWidth > realX) &&
                (-size.halfHeight < realY && size.halfHeight > realY) &&
                this.sprite.visible === false
            ) {
                this.sprite.visible = true;
            }

            if (this.type !== 3)
            {
                if (this.floorPosition <= this.judgeline.floorPosition && this.sprite.visible === true) this.sprite.visible = false;
                else if (this.floorPosition > this.judgeline.floorPosition && this.sprite.visible === false) this.sprite.visible = true;
            }
            else
            {
                if (this.endPosition <= this.judgeline.floorPosition && this.sprite.visible === true) this.sprite.visible = false;
                else if (this.endPosition > this.judgeline.floorPosition && this.sprite.visible === false) this.sprite.visible = true;
            }
            
            
            /**
            if (currentTime < this.time)
            {
                if (this.judgeline.floorPosition >= this.floorPosition && this.sprite.visible === true) this.sprite.visible = false;
                else if (this.judgeline.floorPosition < this.floorPosition && this.sprite.visible === false) this.sprite.visible = true;
            }
            else
            {

            }
            **/
        }
    }
};