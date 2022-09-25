import Score from './score';
import { Text, Container, Graphics, AnimatedSprite } from 'pixi.js-legacy';

const AllJudgeTimes = {
    bad     : 200,
    good    : 160,
    perfect : 80,

    badChallenge     : 100,
    goodChallenge    : 75,
    perfectChallenge : 40
};

export default class Judgement
{
    constructor(params)
    {
        this.chart    = params.chart;
        this.stage    = params.stage;
        this.autoPlay = params.autoPlay ? !!params.autoPlay : false;
        this.texture  = params.texture;
        this.sounds   = params.sounds;

        this.inputs      = {};
        this.judgePoints = [];
        
        this.renderSize = {};
        this.sprites    = null;

        if (!params.stage) throw new Error('You cannot do judgement without a stage');
        if (!params.chart) throw new Error('You cannot do judgement without a chart');

        this._autoPlay      = params.autoPlay ? !!params.autoPlay : false;
        this._challengeMode = params.challangeMode ? !!params.challangeMode : false;

        /* ===== 判定用时间计算 ===== */
        this.judgeTimes = {
            perfect : (!this._challengeMode ? AllJudgeTimes.perfect : AllJudgeTimes.perfectChallenge) / 1000,
            good    : (!this._challengeMode ? AllJudgeTimes.good : AllJudgeTimes.goodChallenge) / 1000,
            bad     : (!this._challengeMode ? AllJudgeTimes.bad : AllJudgeTimes.badChallenge) / 1000
        };

        /* ===== 分数计算模块 ===== */
        this.score = {
            scorePerNote  : !this._challengeMode ? 900000 / this.chart.totalRealNotes : 1000000 / this.chart.totalRealNotes,
            scorePerCombo : !this._challengeMode ? 100000 / this.chart.totalRealNotes : 0,

            score    : 0,
            acc      : 0,
            combo    : 0,
            maxCombo : 0,

            perfect  : 0,
            good     : 0,
            bad      : 0,
            miss     : 0
        };

        this.calcTick = this.calcTick.bind(this);
        this.calcNote = calcNoteJudge.bind(this);
    }

    addListenerToCanvas(canvas)
    {
        // 检测浏览器是否支持 preventDefault
        let passiveIfSupported = true;
        try {
            params.canvas.addEventListener('test', null, Object.defineProperty({}, 'passive', { get: function() { passiveIfSupported = { passive: false }; } }));
        } catch (err) {}

        params.canvas.addEventListener('touchstart', (e) =>
        {
            e.preventDefault();
            for (const touch of e.changedTouches)
            {
                this.inputs[touch.identifier] = new Input({
                    x: touch.clientX - this.renderSize.widthOffset,
                    y: touch.clientY
                });
            }

        }, passiveIfSupported);
        params.canvas.addEventListener('touchmove', (e) =>
        {
            e.preventDefault();
            for (const touch of e.changedTouches)
            {
                if (this.inputs[touch.identifier])
                {
                    this.inputs[touch.identifier].move({
                        x: touch.clientX - this.renderSize.widthOffset,
                        y: touch.clientY
                    });
                }
            }
            
        }, passiveIfSupported);
        params.canvas.addEventListener('touchend', (e) =>
        {
            e.preventDefault();
            for (const touch of e.changedTouches)
            {
                this.inputs[touch.identifier] = undefined;
            }

        }, passiveIfSupported);
        params.canvas.addEventListener('touchcancel', (e) =>
        {
            e.preventDefault();
            for (const touch of e.changedTouches)
            {
                this.inputs[touch.identifier] = undefined;
            }

        }, passiveIfSupported);

        params.canvas.addEventListener('mousedown', (e) =>
        {
            e.preventDefault();
            this.inputs[e.button] = new Input({
                x: e.clientX - this.renderSize.widthOffset,
                y: e.clientY
            });

        }, passiveIfSupported);
        params.canvas.addEventListener('mousemove', (e) =>
        {
            e.preventDefault();
            if (this.inputs[e.button])
            {
                this.inputs[e.button].move({
                    x: e.clientX - this.renderSize.widthOffset,
                    y: e.clientY
                });
            }
        }, passiveIfSupported);
        params.canvas.addEventListener('mouseup', (e) =>
        {
            e.preventDefault();
            this.inputs[e.button] = undefined;

        }, passiveIfSupported);
    }

