
function onKeyPressCallback(e)
{
    let keyCode     = e.keyCode,
        isHoldCtrl  = e.ctrlKey,
        isHoldShift = e.shiftKey,
        skipTime    = 0;

    if (this._isPaused) return;
    if (!this._settings.autoPlay) return;
    if (this._animateStatus !== 1) return;

    switch (keyCode)
    {
        case 37: {
            skipTime = 2000;
            break;
        }
        case 39: {
            skipTime = -2000;
            break;
        }
        default: {
            return;
        }
    }
    
    if (isHoldCtrl && isHoldShift) skipTime *= 5;
    else if (isHoldCtrl) skipTime *= 2;
    else if (isHoldShift) skipTime *= 0.5;

    this._audioTimer.pause();
    this._audioTimer.skip(skipTime);

    {
        let currentTime = this._audioTimer.time;
        let calcedNoteCount = 0;

        for (const note of this.chart.notes)
        {
            if (note.isFake) continue;
            if (note.score <= 0) break;
            if (note.time < currentTime)
            {
                calcedNoteCount++;
                continue;
            }

            note.reset();
        }

        this.judgement.score.perfect = this.judgement.score.judgedNotes = this.judgement.score.combo = this.judgement.score.maxCombo = calcedNoteCount;
        this.judgement.score._score = (this.judgement.score.scorePerNote + this.judgement.score.scorePerCombo) * calcedNoteCount;

        if (this.judgement.score.sprites)
        {
            this.judgement.score.sprites.combo.number.text = this.judgement.score.combo;

            this.judgement.score.sprites.acc.text = 'ACCURACY ' + (this.judgement.score.acc * 100).toFixed(2) + '%';
            this.judgement.score.sprites.score.text = fillZero((this.judgement.score.score).toFixed(0), 7);

            this.judgement.score.sprites.combo.text.position.x = this.judgement.score.sprites.combo.number.width + this.render.sizer.heightPercent * 6;
        }

        function fillZero(num, length = 3)
        {
            let result = num + '';
            while (result.length < length)
            {
                result = '0' + result;
            }
            return result;
        }
    }

    this.chart.music.once('play', () => { this._audioTimer.pause() });
    this.chart.music.pause();
    this.chart.music.seek(this._audioTimer.time);
    this.chart.music.play();
}

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
    onKeyPressCallback,
    pauseBtnClickCallback,
    gameEndCallback,
    runCallback
}