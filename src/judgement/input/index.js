export default class Input
{
    constructor(params = {})
    {
        this.tap = [];
        this.hold = {};

        this._autoPlay = params.autoPlay ? !!params.autoPlay : false;

        if (!params.canvas) throw new Error('You cannot add inputs without a canvas');

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

        canvas.addEventListener('touchstart', (e) =>
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
        canvas.addEventListener('touchmove', (e) =>
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
        canvas.addEventListener('touchend', (e) =>
        {
            e.preventDefault();
            for (const touch of e.changedTouches)
            {
                this.inputs[touch.identifier] = undefined;
            }

        }, passiveIfSupported);
        canvas.addEventListener('touchcancel', (e) =>
        {
            e.preventDefault();
            for (const touch of e.changedTouches)
            {
                this.inputs[touch.identifier] = undefined;
            }

        }, passiveIfSupported);

        // 鼠标适配，其实并不打算做
        canvas.addEventListener('mousedown', (e) =>
        {
            e.preventDefault();
            this.inputs[e.button] = new Input({
                x: e.clientX - this.renderSize.widthOffset,
                y: e.clientY
            });

        }, passiveIfSupported);
        canvas.addEventListener('mousemove', (e) =>
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
        canvas.addEventListener('mouseup', (e) =>
        {
            e.preventDefault();
            this.inputs[e.button] = undefined;

        }, passiveIfSupported);
    }

    addInput(x, y, identify = -1)
    {
        this.tap.push()
    }
}