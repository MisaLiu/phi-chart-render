export default class Score
{
    constructor(notesCount, isChallengeMode = false)
    {
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
    }
}