# Phi-Chart-Render

A *Phigros* chart render based on [Pixi.js](https://pixijs.com)

This project is still working.

Huge thanks to [@lchzh3473](https://github.com/lchzh3473) and his awesome [sim-phi](https://github.com/lchzh3473/sim-phi) project!

## Currently supported chart features

* Official charts
    * [x] Basic support
    * [x] Custom judgeline texture *(Need test)*

* PhiEdit charts
    * [x] Basic support
    * [x] BPM List *(Need test)*
    * [x] Custom judgeline texture *(Need test)*
    * [x] Negative alpha *(Need test)*
    * note features
        * [x] Basic support
        * [x] Fake note support
        * [x] Note scale support

* Re:PhiEdit charts
    * [x] BPM List *(Need test)*
    * [x] Event Layers support  *(Need test)*
    * [x] Custom judgeline texture *(Need test)*
    * [x] Judgeline cover type
    * [x] Parent judgeline
    * [x] Easing start/end point
    * [ ] Event link group *(?)*
    * [ ] judgeline z order
    * [ ] BPM factor *(?)*
    * [ ] Note controls *(?)*
    * Extend events
       * [x] Scale X
       * [x] Scale Y
       * [x] Text
       * [x] Color
       * [x] Incline
       * [ ] ~~Draw (wont support)~~
    * note features
        * [x] Basic support
        * [x] Fake note support
        * [x] Note scale
        * [x] Note alpha
        * [x] yOffset
        * [x] visible time

## Development

You must have a Node.js enviorment to helping development.

1. Clone this repo.
2. `npm install`
3. `npm run dev`

## Copyrights of the materials

All of the materials are from [Ph1gr0s-Emulator](https://github.com/MisaWorkGroup/Ph1gr0s-Emulator).

Any unauthorized use of these materials is __*NOT*__ allowed.

## License
```
    phi-chart-render - A Phigros chart render based on Pixi.js
    Copyright (C) 2022 HIMlaoS_Misa

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
```