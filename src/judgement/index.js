import Input from './input';
import Score from './score';
import InputPoint from './input/point';
import JudgePoint from './point';
import { Container, AnimatedSprite, Texture, Graphics, Sprite  } from 'pixi.js-legacy';

const AllJudgeTimes = {
    bad     : 180,
    good    : 160,
    perfect : 80,

    badChallenge     : 90,
    goodChallenge    : 75,
    perfectChallenge : 40
};

const ClickAnimatePointCache = (() =>
{
    const pointSize = 26;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });

    canvas.width = canvas.height = pointSize * 2;
    ctx.clearRect(0, 0, pointSize * 2, pointSize * 2);
    ctx.beginPath();
    ctx.arc(pointSize, pointSize, pointSize, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    const result = Texture.from(canvas);
    result.defaultAnchor.set(0.5);

    Texture.addToCache(result, 'clickAnimatePoint');

    return result;
})();

export default class Judgement
{
    constructor(params = {})
    {
        this.chart    = params.chart;
        this.stage    = params.stage;
        this.textures = params.assets.textures;
        this.sounds   = params.assets.sounds;
        
        if (!params.stage) throw new Error('You cannot do judgement without a stage');
        if (!params.chart) throw new Error('You cannot do judgement without a chart');

        this._autoPlay       = params.autoPlay !== undefined && params.autoPlay !== null ? !!params.autoPlay : false;
        this._hitsound       = params.hitsound !== undefined && params.hitsound !== null ? !!params.hitsound : true;
        this._hitsoundVolume = !isNaN(Number(params.hitsoundVolume)) ? Number(params.hitsoundVolume) : 1;

        this.score = new Score(this.chart.totalRealNotes, !!params.showAPStatus, !!params.challangeMode, this._autoPlay);
        this.input = new Input({ canvas: params.canvas, autoPlay: this._autoPlay });

        /* ===== 判定用时间计算 ===== */
        this.judgeTimes = {
            perfect : (!params.challangeMode ? AllJudgeTimes.perfect : AllJudgeTimes.perfectChallenge) / 1000,
            good    : (!params.challangeMode ? AllJudgeTimes.good : AllJudgeTimes.goodChallenge) / 1000,
            bad     : (!params.challangeMode ? AllJudgeTimes.bad : AllJudgeTimes.badChallenge) / 1000
        };
        
        this.calcTick = this.calcTick.bind(this);
        this.calcNote = calcNoteJudge.bind(this);

        this.reset();
    }

    reset()
    {
        this.judgePoints = [];
        this.score.reset();
        this.input.reset();
    }

    createSprites(showInputPoint = true)
    {
        this.score.createSprites(this.stage);
        this.input.createSprite(this.stage, showInputPoint);
        // this.stage.addChild(this.input.sprite);
    }

    resizeSprites(size, isEnded)
    {
        this.renderSize = size;
        this.score.resizeSprites(size, isEnded);
        this.input.resizeSprites(size, isEnded);
    }

    calcTick()
    {
        this.createJudgePoints();

        this.input.tap.length = 0;
        this.input.calcTick();

        this.score.calcTick();
    }

    createJudgePoints()
    {
        this.judgePoints.length = 0;

        if (!this._autoPlay)
        {
            for (const tap of this.input.tap)
            {
                if (tap instanceof InputPoint) this.judgePoints.push(new JudgePoint(tap, 1));
            }

            for (const id in this.input.inputs)
            {
                if (this.input.inputs[id] instanceof InputPoint)
                {
                    if (this.input.inputs[id].isFlickable && !this.input.inputs[id].isFlicked) this.judgePoints.push(new JudgePoint(this.input.inputs[id], 2));
                    else this.judgePoints.push(new JudgePoint(this.input.inputs[id], 3));
                }
            }
        }
    }

    pushNoteJudge(note)
    {
        this.score.pushJudge(note.score, this.chart.judgelines);
        if (note.score >= 2)
        {
            this.createClickAnimate(note);
            if (note.score >= 3) this.playHitsound(note);
        }
    }

