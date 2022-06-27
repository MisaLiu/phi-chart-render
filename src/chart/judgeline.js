import { Sprite } from 'pixi.js-legacy';

export default class Judgeline
{
    constructor(params)
    {
        this.id = !isNaN(params.id) ? Number(params.id) : -1;
        this.texture = 'judgeline';
        this.event = {
            speed: [],
            moveX: [],
            moveY: [],
            rotate: [],
            alpha: []
        };

        this.totalNotes = 0;
        this.totalRealNotes = 0;
        this.totalFakeNotes = 0;

        this.floorPosition = 0;
        this.alpha = 1;
        this.x = 0.5;
        this.y = 0.5;
        this.deg = 0;
        this.sinr = 0;
        this.cosr = 1;

        this.sprite = undefined;
    }

    sortEvent()
    {
        this.event.speed.sort(_sort);
        this.event.moveX.sort(_sort);
        this.event.moveY.sort(_sort);
        this.event.rotate.sort(_sort);
        this.event.alpha.sort(_sort);

        function _sort(a, b) {
            return a.startTime - b.startTime;
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
        
        return this.sprite;
    }

    calcTime(currentTime)
    {
        for (const i of this.event.speed)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            this.floorPosition = (currentTime - i.startTime) * i.value + i.floorPosition;
        }

        for (const i of this.event.moveX)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;
            
            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.x = i.start * time1 + i.end * time2;

            if (this.sprite) {
                this.sprite.position.x = this.x * this.sprite.parent.width;
            }
        }

        for (const i of this.event.moveY)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;
            
            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.y = i.start * time1 + i.end * time2;

            if (this.sprite) {
                this.sprite.position.y = this.y * this.sprite.parent.height;
            }
        }

        for (const i of this.event.rotate)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.deg = i.startDeg * time1 + i.endDeg * time2;
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
                this.sprite.alpha = this.alpha;
            }
        }
    }
}