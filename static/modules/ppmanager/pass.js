//author bm2736892@gmail.com

define( function(require){

var Pass = function(options){

    var self = this;

    /**
     * postprocessing的一个node的输入端
     */
    this.inputPin = {};

    this._inputSlot = 0;
    /**
     * postprocessing的一个node的参数
     */
    this.parameters = {},
    /**
     * postprocessing的一个node的输出端
     */
    this.outputPin = null,

    this.fragmentShader = "",

    this._material = new THREE.ShaderMaterial({
        vertexShader : ['varying vec2 vUv;',
                            'void main(){',
                                'vUv = vec2(uv.x, uv.y);',
                                'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                            '}'
                        ].join('\n')
    });

    options = options || {};

    //bind data
    this.initialize(options);

    //
    this._camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    this._geometry = new THREE.PlaneGeometry( 2, 2 )

    this._quad = new THREE.Mesh( this._geometry, this._material );

    this._scene = new THREE.Scene();
    this._scene.add( this._quad );
    this._scene.add( this._camera );
}

Pass.prototype = {

    initialize : function(options){
        options.fragmentShader &&
            this.setFragmentShader( options.fragmentShader );

        options.inputPin && 
            this.addInputPin( options.inputPin );

        options.outputPin &&
            this.setOutputPin( options.outputPin );

        options.parameters &&
            this.addParameter( options.parameters ); 

    },

    addInputPin : function( textures){
        for( var key in textures){
            this.inputPin[key] = textures[key];
            this._material.uniforms[key] = {
                type : 't',
                value : textures[key]
            };
        }
    },

    addParameter : function(params){
        for( var key in params ){
            this.parameters[key] = params[key];
            this._material.uniforms[key] = params[key];
        }
    },

    updateParameter : function(key, value){
        if( typeof key == "string"){
            var params = {};
            params[key] = value;
        }else{
            params = key;
        }
        for( var key in params ){
            this.parameters[key].value = params[key]
            this._material.uniforms[key].value = params[key];
        }
    },

    setInputPin : function(key, texture){
        if( typeof key == "string"){
            var textures = {};
            textures[key] = texture;
        }else{
            var textures = key;
        }
        for( var key in textures){
            this.inputPin[key] = textures[key];
            var uniform = this._material.uniforms[key];
            uniform.value = textures[key];
        }
    },

    removeInputPin : function(key){
        this.inputPin[key] = null;
        var uniform = this._material.uniforms[key];
        uniform.value = null;
    },

    setOutputPin : function(texture){
        this.outputPin = texture;
    },

    removeOutputPin : function(){

        this.outputPin = null;
    },

    setFragmentShader : function(shaderString){

        this.fragmentShader = shaderString;
        this._material.fragmentShader = shaderString;
        this._material.needsUpdate = true;
    },

    setVertexShader : function(shaderString){

        this._material.vertexShader = shaderString;
        this._material.needsUpdate = true;
    },

    render : function(renderer, output){

        if(this.outputPin && !output){

            renderer.render(this._scene, this._camera, this.outputPin, true);
        }else{
            
            renderer.render(this._scene, this._camera)
        }
    }
}

return Pass;
});
