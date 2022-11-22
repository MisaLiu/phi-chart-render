import utils from './convert/utils';
import { Sprite, Container, Text, Graphics } from 'pixi.js-legacy';

export default class Judgeline
{
    constructor(params)
    {
        this.id               = !isNaN(params.id) ? Number(params.id) : -1;
        this.texture          = params.texture ? params.texture : null;
        this.parentLine       = params.parentLine ? params.parentLine : null;
        this.isCover          = params.isCover !== undefined && params.isCover !== null ? !!params.isCover : true;
        this.useOfficialScale = false;

        this.eventLayers = [];
        this.floorPositions = [];
        
        this.extendEvent = {
            color: [],
            scaleX: [],
            scaleY: [],
            text: [],
            incline: []
        };
        this.isText = false;
        
        this.sprite = undefined;

        this.reset();
    }

    reset()
    {
        this.speed = 1;
        this.x     = 0.5;
        this.y     = 0.5;
        this.alpha = 1;
        this.deg   = 0;
        this.sinr  = 0;
        this.cosr  = 1;

        this.floorPosition = 0;

        this.baseScaleX = 3;
        this.baseScaleY = 2.88;
        
        if (this.extendEvent.scaleX.length > 0 && this.extendEvent.scaleX[0].startTime <= 0) this.scaleX = this.extendEvent.scaleX[0].start;
        else this.scaleX = 1;
        if (this.extendEvent.scaleY.length > 0 && this.extendEvent.scaleY[0].startTime <= 0) this.scaleY = this.extendEvent.scaleY[0].start;
        else this.scaleY = 1;

        this.inclineSinr = NaN;

        if (this.sprite)
        {
            this.sprite.alpha = 1;
            this.sprite.angle = 0;
            this.sprite.scale.set(1);

            if (this.isText)
            {
                this.sprite.text = '';
            }
        }
    }

    sortEvent(withEndTime = false)
    {
        this.eventLayers.forEach((eventLayer) =>
        {
            eventLayer.sort();
        });

        for (const name in this.extendEvent)
        {
            this.extendEvent[name].sort((a, b) => a.startTime - b.startTime);
        }

        for (const name in this.eventLayers[0])
        {
            if (name == 'speed' || !(this.eventLayers[0][name] instanceof Array)) continue;
            if (this.eventLayers[0][name][0].startTime <= 0) continue;
            this.eventLayers[0][name].unshift({
                startTime : 1 - 100,
                endTime   : this.eventLayers[0][name][0].startTime,
                start     : 0,
                end       : 0
            });
        }
    }

