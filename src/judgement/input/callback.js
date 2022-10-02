function InputStart(e, type = 0)
{
    e.preventDefault();
    if (this._isPaused) return;

    if (type === 1)
    {
        for (const touch of e.changedTouches)
        {
            this.addInput(touch.clientX - this.renderSize.widthOffset, touch.clientY, touch.identifier);
        }
    }
    else
    {
        this.addInput(e.clientX - this.renderSize.widthOffset, e.clientY, e.button);
    }
}

function InputMove(e, type = 0)
{
    e.preventDefault();

    if (type === 1)
    {
        for (const touch of e.changedTouches)
        {
            if (this.inputs[touch.identifier])
            {
                this.inputs[touch.identifier].move(touch.clientX - this.renderSize.widthOffset, touch.clientY);
            }
        }
    }
    else
    {
        if (this.inputs[e.button])
        {
            this.inputs[e.button].move(e.clientX - this.renderSize.widthOffset, e.clientY);
        }
    }
}

function InputEnd(e, type = 0)
{
    e.preventDefault();

    if (type === 1)
    {
        for (const touch of e.changedTouches)
        {
            delete this.inputs[touch.identifier];
        }
    }
    else
    {
        delete this.inputs[e.button];
    }
}

export default {
    InputStart,
    InputMove,
    InputEnd
}