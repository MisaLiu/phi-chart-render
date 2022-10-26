export default class JudgePoint
{
    constructor(input, type = 1)
    {
        this.x = input.x;
        this.y = input.y;
        this.input = input;
        this.type  = type; // 1: tap, 2: flick, 3: hold
    }

    isInArea(x, y, cosr, sinr, hw)
    {
        return Math.abs((this.x - x) * cosr + (this.y - y) * sinr) <= hw;
    }
}