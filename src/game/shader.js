import { Filter, UniformGroup } from 'pixi.js'
export class Shader extends Filter {
    constructor(shader) {
        const fixedShader = "// " + shader.replaceAll('uv','vTextureCoord').replaceAll('screenTexture','uSampler')
        var re = new RegExp('uniform\\s+(\\w+)\\s+(\\w+);\\s+//\\s+%([^%]+)%', 'g');
        const defaults = Array.from(fixedShader.matchAll(re), m => {
            const typeName = m[1];
            const name = m[2];
            const value = m[3];
            switch (typeName) {
                case 'float':
                    return [name, parseFloat(value)];
                case 'vec2':
                    const [x, y] = value.split(',');
                    return [name, [parseFloat(x.trim()), parseFloat(y.trim())]];
                case 'vec4':
                    const [r, g, b, a] = value.split(',').map(v => parseFloat(v.trim()));
                    return [name, [r, g, b, a]];
                default:
                    throw Error('Unknown type: ' + typeName);
            }
        });
        
        const newUniforms = {}
        defaults.forEach((e) => { newUniforms[e[0]] = e[1] });
        newUniforms['time'] = 0;
        newUniforms['screenSize'] = [0.0, 0.0];
        newUniforms['UVScale'] = [0.0, 0.0];
        super(null, fixedShader, newUniforms)
        // why...
        defaults.forEach((e) => { this.uniforms[e[0]] = e[1] });
        this.uniforms['time'] = 0;
        this.uniforms['screenSize'] = [0.0, 0.0];
        this.uniforms['UVScale'] = [0.0, 0.0];
    }
    
    apply(filterManager, input, output, clear) {
        filterManager.applyFilter(this, input, output, clear);
    }

    update(uniforms) { 
        uniforms.forEach((e) => {
            this.uniforms[e[0]] = e[1];
        })
    }
}