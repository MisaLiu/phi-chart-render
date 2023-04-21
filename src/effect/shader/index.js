import * as presets from './presets';
import { Filter } from 'pixi.js';

const defaultValueReg = /uniform\s+(\w+)\s+(\w+);\s+\/\/\s+%([^%]+)%/g;

export default class Shader extends Filter {
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

    static from(shaderText)
    {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');

        if (!gl) throw 'Your browser doesn\'t support WebGL.';

        // Clear canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Init shader
        const shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, shaderText);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            throw `An error occurred compiling the shaders.\n${gl.getShaderInfoLog(shader)}`;
        }

        return new Shader(shaderText);
    }
    
    static get presets()
    {
        return presets;
    }

    update(uniforms) {
        for (const name in uniforms) this.uniforms[name] = uniforms[name];
    }
}