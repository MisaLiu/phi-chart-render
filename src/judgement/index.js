import * as verify from '@/verify';
import Input from './input';
import Score from './score';
import InputPoint from './input/point';
import JudgePoint from './point';
import { Container, AnimatedSprite, Texture, Sprite  } from 'pixi.js-legacy';

const particleCountPerClickAnim = 4;

const AllJudgeTimes = {
    bad     : 180,
    good    : 160,
    perfect : 80,

    badChallenge     : 90,
    goodChallenge    : 75,
    perfectChallenge : 40
};

var ClickAnimatePointCache;
(async () =>
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

    const result = Texture.from(await createImageBitmap(canvas));
    result.defaultAnchor.set(0.5);

    Texture.addToCache(result, 'clickAnimatePoint');

    ClickAnimatePointCache = result;
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

        this._autoPlay       = verify.bool(params.autoPlay, false);
        this._hitsound       = verify.bool(params.hitsound, true);
        this._hitsoundVolume = verify.number(params.hitsoundVolume, 1, 0, 1);

        this.score = new Score(this.chart.totalRealNotes, verify.bool(params.showAPStatus, true), verify.bool(params.challangeMode, false), this._autoPlay);
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

        this._holdBetween = 0.15;

        if (this.clickParticleContainer) this.clickParticleContainer.removeChildren();
    }

    createSprites(showInputPoint = true)
    {
        this.clickParticleContainer = new Container();
        this.clickParticleContainer.zIndex = 99999;
        this.stage.addChild(this.clickParticleContainer);

        this.score.createSprites(this.stage);
        this.input.createSprite(this.stage, showInputPoint);

        this._clickAnimBaseScale = {
            normal : 256 / this.textures.normal[0].baseTexture.width,
            bad    : 256 / this.textures.bad[0].baseTexture.width
        };
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

        for (let i = 0, length = this.clickParticleContainer.children.length; i < length; i++)
        {
            const particle = this.clickParticleContainer.children[i];
            if (!particle) break;
            const currentTimeProgress = (Date.now() - particle.startTime) / 500;
            
            if (currentTimeProgress >= 1)
            {
                // this.clickParticleContainer.removeChild(particle);
                particle.destroy(false);
                continue;
            }

            particle.alpha = 1 - currentTimeProgress;

            particle.scale.set((((0.2078 * currentTimeProgress - 1.6524) * currentTimeProgress + 1.6399) * currentTimeProgress + 0.4988) * particle.baseScale);
            particle.distance = particle._distance * (9 * currentTimeProgress / (8 * currentTimeProgress + 1)) * 0.6 * particle.baseScale;

            particle.position.x = particle.distance * particle.cosr - particle.distance * particle.sinr + particle.basePos.x;
            particle.position.y = particle.distance * particle.cosr + particle.distance * particle.sinr + particle.basePos.y;
        }
    }

    createJudgePoints()
    {
        this.judgePoints.length = 0;

        if (!this._autoPlay)
        {
            for (let i = 0, length = this.input.tap.length; i < length; i++)
            {
                if (this.input.tap[i] instanceof InputPoint) this.judgePoints.push(new JudgePoint(this.input.tap[i], 1));
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
        let anim = new AnimatedSprite(note.score >= 3 ? this.textures.normal : this.textures.bad),
            baseScale = this.renderSize.noteScale * 5.6;

        if (note.score >= 3 && note.type != 3) anim.position.set(note.sprite.judgelineX, note.sprite.judgelineY);
        else anim.position.copyFrom(note.sprite.position);

        anim.scale.set((note.score >= 3 ? this._clickAnimBaseScale.normal : this._clickAnimBaseScale.bad) * baseScale);
        anim.tint = note.score === 4 ? 0xFFECA0 : note.score === 3 ? 0xB4E1FF : 0x6c4343;

        anim.loop = false;

        if (note.score >= 3)
        {
            let currentParticleCount = 0;
            while (currentParticleCount < particleCountPerClickAnim)
            {
                let particle = new Sprite(ClickAnimatePointCache);

                particle.tint = note.score === 4 ? 0xFFECA0 : 0xB4E1FF;

                particle.startTime = Date.now();
                particle.basePos   = anim.position;
                particle.baseScale = baseScale;

                particle.distance  = particle._distance = Math.random() * 100 + 250;
                particle.direction = Math.floor(Math.random() * 360);
				particle.sinr = Math.sin(particle.direction);
				particle.cosr = Math.cos(particle.direction);

                this.clickParticleContainer.addChild(particle);

                currentParticleCount++;
            }
        }
        else
        {
            anim.angle = note.sprite.angle;
        }

        anim.onFrameChange = function () {
            this.alpha = 1 - (this.currentFrame / this.totalFrames);
        };
        anim.onComplete = function () {
            this.destroy(false);
        };

        this.stage.addChild(anim);
        anim.play();

        return anim;
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

        this.clickParticleContainer.destroy({ children: true, texture: false, baseTexture: false });

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
            else if (note.isScored && currentTime - note.lastHoldTime >= this._holdBetween) this.judgePoints.push(new JudgePoint(input, 3));
        } else if (note.type === 4) {
            if (timeBetween <= this.judgeTimes.bad) this.judgePoints.push(new JudgePoint(input, 2));
        }
    }

    switch (note.type)
    {
        case 1:
        {
            for (let i = 0, length = this.judgePoints.length; i < length; i++)
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
                for (let i = 0, length = this.judgePoints.length; i < length; i++)
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
                if (currentTime - note.lastHoldTime >= this._holdBetween)
                {
                    this.createClickAnimate(note);
                }

                if (note.holdTimeLength - currentTime <= this.judgeTimes.bad)
                {
                    this.score.pushJudge(note.score, this.chart.judgelines);
                    note.isScoreAnimated = true;
                    break;
                }

                if (currentTime - note.lastHoldTime >= this._holdBetween)
                {
                    note.lastHoldTime = currentTime;
                    note.isHolding = false;
                }
            }

            for (let i = 0, length = this.judgePoints.length; i < length; i++)
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
                for (let i = 0, length = this.judgePoints.length; i < length; i++)
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