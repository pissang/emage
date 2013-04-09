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

		texture : THREE.ImageUtils.loadTexture('../file_upload/4.jpg'),

		resize : function(){
			var img = viewport.texture.image;
			var ratio = img.height/img.width;
			if( viewport.mainComponent.parent ){
				var maxWidth = viewport.mainComponent.parent.width();
				var maxHeight = viewport.mainComponent.parent.height();
				// resize
				if( ratio < 1){
					viewport.mainComponent.$el.css({
						"margin-top" : (maxHeight - maxWidth*ratio)/2+"px",
						"margin-left" : "0px"
					} );
					viewport.mainComponent.height( maxWidth*ratio );
					viewport.mainComponent.width( maxWidth );
				}else{
					viewport.mainComponent.$el.css({
						"margin-left" : (maxWidth - maxHeight/ratio)/2,
						"margin-top" : "0px"
					});
					viewport.mainComponent.width( maxHeight/ratio );
					viewport.mainComponent.height( maxHeight );
				}
			}
		}
	})
	viewport.texture.image.onload = function(){
		viewport.texture.needsUpdate = true;
		viewport.resize();
	}
	viewport.on("start", function(){
		viewport.resize();
	})

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