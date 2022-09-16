import { Sprite, Text } from 'pixi.js-legacy';

export default class Judgeline
{
    constructor(params)
    {
        this.id = !isNaN(params.id) ? Number(params.id) : -1;
        this.texture = 'judgeline';
        this.parentLine = params.parentLine ? params.parentLine : null;

        this.eventLayers = [];
        this.floorPositions = [];
        
        this.extendEvent = {
            color: [],
            scaleX: [],
            scaleY: []
        };
        this.isText = false;

        this.speed = 1;
        this.x     = 0.5;
        this.y     = 0.5;
        this.alpha = 1;
        this.deg   = 0;
        this.sinr  = 0;
        this.cosr  = 1;

        this.floorPosition = 0;

        this.scaleX = 1;
        this.scaleY = 1;

        this.sprite = undefined;
    }

    sortEvent(withEndTime = false)
    {
        this.eventLayers.forEach((eventLayer) =>
        {
            eventLayer.sort();
        });

        /*
        for (const name in this.event)
        {
            this.event[name].sort(_sort);
        }

        for (const name in this.extendEvent)
        {
            this.extendEvent[name].sort(_sort);
        }

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
        */
    }

    calcFloorPosition()
    {
        if (this.eventLayers.length <= 0) throw new Error('No event layer in this judgeline');

        let sameTimeSpeedEventAlreadyExist = {};
        let currentFloorPosition = 0;
        let floorPositions = [];

        this.floorPositions = [];

        this.eventLayers.forEach((eventLayer) =>
        {
            eventLayer.speed.forEach((event) =>
            {
                let eventTime = (event.startTime).toFixed(3);

                if (!sameTimeSpeedEventAlreadyExist[eventTime])
                {
                    floorPositions.push({
                        startTime     : event.startTime,
                        endTime       : NaN,
                        floorPosition : NaN
                    });
                }

                sameTimeSpeedEventAlreadyExist[eventTime] = true;
            });
        });

        if (floorPositions.length <= 0) throw new Error('No any speed event in this judgeline');

        floorPositions.sort((a, b) => a.startTime - b.startTime);

        for (let floorPositionIndex = 0; floorPositionIndex < floorPositions.length; floorPositionIndex++)
        {
            let currentEvent = floorPositions[floorPositionIndex];
            let nextEvent = floorPositionIndex < floorPositions.length - 1 ? floorPositions[floorPositionIndex + 1] : { startTime: 1e9 };
            let currentTime = currentEvent.startTime;

            floorPositions[floorPositionIndex].floorPosition = Math.fround(currentFloorPosition);
            floorPositions[floorPositionIndex].endTime = nextEvent.startTime;

            currentFloorPosition += (nextEvent.startTime - currentEvent.startTime) * this._calcSpeedValue(currentTime);
        }

        this.floorPositions = floorPositions;
    }

    getFloorPosition(currentTime)
    {
        if (this.floorPositions.length <= 0) throw new Error('No floorPosition created, please call calcFloorPosition() first');

        let result = {};

        for (const floorPosition of this.floorPositions)
        {
            if (floorPosition.endTime < currentTime) continue;
            if (floorPosition.startTime > currentTime) break;

            result.startTime     = floorPosition.startTime;
            result.endTime       = floorPosition.endTime;
            result.floorPosition = floorPosition.floorPosition;
        }

        result.value = this._calcSpeedValue(currentTime);

        return result;
    }

    _calcSpeedValue(currentTime)
    {
        let result = 0;

        this.eventLayers.forEach((eventLayer) =>
        {
            let currentValue = 0;

            for (const event of eventLayer.speed)
            {
                if (event.endTime < currentTime) continue;
                if (event.startTime > currentTime) break;
                currentValue = event.value;
            }

            result += currentValue;
        });

        return result;
    }

    createSprite(texture, zipFiles)
    {
        if (this.sprite) return this.sprite;

        this.sprite = new Sprite(
            (this.texture && this.texture != '' && this.texture != 'judgeline') ?
            zipFiles[this.texture] :
            texture.judgeline
        );
        this.sprite.anchor.set(0.5);
        this.sprite.alpha = 1;

        // For debug propose
        /*
        let lineId = new Text(this.id, {
            fontSize: 24,
            fill: 0xFF0000
        });
        this.sprite.addChild(lineId);
        lineId.anchor.set(0.5);
        lineId.position.set(0);
        */
        
        return this.sprite;
    }

    calcTime(currentTime, size)
    {
        /*
        if (currentTime < this._lastCalcTime)
        {
            console.warn('I can\'t believe you done this.\nIf currentTime smaller than lastCalcTime, it may cause floorPosition problem.');
        }
        */

        this.speed = 0;
        this.x     = 0;
        this.y     = 0;
        this.alpha = 0;
        this.deg   = 0;

        this.eventLayers.forEach((eventLayer) =>
        {
            eventLayer.calcTime(currentTime);

            this.speed  += eventLayer._speed;
            this.x      += eventLayer._posX;
            this.y      += eventLayer._posY;
            this.alpha  += eventLayer._alpha;
            this.deg    += eventLayer._rotate;
        });

        for (const event of this.floorPositions)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            this.floorPosition = Math.fround((currentTime - event.startTime) * this.speed + event.floorPosition);
        };

        this.cosr = Math.cos(this.deg);
        this.sinr = Math.sin(this.deg);

        if (this.parentLine)
        {

        }

        if (this.sprite)
        {
            this.sprite.position.x = this.x * size.width;
            this.sprite.position.y = (1 - this.y) * size.height;
            this.sprite.alpha      = this.alpha >= 0 ? this.alpha : 0;
            this.sprite.rotation   = this.deg;
        }
        
        /*
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
                this.x = (this.x + this.parentLine.x) * 2 - 1.5;
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
                this.y = (this.y + this.parentLine.y) * 2 - 1.5;
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

            if (this.parentLine)
            {
                this.deg += this.parentLine.deg;
            }

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

        for (const i of this.extendEvent.scaleX)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.scaleX = i.start * time1 + i.end * time2;

            if (this.sprite)
            {
                this.sprite.scale.x = this.scaleX;
            }
        }

        for (const i of this.extendEvent.scaleY)
        {
            if (currentTime < i.startTime) break;
            if (currentTime > i.endTime) continue;

            let time2 = (currentTime - i.startTime) / (i.endTime - i.startTime);
            let time1 = 1 - time2;

            this.scaleY = i.start * time1 + i.end * time2;

            if (this.sprite)
            {
                this.sprite.scale.y = this.scaleY;
            }
        }
        */
        
        /**
        this.notes.forEach((note) =>
        {
            note.calcTime(currentTime, this, size);
        });
        **/
    }
}