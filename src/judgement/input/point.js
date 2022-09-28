export default class InputPoint
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
        this.time = 0;
        this.isMove = false;
    }

    move(x, y)
    {
        this.x = x;
        this.y = y;

        this.isMove = true;
        this.time = 0;
    }

    calcTick()
    {
        this.isMove = false;
        this.time++;
    }
}