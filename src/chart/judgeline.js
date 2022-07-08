import { Sprite, Text } from 'pixi.js-legacy';

export default class Judgeline
{
    constructor(params)
    {
        this.id = !isNaN(params.id) ? Number(params.id) : -1;
        this.texture = 'judgeline';
        this.parentLine = params.parentLine ? params.parentLine : null;
        this.event = {
            speed: [],
            moveX: [],
            moveY: [],
            rotate: [],
            alpha: []
        };

        this.floorPosition = 0;
        this.alpha = 1;
        this.x = 0.5;
        this.y = 0.5;
        this.deg = 0;
        this.sinr = 0;
        this.cosr = 1;

        this.sprite = undefined;
    }

    sortEvent(withEndTime = false)
    {
        this.event.speed.sort(_sort);
        this.event.moveX.sort(_sort);
        this.event.moveY.sort(_sort);
        this.event.rotate.sort(_sort);
        this.event.alpha.sort(_sort);

        function _sort(a, b) {
            if (withEndTime)
            {
                return (a.startTime - b.startTime) + (a.endTime - b.endTime);
            }
            else
            {
                return a.startTime - b.startTime;
            }
        }
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

        // For debug propose
        
        let lineId = new Text(this.id, {
            fontSize: 24,
            fill: 0xFF0000
        });
        this.sprite.addChild(lineId);
        lineId.anchor.set(0.5);
        lineId.position.set(0);
        
        return this.sprite;
    }

    calcTime(currentTime, size)
    {
        for (const i of this.event.speed)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            this.floorPosition = Math.fround((currentTime - i.startTime) * i.value + i.floorPosition);
        }

        for (const i of this.event.moveX)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;
            
            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.x = i.start * time1 + i.end * time2;

            if (this.parentLine)
            {
                this.x += this.x * (this.parentLine.x - 0.5) * 2;
            }

            if (this.sprite) {
                this.sprite.position.x = this.x * size.width;
            }
        }

        for (const i of this.event.moveY)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;
            
            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.y = 1 - (i.start * time1 + i.end * time2);

            if (this.parentLine)
            {
                this.y += this.y * (this.parentLine.y - 0.5) * 2;
            }

            if (this.sprite) {
                this.sprite.position.y = this.y * size.height;
            }
        }

        for (const i of this.event.rotate)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.deg = i.start * time1 + i.end * time2;
            this.cosr = Math.cos(this.deg);
            this.sinr = Math.sin(this.deg);

            if (this.sprite) {
                this.sprite.rotation = this.deg;
            }
        }

        for (const i of this.event.alpha)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.alpha = i.start * time1 + i.end * time2;

            if (this.sprite) {
                this.sprite.alpha = this.alpha >= 0 ? this.alpha : 0;
            }
        }
        /**
        this.notes.forEach((note) =>
        {
            note.calcTime(currentTime, this, size);
        });
        **/
    }
}