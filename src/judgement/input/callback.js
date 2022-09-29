function InputStart(e)
{
    e.preventDefault();

    if (e instanceof TouchEvent)
    {
        for (const touch of e.changedTouches)
        {
            this.addInput(touch.clientX - this.renderSize.widthOffset, touch.clientY, touch.identifier);
        }
    }
    else if (e instanceof MouseEvent)
    {
        this.addInput(e.clientX - this.renderSize.widthOffset, e.clientY, e.button);
    }
}

function InputMove(e)
{
    e.preventDefault();

    if (e instanceof TouchEvent)
    {
        for (const touch of e.changedTouches)
        {
            if (this.inputs[touch.identifier])
            {
                this.inputs[touch.identifier].move(touch.clientX - this.renderSize.widthOffset, touch.clientY);
            }
        }
    }
    else if (e instanceof MouseEvent)
    {
        if (this.inputs[e.button])
        {
            this.inputs[e.button].move(e.clientX - this.renderSize.widthOffset, e.clientY);
        }
    }
}

function InputEnd(e)
{
    e.preventDefault();

    if (e instanceof TouchEvent)
    {
        for (const touch of e.changedTouches)
        {
            delete this.inputs[touch.identifier];
        }
    }
    else if (e instanceof MouseEvent)
    {
        delete this.inputs[e.button];
    }
}

export default {
    InputStart,
    InputMove,
    InputEnd
}