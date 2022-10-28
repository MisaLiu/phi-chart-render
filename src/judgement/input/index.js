import ListenerCallback from './callback';
import InputPoint from './point';
import { Graphics } from 'pixi.js-legacy';

export default class Input
{
    constructor(params = {})
    {
        if (!params.canvas) throw new Error('You cannot add inputs without a canvas');

        this._inputStart = ListenerCallback.InputStart.bind(this);
        this._inputMove  = ListenerCallback.InputMove.bind(this);
        this._inputEnd   = ListenerCallback.InputEnd.bind(this);

        this._touchInputStart = (e) => { this._inputStart(e, 1) };
        this._touchInputMove = (e) => { this._inputMove(e, 1) };
        this._touchInputEnd = (e) => { this._inputEnd(e, 1) };

        this._mouseInputStart = (e) => { this._inputStart(e, 0) };
        this._mouseInputMove = (e) => { this._inputMove(e, 0) };
        this._mouseInputEnd = (e) => { this._inputEnd(e, 0) };

        this._noCanvasMenu = (e) => { e.preventDefault();return false; };

        this.addListenerToCanvas(params.canvas);

        this.reset();
    }

    reset()
    {
        this.tap = [];
        this.inputs = {};

        this._isPaused = false;
    }

    addListenerToCanvas(canvas)
    {
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('This is not a canvas');

        // 检测浏览器是否支持 preventDefault
        let passiveIfSupported = false;
        try {
            canvas.addEventListener('test', null, Object.defineProperty({}, 'passive', { get: function() { passiveIfSupported = { passive: false }; } }));
        } catch (err) {}

        canvas.addEventListener('touchstart', this._touchInputStart, passiveIfSupported);
        canvas.addEventListener('touchmove', this._touchInputMove, passiveIfSupported);
        canvas.addEventListener('touchend', this._touchInputEnd, passiveIfSupported);
        canvas.addEventListener('touchcancel', this._touchInputEnd, passiveIfSupported);

        // 鼠标适配，其实并不打算做
        canvas.addEventListener('mousedown', this._mouseInputStart, passiveIfSupported);
        canvas.addEventListener('mousemove', this._mouseInputMove, passiveIfSupported);
        canvas.addEventListener('mouseup', this._mouseInputEnd, passiveIfSupported);

        canvas.addEventListener('contextmenu', this._noCanvasMenu, passiveIfSupported);
    }

    removeListenerFromCanvas(canvas)
    {
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('This is not a canvas');

        canvas.removeEventListener('touchstart', this._touchInputStart);
        canvas.removeEventListener('touchmove', this._touchInputMove);
        canvas.removeEventListener('touchend', this._touchInputEnd);
        canvas.removeEventListener('touchcancel', this._touchInputEnd);

        // 鼠标适配，其实并不打算做
        canvas.removeEventListener('mousedown', this._mouseInputStart);
        canvas.removeEventListener('mousemove', this._mouseInputMove);
        canvas.removeEventListener('mouseup', this._mouseInputEnd);

        canvas.removeEventListener('contextmenu', this._noCanvasMenu);
    }

    createSprite(stage, showInputPoint = true)
    {
        if (showInputPoint)
        {
            this.sprite = new Graphics();
            this.sprite.zIndex = 99999;
            stage.addChild(this.sprite);
        }
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
                let color = this.inputs[id].tick - 1 == 0 ? (
                    this.inputs[id].isMoving ? 0x00FFFF : 0xFFFF00
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

    destroySprites()
    {
        if (this.sprite)
        {
            this.sprite.destroy();
            this.sprite = undefined;
        }
    }
}