    createSprites(showInputPoint = true)
    {
        if (this.sprites) return;

        this.sprites = {};
        this.sprites.animate = [];

        this.sprites.combo = {};
        this.sprites.combo.container = new Container();
        this.sprites.combo.container.zIndex = 99999;

        this.sprites.combo.number = new Text('0', {
            fontFamily: 'A-OTF Shin Go Pr6N H',
            fill: 0xFFFFFF
        });
        this.sprites.combo.number.alpha = 0.81;
        this.sprites.combo.text = new Text('COMBO', {
            fontFamily: 'MiSans',
            fill: 0xFFFFFF
        });
        this.sprites.combo.text.alpha = 0.55;
        this.sprites.combo.container.addChild(this.sprites.combo.number, this.sprites.combo.text);
        this.stage.addChild(this.sprites.combo.container);

        this.sprites.acc = new Text('ACCURACY 0.00%', {
            fontFamily: 'MiSans',
            fill: 0xFFFFFF
        });
        this.sprites.acc.alpha = 0.63;
        this.sprites.acc.zIndex = 99999;
        this.stage.addChild(this.sprites.acc);

        this.sprites.score = new Text('00000000', {
            fontFamily: 'A-OTF Shin Go Pr6N H',
            fill: 0xFFFFFF
        });
        this.sprites.score.alpha = 0.58;
        this.sprites.score.anchor.set(1, 0);
        this.sprites.score.zIndex = 99999;
        this.stage.addChild(this.sprites.score);

        this.sprites.inputPoint = new Graphics();
        this.sprites.inputPoint.zIndex = 99999;
        this.stage.addChild(this.sprites.inputPoint);
    }

    resizeSprites(size)
    {
        this.renderSize = size;

        if (!this.sprites) return;

        this.sprites.combo.number.style.fontSize = size.heightPercent * 60;
        this.sprites.combo.text.style.fontSize = size.heightPercent * 30;

        this.sprites.acc.style.fontSize = size.heightPercent * 20;

        this.sprites.score.style.fontSize = size.heightPercent * 50;

        this.sprites.combo.container.position.x = size.heightPercent * 72;
        this.sprites.combo.container.position.y = size.heightPercent * 41;
        this.sprites.combo.text.position.x = this.sprites.combo.number.width + size.heightPercent * 6;
        this.sprites.combo.text.position.y = size.heightPercent * 30;

        this.sprites.acc.position.x = size.heightPercent * 72;
        this.sprites.acc.position.y = size.heightPercent * 113;

        this.sprites.score.position.x = size.width - size.heightPercent * 139;
        this.sprites.score.position.y = size.heightPercent * 61;
        
    }

    calcTick()
    {
        this.judgePoints.length = 0;

        if (!this.autoPlay)
        {
            for (const id in this.inputs)
            {
                let input = this.inputs[id];

                if (input instanceof Input)
                {
                    if (input.time > 0) this.judgePoints.push(new JudgePoint(input.x, input.y, 2));
                    else if (input.isMoving) this.judgePoints.push(new JudgePoint(input.x, input.y, 3));
                    else this.judgePoints.push(new JudgePoint(input.x, input.y, 1));
                }
            }
        }
        else
        {

        }

        if (this.sprites.inputPoint) this.sprites.inputPoint.clear();

        for (const id in this.inputs)
        {
            if (this.inputs[id])
            {
                this.inputs[id].calcTick();

                if (this.sprites.inputPoint)
                {
                    this.sprites.inputPoint
                        .beginFill(0xFF00FF)
                        .drawCircle(this.inputs[id].x, this.inputs[id].y, 10)
                        .endFill();
                }
            }
        }
    }

