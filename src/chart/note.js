import { Sprite, Container, Text } from 'pixi.js-legacy';

export default class Note
{
    constructor(params)
    {
        this.id            = !isNaN(Number(params.id)) ? Number(params.id) : -1;
        this.type          = !isNaN(Number(params.type)) ? Number(params.type) : 1;
        this.time          = !isNaN(Number(params.time)) ? Number(params.time) : -1; // Note 开始时间
        this.holdTime      = (this.type === 3 && !isNaN(Number(params.holdTime))) ? Number(params.holdTime) : 0; // Note 按住需要经过的时间，仅 Hold
        this.holdTimeLength = this.type === 3 ? Math.fround(this.time + this.holdTime) : 0; // Note 按完的时间，自动计算，仅 Hold
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
        this.texture       = (params.texture && params.texture != '') ? params.texture : null;
        this.hitsound      = (params.hitsound && params.hitsound != '') ? params.hitsound : null;
        this.judgeline     = params.judgeline;

        if (!this.judgeline) throw new Error('Note must have a judgeline');

        this.isScored  = false;
        this.score     = 0;
        this.scoreTime = 0;
        
        this.sprite = undefined;
    }

    createSprite(texture, zipFiles, multiHL = true, debug = false)
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
        this.sprite.outScreen = true;

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
        if (debug)
        {
            let noteId = new Text(this.judgeline.id + (this.isAbove ? '+' : '-') + this.id, {
                fontSize: 168,
                fill: 0x0000FF
            });
            this.sprite.addChild(noteId);
            noteId.anchor.set(0.5);
            noteId.position.set(0);
            noteId.angle = this.isAbove ? 0 : 180;
        }

        return this.sprite;
    }

    calcTime(currentTime, size)
    {
        if (this.sprite)
        {
            let originX = size.widthPercent * this.positionX,
                _originY = Math.fround((this.floorPosition - this.judgeline.floorPosition) * this.speed * size.noteSpeed),
                originY = Math.fround(_originY * (this.isAbove ? -1 : 1)),

                realX = originY * this.judgeline.sinr * -1,
                realY = originY * this.judgeline.cosr,

                _holdLength = this.type === 3 ? Math.fround((this.endPosition - this.judgeline.floorPosition) * this.speed * size.noteSpeed) : _originY,
                holdLength = this.type === 3 ? Math.fround(_holdLength * (this.isAbove ? -1 : 1)) : originY;
            
            if (this.type === 3) // Hold 长度计算
            {
                if (this.time <= currentTime && this.holdTimeLength > currentTime)
                {
                    realX = realY = 0;

                    this.sprite.children[0].visible = false;
                    this.sprite.children[1].height = _holdLength / size.noteScale;
                    this.sprite.children[2].position.y = this.sprite.children[1].height * -1;
                }
                else
                {
                    this.sprite.children[0].visible = true;
                }
            }
            
            // Note 落在判定线时的绝对位置计算
            this.sprite.judgelineX = originX * this.judgeline.cosr + this.judgeline.sprite.position.x;
            this.sprite.judgelineY = originX * this.judgeline.sinr + this.judgeline.sprite.position.y;

            // Note 的绝对位置计算
            realX = this.sprite.judgelineX + realX;
            realY = this.sprite.judgelineY + realY;

            // Note 是否在舞台可视范围内
            this.sprite.outScreen = !isInArea({
                startX : realX,
                endX   : originX * this.judgeline.cosr - holdLength * this.judgeline.sinr + this.judgeline.sprite.position.x,
                startY : realY,
                endY   : holdLength * this.judgeline.cosr + originX * this.judgeline.sinr + this.judgeline.sprite.position.y
            }, {
                startX : size.startX,
                endX   : size.endX,
                startY : size.startY,
                endY   : size.endY
            });

            // 推送计算结果到精灵
            this.sprite.visible = !this.sprite.outScreen;

            this.sprite.position.x = realX;
            this.sprite.position.y = realY;
            
            this.sprite.angle = this.judgeline.sprite.angle + (this.isAbove ? 0 : 180);

            // Note 在舞台可视范围之内时做进一步计算
            if (!this.sprite.outScreen)
            {
                if (this.judgeline.alpha < 0) this.sprite.visible = false;

                // Note 特殊位置是否可视控制
                if (this.type !== 3 && this.time > currentTime && _originY < 0) this.sprite.visible = false;
                if (this.type !== 3 && this.isFake && this.time <= currentTime) this.sprite.visible = false;
                if (
                    this.type === 3 &&
                    (
                        (this.time > currentTime && _originY < 0) || // 时间未开始时 Hold 在判定线对面
                        (this.holdTimeLength <= currentTime) // Hold 已经被按完
                    )
                ) this.sprite.visible = false;
            }
        }
    }
};


function isInArea(sprite, area)
{
    let startX = sprite.startX <= sprite.endX ? sprite.startX : sprite.endX,
        endX = sprite.startX <= sprite.endX ? sprite.endX : sprite.startX,
        startY = sprite.startY <= sprite.endY ? sprite.startY : sprite.endY,
        endY = sprite.startY <= sprite.endY ? sprite.endY : sprite.startY;
    /*
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
    */
    
    if (
        (
            startX >= area.startX && startY >= area.startY &&
            endX <= area.endX && endY <= area.endY
        ) ||
        (
            endX >= area.startX && endY >= area.startY &&
            startX <= area.endX && startY <= area.endY
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