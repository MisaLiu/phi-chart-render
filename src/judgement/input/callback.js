function touchStart(e)
{
    e.preventDefault();
    for (const i of e.changedTouches)
    {
        const { clientX, clientY, identifier } = i;
        this.addInput('touch', identifier, clientX - this.renderSize.widthOffset, clientY);
    }
}

function touchMove(e)
{
    e.preventDefault();
    for (const i of e.changedTouches)
    {
        const { clientX, clientY, identifier } = i;
        this.moveInput('touch', identifier, clientX - this.renderSize.widthOffset, clientY);
    }
}

function touchEnd(e)
{
    e.preventDefault();
    for (const i of e.changedTouches)
    {
        this.removeInput('touch', i.identifier);
    }
}

function mouseStart(e)
{
    e.preventDefault();
    const { clientX, clientY, button } = e;
    this.addInput('mouse', button, clientX - this.renderSize.widthOffset, clientY);
}

function mouseMove(e)
{
    const { clientX, clientY, button } = e;
    this.moveInput('mouse', button, clientX - this.renderSize.widthOffset, clientY);
}

function mouseEnd(e)
{
    this.removeInput('mouse', e.button);
}

export default {
    touchStart,
    touchMove,
    touchEnd,
    mouseStart,
    mouseMove,
    mouseEnd
}