    /*
    calcNote(currentTime, note)
    {
        if (note.isScored) return;
        if (note.type !== 3 && note.time + this.judgeTimes.bad < currentTime)
        {
            note.isScored = true;
            note.sprite.visible = false;
            return;
        }

        let timeBetween = note.time - currentTime,
            timeBetweenReal = timeBetween > 0 ? timeBetween : timeBetween * -1,
            notePosition = { x: note.sprite.judgelineX, y: note.sprite.judgelineY },
            judgeline = note.judgeline;

        if (note.type !== 3 && timeBetween <= 0 && timeBetweenReal <= this.judgeTimes.bad && !note.isScored)
        {
            note.sprite.alpha = 1 + (timeBetween / this.judgeTimes.bad);
        }

        switch (note.type)
        {
            case 1:
            {
                this.judgePoints.forEach((judgePoint, judgePointIndex) =>
                {
                    if (
                        judgePoint.type === 1 &&
                        judgePoint.isInArea(notePosition.x, notePosition.y, judgeline.cosr, judgeline.sinr, this.renderSize.noteWidth) &&
                        !note.isScored
                    ) {
                        if  (timeBetweenReal <= this.judgeTimes.perfect)
                        {
                            note.isScored = true;
                        }
                        else if (timeBetweenReal <= this.judgeTimes.good)
                        {
                            note.isScored = true;
                        }
                        else if (timeBetweenReal <= this.judgeTimes.bad)
                        {
                            note.isScored = true;
                        }
                    }

                    if (note.isScored)
                    {
                        note.sprite.alpha = 0;
                        createClickAnimate(this.stage, this.texture, notePosition.x, notePosition.y, this.renderSize.noteScale);
                        this.judgePoints.splice(judgePointIndex, 1);
                    }
                });
                break;
            }
        }
    }
    */

    pushScore(type = 0)
    {

    }
}

class Input
{
    constructor(params)
    {
        this.x = Number(params.x);
        this.y = Number(params.y);
        this.isMoving = false;
        this.time = 0;
        this.type = params.type ? params.type : 1;
    }

    move(params)
    {
        this.x = Number(params.x);
        this.y = Number(params.y);
        this.isMoving = true;
        this.time = 0;
    }

    calcTick()
    {
        this.time++;
    }
}

class JudgePoint
{
    constructor(x, y, type = 0)
    {
        this.x = Number(x);
        this.y = Number(y);
        this.type = Number(type);
    }

    isInArea(x, y, cosr, sinr, hw)
    {
        return Math.abs((this.x - x) * cosr + (this.y - y) * sinr) <= hw;
    }
}

function calcNoteJudge(currentTime, note)
{
    if (note.isFake) return; // 忽略假 Note
    if (note.isScored) return; // 已记分忽略
    if (note.time - this.judgeTimes.bad > currentTime) return; // 不在记分范围内忽略
    if (note.type !== 3 && note.time + this.judgeTimes.bad < currentTime)
    {
        note.isScored = true;
        note.sprite.alpha = 0;
        return;
    }

    let timeBetween = note.time - currentTime,
        timeBetweenReal = timeBetween > 0 ? timeBetween : timeBetween * -1;
    
    if (note.type !== 3 && note.time <= currentTime)
    {
        note.sprite.alpha = 1 + (timeBetween / this.judgeTimes.bad);
    }

    switch (note.type)
    {
        case 1:
        {
            /*
            if (timeBetweenReal <= this.judgeTimes.bad)
            {
                note.isScored = true;
                note.scoreTime = timeBetween;

                if (timeBetweenReal <= this.judgeTimes.perfect) note.score = 4;
                else if (timeBetweenReal <= this.judgeTimes.good) note.score = 3;
                else note.score = 2;
            }

            if (note.isScored)
            {
                note.sprite.alpha = 0;
            }
            */
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

function createClickAnimate(stage, texture, x, y, scale, color)
{
    let sprite = new AnimatedSprite(texture);

    sprite.anchor.set(0.5);
    sprite.position.x = x;
    sprite.position.y = y;
    sprite.scale.set(2);

    sprite.loop = false;

    sprite.onFrameChange = function () {
        this.alpha = 1 - (this.currentFrame / this.totalFrames);
    };
    sprite.onComplete = function () {
        this.destroy();
    };

    stage.addChild(sprite);
    sprite.play();

    return sprite;
}