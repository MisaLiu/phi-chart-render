import { Sprite, Container, Text, Graphics } from 'pixi.js-legacy';

export default class Note
{
    constructor(params)
    {
        this.id               = !isNaN(Number(params.id)) ? Number(params.id) : -1;
        this.type             = !isNaN(Number(params.type)) ? Number(params.type) : 1;
        this.time             = !isNaN(parseFloat(params.time)) ? parseFloat(params.time) : -1; // Note 开始时间
        this.holdTime         = (this.type === 3 && !isNaN(parseFloat(params.holdTime))) ? parseFloat(params.holdTime) : 0; // Note 按住需要经过的时间，仅 Hold
        this.holdTimeLength   = this.type === 3 ? parseFloat(this.time + this.holdTime) : 0; // Note 按完的时间，自动计算，仅 Hold
        this.speed            = !isNaN(parseFloat(params.speed)) ? parseFloat(params.speed) : 1;
        this.floorPosition    = !isNaN(parseFloat(params.floorPosition)) ? parseFloat(params.floorPosition) : this.time;
        this.holdLength       = (this.type === 3 && !isNaN(parseFloat(params.holdLength))) ? parseFloat(params.holdLength) : 0;
        this.endPosition      = parseFloat(this.floorPosition + this.holdLength);
        this.positionX        = !isNaN(parseFloat(params.positionX)) ? parseFloat(params.positionX) : 0;
        this.basicAlpha       = (!isNaN(parseFloat(params.basicAlpha)) && parseFloat(params.basicAlpha) >= 0 && parseFloat(params.basicAlpha) <= 1) ? parseFloat(params.basicAlpha) : 1;
        this.visibleTime      = (!isNaN(parseFloat(params.visibleTime)) && params.visibleTime < 999999) ? parseFloat(params.visibleTime) : NaN;
        this.yOffset          = !isNaN(parseFloat(params.yOffset)) ? parseFloat(params.yOffset) : 0;
        this.xScale           = !isNaN(parseFloat(params.xScale)) ? parseFloat(params.xScale) : 1;
        this.isAbove          = !!params.isAbove;
        this.isFake           = !!params.isFake;
        this.isMulti          = !!params.isMulti;
        this.useOfficialSpeed = !!params.useOfficialSpeed;
        this.texture          = (params.texture && params.texture != '') ? params.texture : null;
        this.hitsound         = (params.hitsound && params.hitsound != '') ? params.hitsound : null;
        this.judgeline        = params.judgeline;

        this.sprite = undefined;

        if (!this.judgeline) throw new Error('Note must have a judgeline');

        this.reset();
    }

    reset()
    {
        this.isScored        = false;
        this.isScoreAnimated = false;
        this.isHolding       = false;
        this.lastHoldTime    = NaN;
        this.score           = 0;
        this.scoreTime       = 0;
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
            this.hitsound.load();
            /*
            this.hitsound.volume(0);
            this.hitsound.play();
            */
        }

        // For debug propose
        if (debug)
        {
            let noteInfoContainer = new Container();
            let noteId = new Text(this.judgeline.id + (this.isAbove ? '+' : '-') + this.id, {
                fontSize: 48,
                fill: 0x00E6FF
            });
            let notePosBlock = new Graphics()
                .beginFill(0x00E6FF)
                .drawRect(-22, -22, 44, 44)
                .endFill();
            
            noteId.anchor.set(0.5);
            noteId.position.set(0, -36 - noteId.height / 2);
            noteId.angle = this.isAbove ? 0 : 180;

            /*
            noteId.cacheAsBitmap = true;
            notePosBlock.cacheAsBitmap = true;
            */
            
            noteInfoContainer.addChild(noteId);
            noteInfoContainer.addChild(notePosBlock);

            this.debugSprite = noteInfoContainer;
        }