    createClickAnimate(note)
    {
        let cont = new Container();
        let anim = new AnimatedSprite(note.score >= 3 ? this.textures.normal : this.textures.bad);
        let blocks = [ null, null, null, null ];

        if (note.score >= 3 && note.type != 3) cont.position.set(note.sprite.judgelineX, note.sprite.judgelineY);
        else cont.position.set(note.sprite.position.x, note.sprite.position.y);
        cont.scale.set(this.renderSize.noteScale * 5.6);

        anim.position.set(0, 0);
        anim.tint = note.score === 4 ? 0xFFECA0 : note.score === 3 ? 0xB4E1FF : 0x6c4343;

        anim.scale.set(256 / anim.texture.baseTexture.width);
        anim.type = note.score;
        anim.loop = false;

        if (note.score >= 3)
        {
            for (let i = 0; i < blocks.length; i++)
            {
                blocks[i] = new Sprite(ClickAnimatePointCache);

                blocks[i].tint = note.score === 4 ? 0xFFECA0 : 0xB4E1FF;

                blocks[i].distance = blocks[i]._distance = Math.random() * 100 + 240;
                blocks[i].direction = Math.floor(Math.random() * 360);
				blocks[i].sinr = Math.sin(blocks[i].direction);
				blocks[i].cosr = Math.cos(blocks[i].direction);

                cont.addChild(blocks[i]);
            }
            anim.blocks = blocks;
        }
        else
        {
            cont.angle = note.sprite.angle;
        }

        anim.onFrameChange = function () {
            let currentFrameProgress = (this.currentFrame / this.totalFrames);
            this.parent.alpha = 1 - currentFrameProgress;

            if (this.blocks instanceof Array)
            {
                for (let i = 0; i < this.blocks.length; i++)
                {
                    this.blocks[i].scale.set(((0.2078 * currentFrameProgress - 1.6524) * currentFrameProgress + 1.6399) * currentFrameProgress + 0.4988);
                    this.blocks[i].distance = this.blocks[i]._distance * (9 * currentFrameProgress / (8 * currentFrameProgress + 1)) * 0.6;

                    this.blocks[i].position.x = this.blocks[i].distance * this.blocks[i].cosr - this.blocks[i].distance * this.blocks[i].sinr;
				    this.blocks[i].position.y = this.blocks[i].distance * this.blocks[i].cosr + this.blocks[i].distance * this.blocks[i].sinr;
                }
            }
        };
        anim.onComplete = function () {
            this.parent.destroy();
        };

        cont.addChild(anim);
        this.stage.addChild(cont);
        anim.play();

        return cont;
    }

    playHitsound(note)
    {
        if (!this._hitsound) return;
        if (note.hitsound) note.hitsound.play();
        else
        {
            switch (note.type)
            {
                case 1:
                case 3:
                {
                    this.sounds.tap.play();
                    break;
                }
                case 2:
                {
                    this.sounds.drag.play();
                    break;
                }
                case 4:
                {
                    this.sounds.flick.play();
                    break;
                }
            }
        }
    }

    destroySprites()
    {
        this.reset();

        this.input.destroySprites();
        this.score.destroySprites();
    }
}

