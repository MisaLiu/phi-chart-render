import Score from './score';
import { Text, Container, Graphics, INSTALLED } from 'pixi.js-legacy';

export default class Judgement
{
    constructor(params)
    {
        this.inputs = {};
        this.chart = params.chart;
        this.stage = params.stage;
        this.renderSize = {};
        this.texture = {};
        this.sounds = {};
        this.sprites = null;

        if (!params.canvas) throw new Error('You cannot do judgement without a canvas');
        if (!params.stage) throw new Error('You cannot do judgement without a stage');
        if (!params.chart) throw new Error('You cannot do judgement without a chart');

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

        this.calcTick = this.calcTick.bind(this);
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
            fill: 0xFFFFFF
        });
        this.sprites.combo.number.alpha = 0.81;
        this.sprites.combo.text = new Text('COMBO', {
            fill: 0xFFFFFF
        });
        this.sprites.combo.text.alpha = 0.55;
        this.sprites.combo.container.addChild(this.sprites.combo.number, this.sprites.combo.text);
        this.stage.addChild(this.sprites.combo.container);

        this.sprites.acc = new Text('ACCURACY 0.00%', {
            fill: 0xFFFFFF
        });
        this.sprites.acc.alpha = 0.63;
        this.sprites.acc.zIndex = 99999;
        this.stage.addChild(this.sprites.acc);

        this.sprites.score = new Text('00000000', {
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
        this.sprites.combo.text.position.y = size.heightPercent * 20;

        this.sprites.acc.position.x = size.heightPercent * 72;
        this.sprites.acc.position.y = size.heightPercent * 116;

        this.sprites.score.position.x = size.width - size.heightPercent * 139;
        this.sprites.score.position.y = size.heightPercent * 61;
        
    }

    calcTick()
    {
        this.sprites.inputPoint.clear();

        for (const id in this.inputs)
        {
            if (this.inputs[id])
            {
                this.inputs[id].calcTick();
                this.sprites.inputPoint
                    .beginFill(0xFF00FF)
                    .drawCircle(this.inputs[id].x, this.inputs[id].y, 10)
                    .endFill();
            }
        }
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