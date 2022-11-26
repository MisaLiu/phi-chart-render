import { Text, Container } from 'pixi.js-legacy';

const getTime = () => performance ? performance.now() : Date.now();

export default class Score
{
    constructor(notesCount = 0, showAPStatus = true, isChallengeMode = false, autoPlay = false)
    {
        this._notesCount = Number(notesCount);
        this._showAPStatus = !!showAPStatus;
        this._autoPlay = !!autoPlay;

        if (isNaN((this._notesCount)) || this._notesCount <= 0)
        {
            console.warn('Invaild note count, Won\'t calculate score.');
            this._notesCount = 0;
        }

        this.scorePerNote  = isChallengeMode ? 1000000 / notesCount : 900000 / notesCount;
        this.scorePerCombo = isChallengeMode ? 0 : 100000 / notesCount;

        this.renderSize = {};
        
        this.reset();
    }

    reset()
    {
        this._score   = 0;
        this.score    = 0;
        this.acc      = 0;
        this.combo    = 0;
        this.maxCombo = 0;

        this.judgedNotes = 0;
        this.perfect     = 0;
        this.good        = 0;
        this.bad         = 0;
        this.miss        = 0;

        this.judgeLevel  = -1;
        this.APType      = 2;
        this.levelPassed = false;

        if (this.sprites)
        {
            this.sprites.score.oldValue = 0;
            this.sprites.score.addedValue = 0;
            this.sprites.score.currentValue = 0;
            this.sprites.score.valueChangedTime = NaN;

            this.sprites.acc.oldValue = 0;
            this.sprites.acc.addedValue = 0;
            this.sprites.acc.currentValue = 0;
            this.sprites.acc.valueChangedTime = NaN;

            this.sprites.combo.number.text = '0';
            this.sprites.acc.text = 'ACCURACY 0.00%';
            this.sprites.score.text = '0000000';

            this.sprites.combo.text.position.x = this.sprites.combo.number.width + this.renderSize.heightPercent * 6;
        }
    }

    createSprites(stage)
    {
        if (this.sprites) return;

        this.sprites = {};

        this.sprites.combo = {};
        this.sprites.combo.container = new Container();
        this.sprites.combo.container.zIndex = 99999;

        this.sprites.combo.number = new Text('0', {
            fontFamily: 'A-OTF Shin Go Pr6N H',
            fill: 0xFFFFFF
        });
        this.sprites.combo.number.alpha = 0.81;
        this.sprites.combo.text = new Text((this._autoPlay ? 'AUT' + 'OPL' + 'AY' : 'COMBO'), {
            fontFamily: 'MiSans',
            fill: 0xFFFFFF
        });
        this.sprites.combo.text.alpha = 0.55;
        this.sprites.combo.container.addChild(this.sprites.combo.number, this.sprites.combo.text);
        stage.addChild(this.sprites.combo.container);

        this.sprites.acc = new Text('ACCURACY 0.00%', {
            fontFamily: 'MiSans',
            fill: 0xFFFFFF
        });
        this.sprites.acc.alpha = 0.63;
        this.sprites.acc.zIndex = 99999;
        stage.addChild(this.sprites.acc);

        this.sprites.score = new Text('0000000', {
            fontFamily: 'A-OTF Shin Go Pr6N H',
            fill: 0xFFFFFF
        });
        this.sprites.score.alpha = 0.58;
        this.sprites.score.anchor.set(1, 0);
        this.sprites.score.zIndex = 99999;
        stage.addChild(this.sprites.score);

        this.sprites.score.currentValue = 0;
        this.sprites.acc.currentValue = 0;
    }

    calcTick()
    {
        if (!isNaN(this.sprites.score.valueChangedTime))
        {
            this.sprites.score.currentValue = Math.round(
                this.sprites.score.oldValue + (
                    this.sprites.score.addedValue * ((getTime() - this.sprites.score.valueChangedTime) / 400)
                )
            );

            if (this.sprites.score.currentValue >= (this.sprites.score.oldValue + this.sprites.score.addedValue))
            {
                this.sprites.score.currentValue = this.sprites.score.oldValue + this.sprites.score.addedValue;
                this.sprites.score.valueChangedTime = NaN;
            }

            this.sprites.score.text = fillZero(this.sprites.score.currentValue, 7);
        }

        if (!isNaN(this.sprites.acc.valueChangedTime))
        {
            this.sprites.acc.currentValue = (
                this.sprites.acc.oldValue + (
                    this.sprites.acc.addedValue * ((getTime() - this.sprites.acc.valueChangedTime) / 400)
                )
            );

            if (
                this.sprites.acc.currentValue === (this.sprites.acc.oldValue + this.sprites.acc.addedValue) ||
                (this.sprites.acc.addedValue > 0 && this.sprites.acc.currentValue > (this.sprites.acc.oldValue + this.sprites.acc.addedValue)) ||
                (this.sprites.acc.addedValue < 0 && this.sprites.acc.currentValue < (this.sprites.acc.oldValue + this.sprites.acc.addedValue))
            ) {
                this.sprites.acc.currentValue = this.sprites.acc.oldValue + this.sprites.acc.addedValue;
                this.sprites.acc.valueChangedTime = NaN;
            }

            this.sprites.acc.text = 'ACCURACY ' + (this.sprites.acc.currentValue * 100).toFixed(2) + '%';
        }
    }

