define( function(require){

var qpf = require("qpf"),
	clazz = qpf.use("core/clazz"),
	ko = qpf.use("knockout"),
	Mapping = qpf.use("ko.mapping"),

	Pass = require("./pass");

var FX = clazz.derive(function(){
	return {
		// list of all passes
		_passes : ko.observableArray(),

		// Example of parameter
		// {
		// 	name : "Parameter Name",
		// 	ui : "qpf_ui_type",
		// 	value : 10,
		// 	type : "f",
		// 	//  Below is option of the specified UI
		// 	max : 100,
		// 	min : 1,
		// 	step : 0.1,
		// 	precision : 
		// }
		parameters : ko.observableArray()
	}

}, function(){

	this.passes = Mapping.fromJS( this.passes );

	_.each(this.passes && this.passes(), function(singlePassConfig){

		var pass = new Pass({
			fragmentShader : singlePassConfig.shaderString(),
			inputPin : {
				texture : null
			},
			parameters : {
				imageWidth : {
					type : "f",
					value : 1024
				},
				imageHeight : {
					type : "f",
					value : 1024
				}
			}
		})
		var uniforms = singlePassConfig && singlePassConfig.uniforms;
		_.each(uniforms, function(uniform, uniformName){
			var item = {};
			var value = ko.utils.unwrapObservable( uniform.value );
			if(typeof(value) == "string"){
				var result = value.match(/(\S*)\((.*)\)/);
				if(result){
					var processorName = result[1],
						args = result[2].replace("\n", "").split(/\s*,\s*/),
						processor = processors[processorName];
					if( processor ){
						value = processor.apply(processors, args);
					}
				}
			}
			item[uniformName] = {
				value : value,
				type : uniform.type && uniform.type()
			}
			
			pass.addParameter(item);			// Update the paramter in the uniform
			uniform.value.subscribe(function(newValue){
				pass.updateParameter(uniformName, newValue);
			});
			this.parameters.push( uniform );
		}, this)
		this._passes.push(pass);
	}, this);
	
	// data provides for ui
	this.provides = ko.computed(function(){
		var ret = [];
		_.each(this.parameters(), function(origin){
			if( ! origin.ui){
				return;
			}
			var param = _.omit(origin, "ui", "type");
			_.extend(param, {
				type : origin.ui
			});
			ret.push(param);
		});
		return ret;
	}, this)
}, {

	eachPass : function(callback){
		_.each(this._passes(), function(pass){
			callback && callback(pass);
		});
	},
	dispose : function(){
		
	}
})

var processors = {
	mat4 : function( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ){
		_.each(arguments, function(item, i){
			arguments[i] = parseInt(item);
		});
		return new THREE.Matrix4( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 );
	},
	mat3 : function( n11, n12, n13, n21, n22, n23, n31, n32, n33 ){
		_.each(arguments, function(item, i){
			arguments[i] = parseInt(item);
		});
		return new THREE.Matrix3(n11, n12, n13, n21, n22, n23, n31, n32, n33);
	},
	texture : function(src){
		// TODO : Should be relative to the fx path

		var texture = THREE.ImageUtils.loadTexture("fx/"+src);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.flipY = false;
		texture.needsUpdate = true;
		return texture;
	}
}

return FX;

} )