    calcFloorPosition()
    {
        if (this.eventLayers.length <= 0) throw new Error('No event layer in this judgeline');

        let noSpeedEventsLayerCount = 0;
        this.eventLayers.forEach((eventLayer) =>
        {
            eventLayer.speed = utils.arrangeSameSingleValueEvent(eventLayer.speed);
            if (eventLayer.speed.length < 1) noSpeedEventsLayerCount++;
        });

        if (noSpeedEventsLayerCount == this.eventLayers.length)
        {
            console.warn('Line ' + this.id + ' don\'t have any speed event, use default speed.');
            this.eventLayers[0].speed.push({
                startTime: 0,
                endTime: 1e4,
                start: 1,
                end: 1
            });
        }

        let sameTimeSpeedEventAlreadyExist = {};
        let currentFloorPosition = 0;
        let floorPositions = [];

        this.floorPositions = [];

        this.eventLayers.forEach((eventLayer, eventLayerIndex) =>
        {
            eventLayer.speed.forEach((event, eventIndex) =>
            {
                event.endTime = eventLayer.speed[eventIndex + 1] ? eventLayer.speed[eventIndex + 1].startTime : 1e4;

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

            if (eventLayerIndex === 0 && eventLayer.speed[0].startTime > 0)
            {
                eventLayer.speed.unshift({
                    startTime : 1 - 100,
                    endTime   : eventLayer.speed[0] ? eventLayer.speed[0].startTime : 1e4,
                    value     : eventLayer.speed[0] ? eventLayer.speed[0].value : 1
                });
            }
        });

        floorPositions.sort((a, b) => a.startTime - b.startTime);

        floorPositions.unshift({
            startTime     : 1 - 1000,
            endTime       : floorPositions[0] ? floorPositions[0].startTime : 1e4,
            floorPosition : 1 - 1000
        });
        currentFloorPosition += floorPositions[0].endTime;
        
        for (let floorPositionIndex = 1; floorPositionIndex < floorPositions.length; floorPositionIndex++)
        {
            let currentEvent = floorPositions[floorPositionIndex];
            let nextEvent = floorPositionIndex < floorPositions.length - 1 ? floorPositions[floorPositionIndex + 1] : { startTime: 1e4 };
            let currentTime = currentEvent.startTime;

            floorPositions[floorPositionIndex].floorPosition = currentFloorPosition;
            floorPositions[floorPositionIndex].endTime = nextEvent.startTime;

            currentFloorPosition += (nextEvent.startTime - currentEvent.startTime) * this._calcSpeedValue(currentTime);
        }

        this.floorPositions = floorPositions;
    }

    getFloorPosition(time)
    {
        if (this.floorPositions.length <= 0) throw new Error('No floorPosition created, please call calcFloorPosition() first');

        let result = {};

        for (const floorPosition of this.floorPositions)
        {
            if (floorPosition.endTime < time) continue;
            if (floorPosition.startTime > time) break;

            result.startTime     = floorPosition.startTime;
            result.endTime       = floorPosition.endTime;
            result.floorPosition = floorPosition.floorPosition;
        }

        result.value = this._calcSpeedValue(time);

        return result;
    }

    _calcSpeedValue(time)
    {
        let result = 0;

        this.eventLayers.forEach((eventLayer) =>
        {
            let currentValue = 0;

            for (const event of eventLayer.speed)
            {
                if (event.endTime < time) continue;
                if (event.startTime > time) break;
                currentValue = event.value;
            }

            result += currentValue;
        });

        return result;
    }

    createSprite(texture, zipFiles, debug = false)
    {
        if (this.sprite) return this.sprite;

        if (!this.isText)
        {
            this.sprite = new Sprite(zipFiles[this.texture] ? zipFiles[this.texture] : texture.judgeline);

            if (this.texture)
            {
                this.baseScaleX = this.baseScaleY = 1;
            }
        }
        else
        {
            this.sprite = new Text('', {
                fontFamily: 'MiSans',
                align: 'center',
                fill: 0xFFFFFF
            });
        }
        
        this.sprite.anchor.set(0.5);
        this.sprite.alpha = 1;

        // For debug propose
        if (debug)
        {
            let lineInfoContainer = new Container();
            let lineId = new Text(this.id, {
                fontSize: 48,
                fill: 0xFF00A0
            });
            let linePosBlock = new Graphics()
                .beginFill(0xFF00A0)
                .drawRect(-22, -22, 44, 44)
                .endFill();
            
            lineId.anchor.set(0.5);
            lineId.position.set(0, -36 - lineId.width / 2);

            /*
            lineId.cacheAsBitmap = true;
            linePosBlock.cacheAsBitmap = true;
            */
            
            lineInfoContainer.addChild(lineId);
            lineInfoContainer.addChild(linePosBlock);

            this.debugSprite = lineInfoContainer;
        }

        if (this.extendEvent.scaleX.length > 0 && this.extendEvent.scaleX[0].startTime <= 0)
        {
            this.scaleX = this.extendEvent.scaleX[0].start;
        }
        if (this.extendEvent.scaleY.length > 0 && this.extendEvent.scaleY[0].startTime <= 0)
        {
            this.scaleY = this.extendEvent.scaleY[0].start;
        }
        
        return this.sprite;
    }

    calcTime(currentTime, size)
    {
        this.speed = 0;
        this.x     = 0;
        this.y     = 0;
        this.alpha = 0;
        this.deg   = 0;

        for (const eventLayer of this.eventLayers)
        {
            eventLayer.calcTime(currentTime);

            this.speed  += eventLayer._speed;
            this.x      += eventLayer._posX;
            this.y      += eventLayer._posY;
            this.alpha  += eventLayer._alpha;
            this.deg    += eventLayer._rotate;
        }

        for (const event of this.floorPositions)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            this.floorPosition = (currentTime - event.startTime) * this.speed + event.floorPosition;
        };

        for (const event of this.extendEvent.scaleX)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            let timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
            let timePercentStart = 1 - timePercentEnd;

            this.scaleX = event.start * timePercentStart + event.end * timePercentEnd;
            this.sprite.scale.x = this.scaleX * this.baseScaleX;
        }

        for (const event of this.extendEvent.scaleY)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            let timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
            let timePercentStart = 1 - timePercentEnd;

            this.scaleY = event.start * timePercentStart + event.end * timePercentEnd;
            this.sprite.scale.y = this.scaleY * this.baseScaleY;
        }

        for (const event of this.extendEvent.text)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            this.sprite.text = event.value;
        }

        for (const event of this.extendEvent.color)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            this.sprite.tint = event.value;
        }

        for (const event of this.extendEvent.incline)
        {
            if (event.endTime < currentTime) continue;
            if (event.startTime > currentTime) break;

            let timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
            let timePercentStart = 1 - timePercentEnd;

            this.inclineSinr = Math.sin(event.start * timePercentStart + event.end * timePercentEnd);
        }

        this.cosr = Math.cos(this.deg);
        this.sinr = Math.sin(this.deg);

        if (this.parentLine)
        {
            let oldPosX = this.x,
                oldPosY = this.y;
            
            this.x = oldPosX * this.parentLine.cosr + oldPosY * this.parentLine.sinr + this.parentLine.x;
            this.y = oldPosX * this.parentLine.sinr + oldPosY * this.parentLine.cosr + this.parentLine.y;
        }

        this.sprite.position.x = (this.x + 0.5) * size.width;
        this.sprite.position.y = (0.5 - this.y) * size.height;
        this.sprite.alpha      = this.alpha >= 0 ? this.alpha : 0;
        this.sprite.rotation   = this.deg;

        if (this.sprite.alpha <= 0) this.sprite.visible = false;
        else this.sprite.visible = true;
        
        /*
        this.sprite.width = this._width * this.scaleX;
        this.sprite.height = this._height * this.scaleY;
        */
        
        if (this.debugSprite)
        {
            this.debugSprite.position = this.sprite.position;
            this.debugSprite.rotation = this.sprite.rotation;
            this.debugSprite.alpha = 0.2 + (this.sprite.alpha * 0.8);
        }
    }
}

