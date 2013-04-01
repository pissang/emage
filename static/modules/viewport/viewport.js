define(function(require){

	var qpf = require("qpf"),
		Meta = qpf.use("components/meta/meta"),
		ko = qpf.use("knockout");

	var Viewport = Meta.derive(function(){
		return {
			tag : "canvas"
		}
	}, {
		type : 'VIEWPORT',
		css : "viewport",
		initialize : function(){
			this.renderer = new THREE.WebGLRenderer({
				canvas : this.$el[0]
			})
		}
	})

	Meta.provideBinding("viewport", Viewport);

	return Viewport;
})