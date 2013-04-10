define(function(require){

	var Module = require("../module"),
		xml = require("text!./viewport.xml"),
		layers = require("../layers/index"),
		histogram = require('../histogram/index'),
		Viewport = require("./viewport"),

		qpf = require("qpf"),
		ko = qpf.use("knockout")

	var viewport = new Module({
		name : "viewport",
		xml : xml,

		applyFilter : ko.observable(true),

		onRender : onRender,
		onResize : onResize,

		texture : new THREE.Texture(),

		resize : function(){
			var img = viewport.texture.image;
			var ratio = img.height/img.width;

			if( viewport.mainComponent && 
				viewport.mainComponent.parent ){
				
				var main = viewport.mainComponent;
				var maxWidth = main.parent.width();
				var maxHeight = main.parent.height();
				// resize
				if( ratio < 1){
					main.$el.css({
						"margin-top" : (maxHeight - maxWidth*ratio)/2+"px",
						"margin-left" : "0px"
					} );
					main.height( maxWidth*ratio );
					main.width( maxWidth );
				}else{
					main.$el.css({
						"margin-left" : (maxWidth - maxHeight/ratio)/2,
						"margin-top" : "0px"
					});
					main.width( maxHeight/ratio );
					main.height( maxHeight );
				}
			}
		},

		setImage : function(img){
			var self = this;
			if( typeof(img) === "string"){
				var image = new Image();
				image.onload = function(){
					self.texture.needsUpdate = true;
					self.resize();
				}
				image.src = img;
				this.texture.image = image;
			}else{
				this.texture.image = img;
				if( img.width ){
					self.texture.needsUpdate = true;
					self.resize();
				}else{
					img.onload = function(){
						self.texture.needsUpdate = true;
						self.resize();
					}
				}
			}
		}
	})
	
	viewport.on("start", function(){
		viewport.setImage('../file_upload/thumb/1.jpg');
		var img = new Image;
		img.onload = function(){
			viewport.setImage( img );
		}
		img.src = '../file_upload/1.jpg';
	})

	var renderInterval = 0,
		histogramInterval = 0,
		renderer;

	var manager = layers.manager;
	manager.texture = viewport.texture;

	ko.computed(function(){
		manager.enable( viewport.applyFilter() );
		viewport.applyFilter( manager.enable() );
	})

	function onRender(){
		renderer = this.renderer;
		if( renderInterval ){
			clearInterval(renderInterval);
		}
		if( histogramInterval ){
			clearInterval( histogramInterval);
		}
		renderInterval = setInterval(render, 100);
	}
	function onResize(){
		renderer && renderer.setSize(this.width(), this.height());
	}

	function render(){
		viewport.trigger("beforerender");
		manager.render( renderer );
		histogram.update( renderer.domElement );
	}

	return viewport;
})