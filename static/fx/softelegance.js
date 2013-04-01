define(function(require){

	var Pass = require("modules/ppmanager/pass"),
		lookup = require("text!shaders/imagelookup.essl"),
		blurH = require("text!shaders/gaussian_h.essl"),
		blurV = require("text!shaders/gaussian_v.essl"),
		alphaBlend = require("text!shaders/alphablend.essl");

	var SoftElegance = function(){

		this.name = "Soft Elegance"
		function loadLookUp(path){
			var texture = THREE.ImageUtils.loadTexture(path);
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.NearestFilter;
			texture.flipY = false;
			texture.needsUpdate = true;
			return texture;
		}
		this._lookupPass1 = new Pass({
			fragmentShader : lookup,
			inputPin : {
				texture : null,
				lookup : loadLookUp("fx/lookups/lookup_soft_elegance_1.png")
			}
		});
		this._blurHPass = new Pass({
			fragmentShader : blurH,
			inputPin : {
				texture : null
			},
			parameters : {
				blurSize : {
					type : "f",
					value : 9.7
				}
			}
		});
		this._blurVPass = new Pass({
			fragmentShader : blurV,
			inputPin : {
				texture : null
			},
			parameters : {
				blurSize : {
					type : "f",
					value : 9.7
				}
			}
		});
		this._blendPass = new Pass({
			fragmentShader : alphaBlend,
			inputPin : {
				texture : null,
				overlay : null
			},
			parameters : {
				percent : {
					type : "f",
					value : 0.17
				}
			}
		});
		this._lookupPass2 = new Pass({
			fragmentShader : lookup,
			inputPin : {
				texture : null,
				lookup : loadLookUp("fx/lookups/lookup_soft_elegance_2.png")
			}
		})

		this._extraRT1 = new THREE.WebGLRenderTarget(1024, 1024, {
			minFilter : THREE.LinearFilter,
			magFilter : THREE.LinearFilter,
			format : THREE.RGBFormat
		})
		this._extraRT2 = new THREE.WebGLRenderTarget(1024, 1024, {
			minFilter : THREE.LinearFilter,
			magFilter : THREE.LinearFilter,
			format : THREE.RGBFormat
		})

		this.provides = [];
	}

	SoftElegance.prototype.render = function(renderer, input, output){
		this._lookupPass1.setInputPin("texture", input);
		this._lookupPass1.setOutputPin( output );
		this._lookupPass1.render( renderer );

		this._blurHPass.setInputPin("texture", output );
		this._blurHPass.setOutputPin( this._extraRT1);
		this._blurHPass.render( renderer );

		this._blurVPass.setInputPin("texture", this._extraRT1 );
		this._blurVPass.setOutputPin( this._extraRT2 );
		this._blurVPass.render( renderer );

		// output is the result of lookup pass 1
		// extraRT2 is the result of blur pass
		this._blendPass.setInputPin("texture", output);
		this._blendPass.setInputPin("overlay", this._extraRT2);
		this._blendPass.setOutputPin( this._extraRT1);
		this._blendPass.render( renderer );

		this._lookupPass2.setInputPin("texture", this._extraRT1);
		this._lookupPass2.setOutputPin(output);
		this._lookupPass2.render( renderer );

		return output;
	}

	SoftElegance.prototype.dispose = function(){

		this._extraRT1.dispose();
		this._extraRT2.dispose();
	}

	return SoftElegance;
})