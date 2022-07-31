import { Sprite, Container, Text } from 'pixi.js-legacy';

export default class Note
{
    constructor(params)
    {
        this.id            = !isNaN(Number(params.id)) ? Number(params.id) : -1;
        this.type          = !isNaN(Number(params.type)) ? Number(params.type) : 1;
        this.time          = !isNaN(Number(params.time)) ? Number(params.time.toPrecision(5)) : -1;
        this.holdTime      = (this.type === 3 && !isNaN(Number(params.holdTime))) ? Number(params.holdTime.toPrecision(5)) : 0;
        this.speed         = !isNaN(Number(params.speed)) ? Number(params.speed) : 1;
        this.floorPosition = !isNaN(Number(params.floorPosition)) ? Math.fround(params.floorPosition) : this.time;
        this.holdLength    = (this.type === 3 && !isNaN(Number(params.holdLength))) ? Math.fround(params.holdLength) : 0;
        this.endPosition   = Math.fround(this.floorPosition + this.holdLength);
        this.positionX     = !isNaN(Number(params.positionX)) ? Number(Number(params.positionX).toFixed(6)) : 0;
        this.basicAlpha    = (!isNaN(Number(params.basicAlpha)) && Number(params.basicAlpha) >= 0 && Number(params.basicAlpha) <= 1) ? Number(params.basicAlpha) : 1;
        this.yOffset       = !isNaN(Number(params.yOffset)) ? Number(params.yOffset) : 0;
        this.xScale        = !isNaN(Number(params.xScale)) ? Number(params.xScale) : 1;
        this.isAbove       = !!params.isAbove;
        this.isFake        = !!params.isFake;
        this.isMulti       = !!params.isMulti;
        this.forceSpeed    = this.type === 3 ? !!params.forceSpeed : false;
        this.texture       = (params.texture && params.texture != '') ? params.texture : undefined;
        this.hitsound      = (params.hitsound && params.hitsound != '') ? params.hitsound : undefined;
        this.judgeline     = params.judgeline;

        if (!this.judgeline) throw new Error('Note must have a judgeline');

        this.isScored = false;
        
        this.holdTimeLength = this.type === 3 ? Math.fround(this.time + this.holdTime) : 0;

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
        this.sprite.alpha = this.basicAlpha;
        this.sprite.visible = false;
        this.sprite.outScreen = this.type !== 3 ? true : false;

        if (this.hitsound)
        {
            this.hitsound = zipFiles[this.hitsound];
        }
        else{
            switch (this.type)
            {
                case 1:
                {
                    break;
                }
                case 2:
                {
                    break;
                }
                case 3:
                {
                    break;
                }
                case 4:
                {
                    break;
                }
            }
        }

        // For debug propose
        /*
        let noteId = new Text(this.judgeline.id + (this.isAbove ? '+' : '-') + this.id, {
            fontSize: 168,
            fill: 0x0000FF
        });
        this.sprite.addChild(noteId);
        noteId.anchor.set(0.5);
        noteId.position.set(0);
        */
        
        return this.sprite;
    }

    calcTime(currentTime, size)
    {
        if (this.sprite)
        {
            let originX = size.widthPercent * this.positionX,
                originY = (this.floorPosition - this.judgeline.floorPosition) * this.speed * (this.isAbove ? -1 : 1) * size.noteSpeed,
                realX = 0,
                realY = 0,
                holdEndX = originX,
                holdEndY = this.type === 3 ? this.holdLength * this.speed * size.noteSpeed / size.noteScale : 0;

            // Hold 的特殊位置写法
            if (
                this.type === 3 &&
                (
                    (this.floorPosition <= this.judgeline.floorPosition && this.endPosition > this.judgeline.floorPosition) ||
                    (this.time <= currentTime && this.holdTime > currentTime)
                )
            ) {
                let holdLength = Math.fround((this.endPosition - this.judgeline.floorPosition) * this.speed * size.noteSpeed / size.noteScale);
                originY = 0;

                this.sprite.children[0].visible = false;
                this.sprite.children[1].height = holdLength;
                this.sprite.children[2].position.y = holdLength * -1;
            }
            else if (this.type === 3 && this.floorPosition > this.judgeline.floorPosition)
            {
                this.sprite.children[0].visible = true;
            }

            realX = originX * this.judgeline.cosr - originY * this.judgeline.sinr + this.judgeline.sprite.position.x;
            realY = originY * this.judgeline.cosr + originX * this.judgeline.sinr + this.judgeline.sprite.position.y;

            holdEndX = holdEndX * this.judgeline.cosr - (holdEndY + originY) * this.judgeline.sinr + this.judgeline.sprite.position.x;
            holdEndY = (holdEndY + originY) * this.judgeline.cosr + originX * this.judgeline.sinr + this.judgeline.sprite.position.y;
            
            this.sprite.position.x = realX;
            this.sprite.position.y = realY;
            this.sprite.judgelineY = originX * this.judgeline.sinr + this.judgeline.sprite.position.y;
            this.sprite.angle = this.judgeline.sprite.angle + (this.isAbove ? 0 : 180);

            // 不渲染在屏幕外边的 Note
            this.sprite.outScreen = !isInArea({
                startX : realX,
                endX   : holdEndX,
                startY : realY,
                endY   : holdEndY
            }, {
                startX : size.startX,
                endX   : size.endX,
                startY : size.startY,
                endY   : size.endY
            });
            this.sprite.visible = !this.sprite.outScreen;

            // 针对 Hold 和 Fake note 的渲染思路优化
            if (
                this.type !== 3 &&
                this.isFake === true &&
                this.floorPosition <= this.judgeline.floorPosition &&
                currentTime - this.time >= 0
            ) {
                this.sprite.outScreen = true;
                this.sprite.visible = false;
            }
            else if (
                this.type === 3 &&
                this.endPosition <= this.judgeline.floorPosition &&
                currentTime - this.holdTimeLength >= 0
            ) {
                this.sprite.outScreen = true;
                this.sprite.visible = false;
            }

            if (this.sprite.outScreen === false)
            {
                if (this.judgeline.alpha < 0) this.sprite.visible = false;
                else if (this.judgeline.alpha >= 0) this.sprite.visible = true;

                if (this.type !== 3 && (currentTime < this.time || this.isFake))
                {
                    if (this.floorPosition < this.judgeline.floorPosition) this.sprite.visible = false;
                    else if (this.floorPosition >= this.judgeline.floorPosition) this.sprite.visible = true;
                }
                else if (this.type === 3)
                {
                    if (this.endPosition < this.judgeline.floorPosition) this.sprite.visible = false;
                    else if (this.endPosition >= this.judgeline.floorPosition) this.sprite.visible = true;
                }
            }
        }
    }
};


function isInArea(sprite, area)
{
    if (
        (
            isInValueArea(sprite.startX, area.startX, area.endX) ||
            isInValueArea(sprite.endX, area.startX, area.endX)
        ) &&
        (
            isInValueArea(sprite.startY, area.startY, area.endY) ||
            isInValueArea(sprite.endY, area.startY, area.endY)
        )
    ) {
        return true;
    }
    else
    {
        return false;
    }

    function isInValueArea(value, start, end)
    {
        if (value >= start && value <= end)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
}