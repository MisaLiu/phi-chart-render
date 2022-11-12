const getTime = () => performance ? performance.now() : Date.now();

export default class InputPoint
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
        this.tick = 0;
        this.isMoving = false;
        this.isFlickable = false;
        this.isFlicked = false;

        this._deltaX = 0;
        this._deltaY = 0;
        this._lastDeltaX = 0;
        this._lastDeltaY = 0;
        this._currentTime = getTime();
        this._deltaTime   = this._currentTime;
    }

    move(x, y)
    {
        const currentTime = getTime();

        this._lastDeltaX = this._deltaX;
        this._lastDeltaY = this._deltaY;
        this._deltaX = x - this.x;
        this._deltaY = y - this.y;
        this.x = x;
        this.y = y;

        this.tick = 0;
        this.isMoving = true;

        this._deltaTime = currentTime - this._currentTime;
        this._currentTime = currentTime;

        const moveSpeed = (this._deltaX * this._lastDeltaX + this._deltaY * this._lastDeltaY) / Math.sqrt(this._lastDeltaX ** 2 + this._lastDeltaY ** 2) / this._deltaTime;

        if (!this.isFlickable && moveSpeed > 0.8)
        {
            this.isFlickable = true;
            this.isFlicked = false;
        }
        else if (this.isFlickable && moveSpeed < 0.3)
        {
            this.isFlickable = false;
        }
    }

    calcTick()
    {
        this.tick++;
    }
}