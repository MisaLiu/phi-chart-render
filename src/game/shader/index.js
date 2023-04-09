import { Filter, UniformGroup } from 'pixi.js';

const defaultValueReg = /uniform\s+(\w+)\s+(\w+);\s+\/\/\s+%([^%]+)%/g;

export class Shader extends Filter {
    constructor(_shaderText)
    {
        const shaderText = "// " + _shaderText.replaceAll('uv', 'vTextureCoord').replaceAll('screenTexture', 'uSampler');
        const defaultValues = {};
        let uniforms = {
            time: 0,
            screenSize: [ 0, 0 ],
            UVScale: [ 0, 0 ]
        };
        
        [ ...shaderText.matchAll(defaultValueReg) ].map((uniform) =>
            {
                const type = uniform[1];
                const name = uniform[2];
                const value = uniform[3];

                switch (type)
                {
                    case 'float':
                    {
                        defaultValues[name] = parseFloat(value);
                        break;
                    }
                    case 'vec2':
                    case 'vec4':
                    {
                        defaultValues[name] = value.split(',').map(v => parseFloat(v.trim()));
                        break;
                    }
                    default:
                    {
                        throw Error('Unknown type: ' + typeName);
                    }
                }
            }
        );

        uniforms = { ...defaultValues, ...uniforms };
        super(null, shaderText, uniforms);

        for (const name in uniforms) this.uniforms[name] = uniforms[name];
        this.defaultValues = defaultValues;
    }
    
    /*
    apply(filterManager, input, output, clear) {
        filterManager.applyFilter(this, input, output, clear);
    }
    */

    update(uniforms) {
        for (const name in uniforms) this.uniforms[name] = uniforms[name];
        /* 
        uniforms.forEach((e) => {
            this.uniforms[e[0]] = e[1];
        })
        */
    }
}