export default class JudgePoint
{
    constructor(x, y, type = 1)
    {
        this.x = x;
        this.y = y;
        this.type = type; // 1: tap, 2: flick, 3: hold
    }

    isInArea(x, y, cosr, sinr, hw)
    {
        return Math.abs((this.x - x) * cosr + (this.y - y) * sinr) <= hw;
    }
}