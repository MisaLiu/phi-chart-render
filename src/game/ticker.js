
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
            let { chart, effects, judgement, functions, processors, sprites, render, _settings: settings } = this;
            let currentTime = chart.music.currentTime - (chart.offset + settings.offset);

            for (let i = 0, length = chart.bpmList.length; i < length; i++)
            {
                let bpm = chart.bpmList[i];

                if (bpm.endTime < currentTime) continue;
                if (bpm.startTime > currentTime) break;

                judgement._holdBetween = bpm.holdBetween;
            };

            for (let i = 0, length = chart.judgelines.length; i < length; i++)
            {
                const judgeline = chart.judgelines[i];
                judgeline.calcTime(currentTime, render.sizer);
                for (let x = 0, length = processors.judgeline.length; x < length; x++) processors.judgeline[x](judgeline, currentTime);
            };
            for (let i = 0, length = chart.notes.length; i < length; i++)
            {
                const note = chart.notes[i];
                note.calcTime(currentTime, render.sizer);
                for (let x = 0, length = processors.note.length; x < length; x++) processors.note[x](note, currentTime);
                judgement.calcNote(currentTime, note);
            };

            if (!this._isPaused)
            {
                judgement.calcTick();
                for (let x = 0, length = functions.tick.length; x < length; x++) functions.tick[x](this, currentTime);

                if (settings.shader)
                {

                    render.gameContainer.filters = [];
                    render.stage.filters = [];
                    for (let i in chart.judgeline) chart.judgeline[i].noteContainer.filters = [];
                    for (let i in chart.notes) chart.notes[i].sprite.filters = [];
                    for (let i = 0, length = effects.length; i < length; i++)
                    {
                        const effect = effects[i];
                        if (effect.shader === null) continue;
                        if (effect.endTime < currentTime) continue;
                        if (effect.startTime > currentTime) break;

                        effect.calcTime(currentTime, render.sizer.shaderScreenSize);
                        
                        if (effect.target) {
                            const selectors = effect.target.split(' ');
                            selectors.forEach((selector) => { 
                                    if (selector.startsWith('L')) {
                                        const judgelineIndex = parseInt(selector.substr(1));
                                        if (effect.isGlobal) {
                                            this.chart.judgeline[judgelineIndex].sprite.parent.filters.push(effect.shader);
                                        }
                                        else {
                                            this.chart.judgeline[judgelineIndex].noteContainer.filters.push(effect.shader);
                                        }
                                    }
                                    else if (selector.startsWith('N')) {
                                        const noteIndex = parseInt(selector.substr(1));
                                        this.chart.notes[noteIndex].sprite.filters.push(effect.shader);
                                    }
                            });
                        }
                        else {
                            if (effect.isGlobal) render.stage.filters.push(effect.shader);
                            else render.gameContainer.filters.push(effect.shader);
                        }
                    }
                }
            }

            sprites.progressBar.scale.x = chart.music.progress * sprites.progressBar.baseScaleX;

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
                this.chart.music.play(true);

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
        }
    }
}

export {
    calcTick,
    calcGameAnimateTick
}