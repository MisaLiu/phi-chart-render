import ListenerCallback from './callback';
import InputPoint from './point';
import { Graphics } from 'pixi.js-legacy';

export default class Input
{
    constructor(params = {})
    {
        this.tap = [];
        this.inputs = {};

        this._autoPlay = params.autoPlay ? !!params.autoPlay : false;

        if (!params.canvas) throw new Error('You cannot add inputs without a canvas');

        this._inputStart = ListenerCallback.InputStart.bind(this);
        this._inputMove  = ListenerCallback.InputMove.bind(this);
        this._inputEnd   = ListenerCallback.InputEnd.bind(this);

        this.addListenerToCanvas(params.canvas);
    }

    addListenerToCanvas(canvas)
    {
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('This is not a canvas');

        // 检测浏览器是否支持 preventDefault
        let passiveIfSupported = false;
        try {
            canvas.addEventListener('test', null, Object.defineProperty({}, 'passive', { get: function() { passiveIfSupported = { passive: false }; } }));
        } catch (err) {}

        canvas.addEventListener('touchstart', this._inputStart, passiveIfSupported);
        canvas.addEventListener('touchmove', this._inputMove, passiveIfSupported);
        canvas.addEventListener('touchend', this._inputEnd, passiveIfSupported);
        canvas.addEventListener('touchcancel', this._inputEnd, passiveIfSupported);

        // 鼠标适配，其实并不打算做
        canvas.addEventListener('mousedown', this._inputStart, passiveIfSupported);
        canvas.addEventListener('mousemove', this._inputMove, passiveIfSupported);
        canvas.addEventListener('mouseup', this._inputEnd, passiveIfSupported);
    }

    createSprite(stage, showInputPoint = true)
    {
        this.sprite = new Graphics();
        this.sprite.zIndex = 99999;
        stage.addChild(this.sprite);
    }

    addInput(x, y, identify = -1)
    {
        let newInput = new InputPoint(x, y);
        this.tap.push(newInput);
        this.inputs[identify] = newInput;
    }

    calcTick()
    {
        if (this.sprite) this.sprite.clear();

        for (const id in this.inputs)
        {
            if (!this.inputs[id]) continue;
            this.inputs[id].calcTick();
            if (this.sprite)
            {
                let color = this.inputs[id].time - 1 == 0 ? (
                    this.inputs[id].isMove ? 0x00FFFF : 0xFFFF00
                ) : 0xFF00FF

                this.sprite
                    .beginFill(color)
                    .drawCircle(this.inputs[id].x, this.inputs[id].y, this.renderSize.heightPercent * 30)
                    .endFill();
            }
        }
        
        this.tap.length = 0;
    }

    resizeSprites(size)
    {
        this.renderSize = size;
    }
}