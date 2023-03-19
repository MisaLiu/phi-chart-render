export default class InputPoint
{
    constructor(type, id, x, y)
    {
        this.type = type;
        this.id = id;

        this.x = x;
        this.y = y;

        this.isActive = true;
        this.isTapped = false;
        this.isMoving = false;
        this.isFlickable = false;
        this.isFlicked = false;

        this._deltaX = 0;
        this._deltaY = 0;
        this._lastDeltaX = 0;
        this._lastDeltaY = 0;
        this._currentTime = performance.now();
        this._deltaTime = this._currentTime;
    }

    move(x, y)
    {
        this._lastDeltaX = this._deltaX;
        this._lastDeltaY = this._deltaY;

        this._deltaX = x - this.x;
        this._deltaY = y - this.y;

        this.x = x;
        this.y = y;

        this.isMoving = true;

        {
            let currentTime = performance.now();

            this._deltaTime = currentTime - this._currentTime;
            this._currentTime = currentTime;
        }

        {
            let moveSpeed = (this._deltaX * this._lastDeltaX + this._deltaY * this._lastDeltaY) / Math.sqrt(this._lastDeltaX ** 2 + this._lastDeltaY ** 2) / this._deltaTime;

            if (this.isFlickable && moveSpeed < 0.50)
            {
                this.isFlickable = false;
                this.isFlicked = false;
            }
            else if (!this.isFlickable && moveSpeed > 1.00)
            {
                this.isFlickable = true;
            }
        }
    }
}