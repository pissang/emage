define(function(require){

	var Module = require("../module"),
		xml = require("text!./viewport.xml"),
		layers = require("../layers/index"),
		Viewport = require("./viewport");

	var viewport = new Module({
		name : "viewport",
		xml : xml,

		onRender : onRender,
		onResize : onResize,

		texture : THREE.ImageUtils.loadTexture('../file_upload/3.jpg')
	})
	// viewport.texture.image.onload = function(){
	// 	viewport.texture.needsUpdate = true;
	// 	var ratio = this.height/this.width;
	// 	// resize
	// 	viewport.mainComponent.height(viewport.mainComponent.width()*ratio);
	// }

	var interval = 0,
		renderer;

	var manager = layers.manager;
	manager.texture = viewport.texture;

	function onRender(){
		renderer = this.renderer;
		if( interval ){
			clearInterval(interval);
		}
		setInterval(render, 100);
	}
	function onResize(){
		renderer && renderer.setSize(this.width(), this.height());
	}

	function render(){
		viewport.trigger("beforerender");
		manager.render( renderer );
	}

	return viewport;
})