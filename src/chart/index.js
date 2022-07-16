import * as Convert from './convert';
import { Sprite, Graphics, Text } from 'pixi.js-legacy';

export default class Chart
{
    constructor(params = {})
    {
        this.judgelines = [];
        this.notes      = [];
        this.offset     = !isNaN(Number(params.offset)) ? Number(Number(params.offset).toFixed(4)) : 0;
        this.music      = params.music ? params.music : null;
        this.bg         = params.bg ? params.bg : null;
        this.info       = {
            name      : params.name ? params.name : 'Untitled',
            artist    : params.artist ? params.artist : 'Unknown',
            author    : params.author ? params.author : 'Unknown',
            bgAuthor  : params.bgAuthor ? params.bgAuthor : 'Unknown',
            difficult : params.difficult ? params.difficult : 'SP Lv.?'
        };
        this.url = {
            chart: null,
            music: null,
            bg: null
        };

        this._music = null;
        this._audioOffset = 0;
        this.sprites = {};
        this.function = {
            judgeline: [],
            note: []
        }

        this._calcTick = this._calcTick.bind(this);
    }

    static from(rawChart, _chartInfo = {})
    {
        let chart;
        let chartInfo = _chartInfo;

        if (typeof rawChart == 'object')
        {
            if (!isNaN(Number(rawChart.formatVersion)))
            {
                chart = Convert.Official(rawChart);
            }
            else if (!isNaN(Number(rawChart.META.RPEVersion)))
            {
                chart = Convert.RePhiEdit(rawChart);
                chartInfo = chart.info;
            }
        }
        else if (typeof rawChart == 'string')
        {
            chart = Convert.PhiEdit(rawChart);
        }

        if (!chart) throw new Error('Unsupported chart format');

        chart.info = {
            name      : chartInfo.name ? chartInfo.name : 'Untitled',
            artist    : chartInfo.artist ? chartInfo.artist : 'Unknown',
            author    : chartInfo.author ? chartInfo.author : 'Unknown',
            bgAuthor  : chartInfo.bgAuthor ? chartInfo.bgAuthor : 'Unknown',
            difficult : chartInfo.difficult ? chartInfo.difficult : 'SP Lv.?'
        };

        chart.judgelines.forEach((judgeline) =>
        {
            judgeline.event.speed = arrangeSpeedEvents(judgeline.event.speed);
            judgeline.event.moveX = arrangeLineEvents(judgeline.event.moveX);
            judgeline.event.moveY = arrangeLineEvents(judgeline.event.moveY);
            judgeline.event.rotate = arrangeLineEvents(judgeline.event.rotate);
            judgeline.event.alpha = arrangeLineEvents(judgeline.event.alpha);

            judgeline.sortEvent();
        });

        return chart;
    }

    addFunction(type, func)
    {
        if (!this.function[type]) throw new Error('Invaild function type');
        this.function[type].push(func);
    }

    createSprites(stage, size, textures, zipFiles)
    {
        if (this.bg)
        {
            this.sprites.bg = new Sprite(this.bg);

            let bgCover = new Graphics();

            bgCover.beginFill(0x000000);
            bgCover.drawRect(0, 0, this.sprites.bg.texture.width, this.sprites.bg.texture.height);
            bgCover.endFill();

            bgCover.position.x = -this.sprites.bg.width / 2;
            bgCover.position.y = -this.sprites.bg.height / 2;
            bgCover.alpha = 1 - this.bgDim;

            this.sprites.bg.addChild(bgCover);
            this.sprites.bg.anchor.set(0.5);

            stage.addChild(this.sprites.bg);
        }

        this.judgelines.forEach((judgeline, index) =>
        {
            judgeline.createSprite(textures, zipFiles);

            judgeline.sprite.position.x = size.width / 2;
            judgeline.sprite.position.y = size.height / 2;
            judgeline.sprite.zIndex = index + 1;

            stage.addChild(judgeline.sprite);
        });
        this.notes.forEach((note, index) =>
        {
            note.createSprite(textures, zipFiles);

            note.sprite.zIndex = this.judgelines.length + (note.type === 3 ? index : index + 10) + 1;

            stage.addChild(note.sprite);
        });

        this.sprites.info = {};

        this.sprites.info.songName = new Text(this.info.name, {
            fill: 0xFFFFFF
        });
        this.sprites.info.songName.anchor.set(0, 1);
        this.sprites.info.songName.zIndex = 9999;

        stage.addChild(this.sprites.info.songName);


        this.sprites.info.songDiff = new Text(this.info.difficult, {
            fill: 0xFFFFFF
        });
        this.sprites.info.songDiff.anchor.set(0, 1);
        this.sprites.info.songDiff.zIndex = 9999;

        stage.addChild(this.sprites.info.songDiff);
    }

