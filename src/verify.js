function bool(bool, defaultValue = false)
{
    return (typeof bool === 'boolean') ? !!bool : defaultValue;
}

function number(number, defaultValue = 0, min = -Infinity, max = Infinity)
{
    return (!isNaN(number) && min <= parseFloat(number) && parseFloat(number) <= max ? parseFloat(number) : defaultValue);
}

function text(text, defaultValue = '')
{
    return ((typeof text === 'string') && text != '') ? text : defaultValue;
}

export {
    bool,
    number,
    text
}