        return this.sprite;
    }

    calcTime(currentTime, size)
    {
        let _yOffset = size.height * this.yOffset,
            yOffset = _yOffset * (this.isAbove ? -1 : 1),
            originX = size.widthPercent * this.positionX,
            _originY = (this.floorPosition - this.judgeline.floorPosition) * (this.type === 3 && this.useOfficialSpeed ? 1 : this.speed) * size.noteSpeed + _yOffset,
            originY = _originY * (this.isAbove ? -1 : 1),

            realX = originY * this.judgeline.sinr * -1,
            realY = originY * this.judgeline.cosr,

            _holdLength = this.type === 3 ? (this.useOfficialSpeed ? (this.holdTimeLength - currentTime) : (this.endPosition - this.judgeline.floorPosition)) * this.speed * size.noteSpeed : _originY,
            holdLength = this.type === 3 ? _holdLength * (this.isAbove ? -1 : 1) : originY;
        
        if (!isNaN(this.judgeline.inclineSinr) && this.type !== 3)
        {
            let inclineValue = 1 - ((this.judgeline.inclineSinr * _originY) / 360);
            this.sprite.scale.set(inclineValue * this.sprite.baseScale * this.xScale, inclineValue * this.sprite.baseScale);
            originX *= inclineValue;
        }
        
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
        realX += this.sprite.judgelineX;
        realY += this.sprite.judgelineY;

        // Note 落在判定线时的绝对位置计算（补 y 轴偏移）
        this.sprite.judgelineX += yOffset * this.judgeline.sinr * -1;
        this.sprite.judgelineY += yOffset * this.judgeline.cosr;

        // Note 是否在舞台可视范围内
        this.sprite.outScreen = !isInArea({
            startX : realX,
            endX   : originX * this.judgeline.cosr - holdLength * this.judgeline.sinr + this.judgeline.sprite.position.x,
            startY : realY,
            endY   : holdLength * this.judgeline.cosr + originX * this.judgeline.sinr + this.judgeline.sprite.position.y
        }, size);

        // 推送计算结果到精灵
        this.sprite.visible = !this.sprite.outScreen;
        if (this.debugSprite) this.debugSprite.visible = !this.sprite.outScreen;

        this.sprite.position.x = realX;
        this.sprite.position.y = realY;
        
        this.sprite.angle = this.judgeline.sprite.angle + (this.isAbove ? 0 : 180);

        // Note 在舞台可视范围之内时做进一步计算
        if (!this.sprite.outScreen)
        {
            // Note 特殊位置是否可视控制
            if (this.type !== 3 && this.time > currentTime && _originY < 0 && this.judgeline.isCover) this.sprite.visible = false;
            if (this.type !== 3 && this.isFake && this.time <= currentTime) this.sprite.visible = false;
            if (
                this.type === 3 &&
                (
                    (this.time > currentTime && _originY < 0 && this.judgeline.isCover) || // 时间未开始时 Hold 在判定线对面
                    (this.holdTimeLength <= currentTime) // Hold 已经被按完
                )
            ) this.sprite.visible = false;
            
            if (!isNaN(this.visibleTime) && this.time - currentTime > this.visibleTime) this.sprite.visible = false;

            if (this.judgeline.alpha < 0)
            {
                if (this.judgeline.alpha >= -1) this.sprite.visible = false;
                else if (this.judgeline.alpha >= -2)
                {
                    if (this.originY > 0) this.sprite.visible = false;
                    else if (this.originY < 0) this.sprite.visible = true;
                }
            }

            if (this.debugSprite)
            {
                this.debugSprite.position = this.sprite.position;
                this.debugSprite.angle = this.sprite.angle;
                this.debugSprite.alpha = 0.2 + (this.sprite.visible ? (this.sprite.alpha * 0.8) : 0);

                if (this.time > currentTime)
                {
                    if (!this.sprite.visible)
                    {
                        this.sprite.visible = true;
                        this.sprite.alpha = 0.2;
                    }
                    else
                    {
                        this.sprite.alpha = this.basicAlpha;
                    }
                }
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
}