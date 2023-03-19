import ListenerCallback from './callback';
import InputPoint from './point';
import { Graphics } from 'pixi.js';



export default class Input
{
    constructor(params = {})
    {
        if (!params.canvas) throw new Error('You cannot add inputs without a canvas');

        this.inputs = [];

        for (const name in ListenerCallback)
        {
            this['_' + name] = ListenerCallback[name].bind(this);
        }

        this.addListenerToCanvas(params.canvas);
        this.reset();
    }

    addListenerToCanvas(canvas)
    {
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('This is not a canvas');

        const passiveIfSupported = { passive: false };

        canvas.addEventListener('touchstart', this._touchStart, passiveIfSupported);
        canvas.addEventListener('touchmove', this._touchMove, passiveIfSupported);
        canvas.addEventListener('touchend', this._touchEnd, passiveIfSupported);
        canvas.addEventListener('touchcancel', this._touchEnd, passiveIfSupported);

        // 鼠标适配，其实并不打算做
        canvas.addEventListener('mousedown', this._mouseStart, passiveIfSupported);
        canvas.addEventListener('mousemove', this._mouseMove);
        canvas.addEventListener('mouseup', this._mouseEnd);
        
        // canvas.addEventListener('contextmenu', this._noCanvasMenu, passiveIfSupported);
    }

    removeListenerFromCanvas(canvas)
    {
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('This is not a canvas');

        canvas.removeEventListener('touchstart', this._touchStart);
        canvas.removeEventListener('touchmove', this._touchMove);
        canvas.removeEventListener('touchend', this._touchEnd);
        canvas.removeEventListener('touchcancel', this._touchEnd);

        // 鼠标适配，其实并不打算做
        canvas.removeEventListener('mousedown', this._mouseStart);
        canvas.removeEventListener('mousemove', this._mouseMove);
        canvas.removeEventListener('mouseup', this._mouseEnd);

        // canvas.removeEventListener('contextmenu', this._noCanvasMenu);
    }

    reset()
    {
        this.inputs.length = 0;
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

    addInput(type, id, x, y)
    {
        const { inputs } = this;
        let idx = inputs.findIndex(point => point.type === type && point.id === id);
        if (idx !== -1) inputs.splice(idx, 1);
        inputs.push(new InputPoint(type, id, x, y));
    }

    moveInput(type, id, x, y)
    {
        const { inputs } = this;
        let point = inputs.find(point => point.type === type && point.id === id);
        if (point) point.move(x, y);
    }

    removeInput(type, id)
    {
        const { inputs } = this;
        let point = inputs.find(point => point.type === type && point.id === id);
        if (point) point.isActive = false;
    }

    calcTick()
    {
        const { inputs } = this;

        if (this.sprite) this.sprite.clear();

        for (let i = 0, length = inputs.length; i < length; i++)
        {
            let point = inputs[i];

            if (this.sprite)
            {
                this.sprite
                    .beginFill(!point.isTapped ? 0xFFFF00 : point.isMoving ? 0x00FFFF : 0xFF00FF)
                    .drawCircle(point.x, point.y, this._inputPointSize)
                    .endFill();
            }

            if (point.isActive)
            {
                point.isTapped = true;
                point.isMoving = false;
            }
            else
            {
                inputs.splice(i--, 1);
                length -= 1;
            }
        }
    }

    resizeSprites(size)
    {
        this.renderSize = size;
        this._inputPointSize = this.renderSize.heightPercent * 30;
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