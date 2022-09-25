const JudgeTimes = {
    bad     : 200,
    good    : 160,
    percect : 80,

    badChallenge     : 100,
    goodChallange    : 75,
    perfectChallange : 40
};

export default class Score
{
    constructor(notesCount = 0, isChallengeMode = false)
    {
        this._notesCount = Number(notesCount);

        if (isNaN((this._notesCount)) || this._notesCount <= 0)
        {
            console.warn('Invaild note count, Won\'t calculate score.');
            this._notesCount = 0;
        }

        this.scorePerNote  = isChallengeMode ? 1000000 / notesCount : 900000 / notesCount;
        this.scorePerCombo = isChallengeMode ? 0 : 100000 / notesCount;
        
        this.score    = 0;
        this.acc      = 0;
        this.combo    = 0;
        this.maxCombo = 0;

        this.perfect = 0;
        this.good    = 0;
        this.bad     = 0;
        this.miss    = 0;

        this.judgeLevel = -1;
        this.levelPassed = false;
    }

    pushJudge(type = 0)
    {
        if (type > 2)
        {
            this.combo += 1;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            if (type === 4) this.perfect += 1;
            else this.good += 1;

            this.score += this.scorePerNote + (this.combo >= this.maxCombo ? this.scorePerCombo * (type === 4 ? 1 : 0.65) : 0); 
        }
        else
        {
            if (type === 2)this.bad += 1;
            else this.miss += 1;
            
            this.combo = 0;
        }

        if (this.score >= 700000) this.levelPassed = true;
    }
}