
function pauseBtnClickCallback()
{
    let pauseButton = this.sprites.pauseButton;
    pauseButton.clickCount++;
    if (pauseButton.clickCount >= 2 && Date.now() - pauseButton.lastClickTime <= 2000)
    {
        this.pause();

        pauseButton.lastRenderTime = Date.now();
        pauseButton.isEndRendering = true;
        pauseButton.clickCount = 0;
    }
    pauseButton.lastClickTime = Date.now();
}

function gameEndCallback()
{
    this._animateStatus = 2;
    this._gameEndTime = Date.now();
    this.sprites.fakeJudgeline.visible = true;

    this.judgement.clickParticleContainer.removeChildren()

    if (this._settings.showAPStatus)
    {
        if (this.judgement.score.APType === 1) this.sprites.fakeJudgeline.tint = 0xB4E1FF;
        else if (this.judgement.score.APType === 0) this.sprites.fakeJudgeline.tint = 0xFFFFFF;
    }
    
    for (const judgeline of this.chart.judgelines)
    {
        if (!judgeline.sprite) continue;

        judgeline.sprite.alpha = 0;
        if (judgeline.debugSprite) judgeline.debugSprite.visible = false;
    };
    for (const note of this.chart.notes)
    {
        if (!note.sprite) continue;

        note.sprite.alpha = 0;
        if (note.debugSprite) note.debugSprite.visible = false;
    };

    if (this.judgement.input.sprite) this.judgement.input.sprite.clear();
}

function runCallback(type)
{
    if (!this.functions[type]) return;
    this.functions[type].forEach((callback) => callback(this));
}

export {
    pauseBtnClickCallback,
    gameEndCallback,
    runCallback
}