
function calcTick()
{
    { // 为暂停按钮计算渐变
        let pauseButton = this.sprites.pauseButton;
        if (pauseButton.clickCount === 1)
        {
            if (pauseButton.alpha < 1)
            { // 按钮刚被点击一次
                pauseButton.alpha = 0.5 + (0.5 * ((Date.now() - pauseButton.lastClickTime) / 200));
            }
            else if (pauseButton.alpha >= 1 && Date.now() - pauseButton.lastClickTime >= 2000)
            { // 按钮刚被点击一次，且 2s 后没有进一步操作
                pauseButton.clickCount = 0;
                pauseButton.lastRenderTime = Date.now();
                pauseButton.isEndRendering = true;
            }
            else if (pauseButton.alpha >= 1)
            { // 按钮被点击一次，且 200ms 后不透明度已到 1
                pauseButton.alpha = 1;
                pauseButton.lastRenderTime = Date.now();
            }
        }
        else if (pauseButton.clickCount === 0 && pauseButton.isEndRendering)
        {
            if (pauseButton.alpha > 0.5)
            {
                pauseButton.alpha = 1 - (0.5 * ((Date.now() - pauseButton.lastRenderTime) / 200));
            }
            else if (pauseButton.alpha <= 0.5)
            {
                pauseButton.alpha = 0.5;
                pauseButton.lastRenderTime = Date.now();
                pauseButton.isEndRendering = false;
            }
        }
    }

    switch (this._animateStatus)
    {
        case 0:
        {
            this._calcGameAnimateTick(true);
            break;
        }
        case 1:
        {
            this.chart.calcTime(this._audioTimer.time);
            this.judgement._holdBetween = this.chart.holdBetween;
            if (!this._isPaused) this.judgement.calcTick();

            this.sprites.progressBar.scale.x = (this._audioTimer.time / this.chart.music._duration) * this.sprites.progressBar.baseScaleX;
            break;
        }
        case 2:
        {
            this._calcGameAnimateTick(false);
            break;
        }
        case 3:
        {
            break;
        }
    }
}

function calcGameAnimateTick(isStart = true)
{
    let _progress = (Date.now() - (isStart ? this._gameStartTime : this._gameEndTime)) / 1500,
        progress = (isStart ? 1 - Math.pow(1 - _progress, 4) : Math.pow(1 - _progress, 4));
    let sprites = {
        score: this.judgement.score.sprites,
        chart: this.chart.sprites
    };

    // Combo、准度、分数、暂停按钮和进度条
    sprites.score.combo.container.position.y = -(sprites.score.combo.container.height + sprites.score.acc.height) + ((sprites.score.combo.container.height + sprites.score.acc.height + (this.render.sizer.heightPercent * 41)) * progress);
    sprites.score.acc.position.y = sprites.score.combo.container.position.y + (this.render.sizer.heightPercent * 72);
    sprites.score.score.position.y = -(sprites.score.score.height) + ((sprites.score.score.height + (this.render.sizer.heightPercent * 61)) * progress);
    this.sprites.pauseButton.position.y = -(this.sprites.pauseButton.height) + ((this.sprites.pauseButton.height + (this.render.sizer.heightPercent * (61 + 14))) * progress);
    this.sprites.progressBar.position.y = -(this.render.sizer.heightPercent * 12) * (1 - progress);

    // 谱面信息
    sprites.chart.info.songName.position.y = (this.render.sizer.height + sprites.chart.info.songName.height) - ((sprites.chart.info.songName.height + (this.render.sizer.heightPercent * 66)) * progress);
    sprites.chart.info.songDiff.position.y = sprites.chart.info.songName.position.y + (this.render.sizer.heightPercent * 24);

    // 假判定线过场动画
    this.sprites.fakeJudgeline.width = this.render.sizer.width * progress;

    // 背景图亮度
    if (this.chart.sprites.bg && this.chart.sprites.bg.cover) this.chart.sprites.bg.cover.alpha = this._settings.bgDim * progress;

    if (_progress >= 1)
    {
        if (isStart)
        {
            this._animateStatus = 1;
            this.resize(true, false);

            setTimeout(async () =>
            {
                this._musicId = this.chart.music.play();
                // this._audioTimer.start();

                for (const judgeline of this.chart.judgelines)
                {
                    if (!judgeline.sprite) continue;

                    judgeline.sprite.alpha = 1;
                    if (judgeline.debugSprite) judgeline.debugSprite.visible = true;
                };
                for (const note of this.chart.notes)
                {
                    if (note.sprite) note.sprite.alpha = note.basicAlpha;
                };

                this._isPaused = false;
                this._isEnded = false;
                this.sprites.fakeJudgeline.visible = false;

                this._runCallback('start');
            }, 200);
        }
        else
        {
            this._animateStatus = 3;
            this._isPaused = true;
            this._isEnded = true;
            this._runCallback('end');
            this._audioTimer.reset();
        }
    }
}

export {
    calcTick,
    calcGameAnimateTick
}