    resizeSprites(size)
    {
        this.renderSize = size;

        if (this.sprites.bg)
        {
            let bgScaleWidth = this.renderSize.width / this.sprites.bg.texture.width;
            let bgScaleHeight = this.renderSize.height / this.sprites.bg.texture.height;
            let bgScale = bgScaleWidth > bgScaleHeight ? bgScaleWidth : bgScaleHeight;

            this.sprites.bg.scale.set(bgScale);
            this.sprites.bg.position.set(this.renderSize.width / 2, this.renderSize.height / 2);
        }

        if (this.judgelines && this.judgelines.length > 0)
        {
            this.judgelines.forEach((judgeline) =>
            {
                if (!judgeline.sprite) return;

                judgeline.sprite.height = this.renderSize.lineScale * 18.75 * 0.008;
                judgeline.sprite.width = judgeline.sprite.height * judgeline.sprite.texture.width / judgeline.sprite.texture.height * 1.042;
            });
        }

        if (this.notes && this.notes.length > 0)
        {
            this.notes.forEach((note) =>
            {
                if (note.type === 3)
                {
                    note.sprite.children[1].height = note.holdLength * note.speed * this.renderSize.noteSpeed / this.renderSize.noteScale;
                    note.sprite.children[2].position.y = -(note.holdLength * note.speed * this.renderSize.noteSpeed / this.renderSize.noteScale);
                }

                note.sprite.scale.set(this.renderSize.noteScale * note.xScale, this.renderSize.noteScale);
            });
        }

        this.sprites.info.songName.style.fontSize = size.lineScale * 0.468750;
        this.sprites.info.songName.position.x = size.lineScale * 0.989583;
        this.sprites.info.songName.position.y = size.height - size.lineScale * 1.076389;

        this.sprites.info.songDiff.style.fontSize = size.lineScale * 0.347222;
        this.sprites.info.songDiff.position.x = size.lineScale * 0.989583;
        this.sprites.info.songDiff.position.y = size.height - size.lineScale * 0.746528;
    }

    async start(ticker)
    {
        if (!this.music)
        {
            throw new Error('You must choose a music for this chart!');
        }

        this._music = await this.music.play();
        this._audioOffset = this._music._source.context.baseLatency;

        ticker.add(this._calcTick);
    }

    _calcTick()
    {
        let currentTime = Math.fround(this._music.progress * this.music.duration - this._audioOffset - this.offset);
        this.calcTime(currentTime);
    }

    calcTime(currentTime)
    {
        this.judgelines.forEach((judgeline) =>
        {
            judgeline.calcTime(currentTime, this.renderSize);
            /*
            this.function.judgeline.forEach((func) =>
            {
                func(currentTime, judgeline);
            });
            */
        });
        this.notes.forEach((note) =>
        {
            note.calcTime(currentTime, this.renderSize);
            this.function.note.forEach((func) =>
            {
                func(currentTime, note);
            });
        })
    }

    get totalNotes() {
        return this.notes.length;
    }

    get totalRealNotes() {
        let result = 0;
        this.notes.forEach((note) => {
            if (!note.isFake) result++;
        });
        return result;
    }

    get totalFakeNotes() {
        let result = 0;
        this.notes.forEach((note) => {
            if (note.isFake) result++;
        });
        return result;
    }
}


function arrangeLineEvents(events) {
    let oldEvents = JSON.parse(JSON.stringify(events));
    let newEvents2 = [];
    let newEvents = [{ // 以 1-1e6 开始
        startTime : 1 - 1e6,
        endTime   : 0,
        start     : oldEvents[0] ? oldEvents[0].start : 0,
        end       : oldEvents[0] ? oldEvents[0].start : 0
    }];
    
    oldEvents.push({ // 以 1e9 结束
        startTime : 0,
        endTime   : 1e9,
        start     : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0,
        end       : oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0
    });
    
    // 保证时间连续性
    for (let oldEvent of oldEvents) {
        let lastNewEvent = newEvents[newEvents.length - 1];
        
        if (lastNewEvent.endTime > oldEvent.endTime)
        {
            // 忽略此分支
        }
        else if (lastNewEvent.endTime == oldEvent.startTime)
        {
            newEvents.push(oldEvent);
        }
        else if (lastNewEvent.endTime < oldEvent.startTime)
        {
            newEvents.push({
                startTime : lastNewEvent.endTime,
                endTime   : oldEvent.startTime,
                start     : lastNewEvent.end,
                end       : lastNewEvent.end
            }, oldEvent);
        }
        else if (lastNewEvent.endTime > oldEvent.startTime)
        {
            newEvents.push({
                startTime : lastNewEvent.endTime,
                endTime   : oldEvent.endTime,
                start     : (oldEvent.start * (oldEvent.endTime - lastNewEvent.endTime) + oldEvent.end * (lastNewEvent.endTime - oldEvent.startTime)) / (oldEvent.endTime - oldEvent.startTime),
                end       : lastNewEvent.end
            });
        }
    }
    
    // 合并相同变化率事件
    newEvents2 = [ newEvents.shift() ];
    for (let newEvent of newEvents)
    {
        let lastNewEvent2 = newEvents2[newEvents2.length - 1];
        let duration1 = lastNewEvent2.endTime - lastNewEvent2.startTime;
        let duration2 = newEvent.endTime - newEvent.startTime;
        
        if (newEvent.startTime == newEvent.endTime)
        {
            // 忽略此分支    
        }
        else if (
            lastNewEvent2.end == newEvent.start &&
            (lastNewEvent2.end - lastNewEvent2.start) * duration2 == (newEvent.end - newEvent.start) * duration1
        )
        {
            lastNewEvent2.endTime = newEvent.endTime;
            lastNewEvent2.end     = newEvent.end;
        }
        else
        {
            newEvents2.push(newEvent);
        }
    }
    
    return JSON.parse(JSON.stringify(newEvents2));
}

function arrangeSpeedEvents(events)
{
    let newEvents = [];
    for (let i of events) {
        let lastEvent = newEvents[newEvents.length - 1];
        
        if (!lastEvent || lastEvent.value != i.value) {
            newEvents.push(i);
        } else {
            lastEvent.endTime = i.endTime;
        }
    }
    
    return JSON.parse(JSON.stringify(newEvents));
}