define( function(require){

var qpf = require("qpf"),
	clazz = qpf.use("core/clazz"),

	ko = qpf.use("knockout"),
	FX = require("./fx"),
	Pass = require("./pass");

var pars = {
	minFilter : THREE.LinearFilter,
	magFilter : THREE.LinearFilter,
	format : THREE.RGBFormat
}
var Manager = clazz.derive(function(){
return{

	// list of all fx
	fxs : ko.observableArray(),

	// Input texture for each pass
	inputRT : new THREE.WebGLRenderTarget(1024, 1024, pars),
	outputRT : new THREE.WebGLRenderTarget(1024, 1024, pars),

	texture : null,

	outputPass : new Pass({
		fragmentShader : [
			"uniform float opacity;",
			"uniform sampler2D texture;",
			"varying vec2 vUv;",
			"void main() {",
				"vec4 texel = texture2D( texture, vUv );",
				"gl_FragColor = opacity * texel;",
			"}"].join("\n"),
		parameters : {
			opacity : {
				type : 'f',
				value : 1.0
			}
		},
		inputPin : {
			texture : null
		}
	}),
	// data provides to layer 
	provides : ko.observableArray()
}
}, function(){
	// It will not be triggered when the parameters in each fx 
	// is changed or added or  deleted.
	var oldArray = _.clone( this.fxs() );
	this.fxs.subscribe(function(newArray){
		var result = [],
			provides = this.provides();
		var difference = ko.utils.compareArrays(oldArray, newArray);
		_.each(difference, function(item){
			if(item.status === "retained"){
				var idx = oldArray.indexOf(item.value);
				result[ index ]= provides[idx];
			}
			else if( item.status === "added"){
				var fx  = item.value;
				result[item.index] = {
					title : fx.name,
					parameters : ko.utils.unwrapObservable( fx.provides )
				}
			}
		}, this)
		this.provides( result );
	}, this)

}, {

	add : function(name, callback){
		var self = this;
		require(["fxs/" + name], function(config){
			// self defined fx constructor
			if( typeof(config) === "function"){
				var fx = new config();
				self.fxs.push( fx );
				callback && callback(fx);
			}
			else{
				var passes = config.passes;
				var remaind = 0;
				_.each(passes, function(singlePass, idx){
					if(singlePass.shader){
						remaind++;
						require(['text!shaders/'+singlePass.shader ], function(shaderString){
							singlePass.shaderString = shaderString;
							remaind--;
							if( remaind == 0){
								var fx = self.buildFx( config );
								callback && callback( fx );
							}
						})
					}
				})
			}
		})
	},

	buildFx : function(config){
		var fx = new FX( config );
		this.fxs.push( fx );
		return fx;
	},

	render : function(renderer){
		var firstPass = true,
			self = this;

		_.each(this.fxs(), function(fx){
			if( fx instanceof FX){
				fx.eachPass(function(pass){
					if(firstPass){
						pass.setInputPin("texture", self.texture);
						firstPass = false;
					}else{
						pass.setInputPin("texture", self.inputRT);
					}
					pass.setOutputPin(self.outputRT);
					pass.render(renderer);

					self._swap();
				})	
			}else{
				// self defined
				var outputRT = fx.render( renderer, firstPass ? self.texture : self.inputRT, self.outputRT );
				if( outputRT === self.outputRT){
					self._swap();
				}
				firstPass = false;
			}
		})
		// final pass
		this.outputPass.setInputPin('texture', firstPass ? self.texture : self.inputRT);
		this.outputPass.render( renderer );
	},

	_swap : function(){
		var tmp = this.inputRT;
		this.inputRT = this.outputRT;
		this.outputRT = tmp;
	}
})


return Manager;

} )