function calcNoteJudge(currentTime, note)
{
    if (note.isFake) return; // 忽略假 Note
    if (note.isScored && note.isScoreAnimated) return; // 已记分忽略
    if (note.time - this.judgeTimes.bad > currentTime) return; // 不在记分范围内忽略
    
    if (!note.isScored)
    {
        if (note.type !== 3 && note.time + this.judgeTimes.bad < currentTime)
        {
            note.isScored = true;
            note.score = 1;
            note.scoreTime = NaN;

            this.score.pushJudge(0, this.chart.judgelines);

            note.sprite.alpha = 0;
            note.isScoreAnimated = true;
            
            return;
        }
        else if (note.type === 3 && note.time + this.judgeTimes.good < currentTime)
        {
            note.isScored = true;
            note.score = 1;
            note.scoreTime = NaN;

            this.score.pushJudge(0, this.chart.judgelines);

            note.sprite.alpha = 0.5;
            note.isScoreAnimated = true;

            return;
        }
    }
    

    let timeBetween = note.time - currentTime,
        timeBetweenReal = timeBetween > 0 ? timeBetween : timeBetween * -1,
        judgeline = note.judgeline,
        notePosition = note.sprite.position;
    
    if (note.type !== 3 && !note.isScoreAnimated && note.time <= currentTime)
    {
        note.sprite.alpha = 1 + (timeBetween / this.judgeTimes.bad);
    }

    // 自动模式则自行添加判定点
    if (this._autoPlay)
    {
        let input = { x: notePosition.x, y: notePosition.y, isFlicked: false };

        if (note.type === 1) {
            if (timeBetween <= 0) this.judgePoints.push(new JudgePoint(input, 1));
        } else if (note.type === 2) {
            if (timeBetween <= this.judgeTimes.bad) this.judgePoints.push(new JudgePoint(input, 3));
        } else if (note.type === 3) {
            if (!note.isScored && timeBetween <= 0) this.judgePoints.push(new JudgePoint(input, 1));
            else if (note.isScored && currentTime - note.lastHoldTime >= 0.15) this.judgePoints.push(new JudgePoint(input, 3));
        } else if (note.type === 4) {
            if (timeBetween <= this.judgeTimes.bad) this.judgePoints.push(new JudgePoint(input, 2));
        }
    }

    switch (note.type)
    {
        case 1:
        {
            for (let i = 0; i < this.judgePoints.length; i++)
            {
                if (
                    this.judgePoints[i].type === 1 &&
                    this.judgePoints[i].isInArea(notePosition.x, notePosition.y, judgeline.cosr, judgeline.sinr, this.renderSize.noteWidth)
                ) {
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
                        this.pushNoteJudge(note);
                        note.sprite.alpha = 0;
                        note.isScoreAnimated = true;

                        this.judgePoints.splice(i, 1);
                        break;
                    }
                }
            }

            break;
        }
        case 2:
        {
            if (note.isScored && !note.isScoreAnimated && timeBetween <= 0)
            {
                this.pushNoteJudge(note);
                note.sprite.alpha = 0;
                note.isScoreAnimated = true;
            }
            else if (!note.isScored)
            {
                for (let i = 0; i < this.judgePoints.length; i++)
                {
                    if (
                        this.judgePoints[i].isInArea(notePosition.x, notePosition.y, judgeline.cosr, judgeline.sinr, this.renderSize.noteWidth) &&
                        timeBetweenReal <= this.judgeTimes.good
                    ) {
                        note.isScored = true;
                        note.score = 4;
                        note.scoreTime = NaN;
                        break;
                    }
                }
            }
            
            break;
        }
        case 3:
        {
            if (note.isScored)
            {
                if (currentTime - note.lastHoldTime >= 0.15)
                {
                    this.createClickAnimate(note);
                }

                if (note.holdTimeLength - currentTime <= this.judgeTimes.bad)
                {
                    this.score.pushJudge(note.score, this.chart.judgelines);
                    note.isScoreAnimated = true;
                    break;
                }

                if (currentTime - note.lastHoldTime >= 0.15)
                {
                    note.lastHoldTime = currentTime;
                    note.isHolding = false;
                }
            }

            for (let i = 0; i < this.judgePoints.length; i++)
            {
                if (
                    !note.isScored &&
                    this.judgePoints[i].type === 1 &&
                    this.judgePoints[i].isInArea(notePosition.x, notePosition.y, judgeline.cosr, judgeline.sinr, this.renderSize.noteWidth) &&
                    timeBetweenReal <= this.judgeTimes.good
                ) {
                    note.isScored = true;
                    note.scoreTime = timeBetween;

                    if (timeBetweenReal <= this.judgeTimes.perfect) note.score = 4;
                    else note.score = 3;

                    this.createClickAnimate(note);
                    this.playHitsound(note);
                    
                    note.isHolding = true;
                    note.lastHoldTime = currentTime;

                    this.judgePoints.splice(i, 1);
                    break;
                }
                else if (this.judgePoints[i].isInArea(notePosition.x, notePosition.y, judgeline.cosr, judgeline.sinr, this.renderSize.noteWidth))
                {
                    note.isHolding = true;
                }
            }

            if (!this.paused && note.isScored && !note.isHolding)
            {
                note.score = 1;
                note.scoreTime = NaN;
                
                this.score.pushJudge(1, this.chart.judgelines);

                note.sprite.alpha = 0.5;
                note.isScoreAnimated = true;
            }

            break;
        }
        case 4:
        {
            if (note.isScored && !note.isScoreAnimated && timeBetween <= 0)
            {
                this.pushNoteJudge(note);
                note.sprite.alpha = 0;
                note.isScoreAnimated = true;
            }
            else if (!note.isScored)
            {
                for (let i = 0; i < this.judgePoints.length; i++)
                {
                    if (
                        this.judgePoints[i].type === 2 &&
                        this.judgePoints[i].isInArea(notePosition.x, notePosition.y, judgeline.cosr, judgeline.sinr, this.renderSize.noteWidth) &&
                        timeBetweenReal <= this.judgeTimes.good
                    ) {
                        note.isScored = true;
                        note.score = 4;
                        note.scoreTime = NaN;

                        this.judgePoints[i].input.isFlicked = true;
                        this.judgePoints.splice(i, 1);

                        break;
                    }
                }
            }

            break;
        }
    }
}