    resizeSprites(size, isEnded)
    {
        this.renderSize = size;

        if (!this.sprites) return;

        this.sprites.combo.number.style.fontSize = size.heightPercent * 60;
        this.sprites.combo.text.style.fontSize = size.heightPercent * 30;

        this.sprites.acc.style.fontSize = size.heightPercent * 20;

        this.sprites.score.style.fontSize = size.heightPercent * 50;

        if (!isEnded)
        {
            this.sprites.combo.container.position.x = size.heightPercent * 72;
            this.sprites.combo.container.position.y = size.heightPercent * 41;
            this.sprites.combo.text.position.x = this.sprites.combo.number.width + size.heightPercent * 6;
            this.sprites.combo.text.position.y = size.heightPercent * 30;

            this.sprites.acc.position.x = size.heightPercent * 72;
            this.sprites.acc.position.y = size.heightPercent * 113;

            this.sprites.score.position.x = size.width - size.heightPercent * 139;
            this.sprites.score.position.y = size.heightPercent * 61;
        }
        else
        {
            this.sprites.combo.container.position.y = size.height;
            this.sprites.acc.position.y = size.height;
            this.sprites.score.position.y = size.height;
        }
    }

    pushJudge(type = 0, judgelines = [])
    {
        if (!this._autoPlay)
        {
            if (type > 2)
            {
                this.combo += 1;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                if (type === 4) this.perfect += 1;
                else {
                    this.good += 1;
                    if (this.APType >= 2)
                    {
                        this.APType = 1;

                        if (this._showAPStatus)
                        {
                            for (const judgeline of judgelines)
                            {
                                if (!judgeline.sprite) return;
                                judgeline.sprite.tint = 0xB4E1FF;
                            };
                        }
                    }
                }

                this._score += this.scorePerNote + (this.combo >= this.maxCombo ? this.scorePerCombo * (type === 4 ? 1 : 0.65) : 0); 
            }
            else
            {
                if (type === 2)this.bad += 1;
                else this.miss += 1;

                if (this.APType >= 1)
                {
                    this.APType = 0;

                    if (this._showAPStatus)
                    {
                        for (const judgeline of judgelines)
                        {
                            if (!judgeline.sprite) return;
                            judgeline.sprite.tint = 0xFFFFFF;
                        };
                    }
                }
                
                this.combo = 0;
            }
        }
        else
        {
            this.perfect += 1;
            this.combo += 1;
            this.maxCombo = this.combo;
            this._score += this.scorePerNote + this.scorePerCombo; 
        }
        
        this.judgedNotes++;
        this.score = Math.round(this._score);
        this.acc = (this.perfect + this.good * 0.65) / this.judgedNotes;

        if (this.score >= 1000000) this.judgeLevel = 6;
		else if (this.score >= 960000) this.judgeLevel = 5;
		else if (this.score >= 920000) this.judgeLevel = 4;
		else if (this.score >= 880000) this.judgeLevel = 3;
		else if (this.score >= 820000) this.judgeLevel = 2;
		else if (this.score >= 700000) this.judgeLevel = 1;
        else this.judgeLevel = 0;

        if (this.judgeLevel >= 1) this.levelPassed = true;

        if (this.sprites)
        {
            this.sprites.combo.number.text = this.combo;

            // this.sprites.acc.text = 'ACCURACY ' + (this.acc * 100).toFixed(2) + '%';
            this.sprites.acc.oldValue = this.sprites.acc.currentValue;
            this.sprites.acc.addedValue = this.acc - this.sprites.acc.oldValue;
            this.sprites.acc.valueChangedTime = getTime();

            // this.sprites.score.text = fillZero((this.score).toFixed(0));
            this.sprites.score.oldValue = this.sprites.score.currentValue;
            this.sprites.score.addedValue = this.score - this.sprites.score.oldValue;
            this.sprites.score.valueChangedTime = getTime();

            this.sprites.combo.text.position.x = this.sprites.combo.number.width + this.renderSize.heightPercent * 6;
        }
    }

    destroySprites()
    {
        if (!this.sprites) return;
        
        this.sprites.combo.number.destroy();
        this.sprites.combo.text.destroy();
        this.sprites.combo.container.destroy();
        this.sprites.combo = undefined;

        this.sprites.acc.destroy();
        this.sprites.acc = undefined;

        this.sprites.score.destroy();
        this.sprites.score = undefined;

        this.sprites = undefined;
    }
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