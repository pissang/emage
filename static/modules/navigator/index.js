define(function(require){

	var qpf = require("qpf"),
		ko = qpf.use("knockout"),
		Module = require("../module"),
		xml = require("text!./navigator.xml"),
		NavLink = require("./navlink"),

		List = require("../common/list"),
		ImageItem = require("./imageitem"),

		viewport = require("../viewport/index"),
		router = require("../router");

	var nav = new Module({
		name : "navigator",
		xml : xml,

		images : ko.observableArray(),
		ImageItem : ImageItem
	});
	
	$.get("../file_upload/list.json", function(data){
		_.each( data, function(item){
			item.image = item.url;
			item.title = item.name;
			delete item.url;
			delete item.name;
		})
		nav.images( data );
	})

	nav.$el.delegate(".qpf-image img", "click", function(){
		viewport.texture.generateMipmaps = true;
		viewport.texture.image = this;
		viewport.texture.needsUpdate = true;
	})

	nav.$el.delegate(".qpf-ui-navlink", "click", function(){
		var $this= $(this),
			navlink = $this.qpf("get");
		if( navlink ){
			switch(navlink.icon()){
				case "camera":
					switchToCamera();
					break;
				case "cloud":
					switchToCloud();
			}
		}
		nav.$el.find(".qpf-ui-navlink").removeClass("active");
		$this.addClass("active");
	})
	function switchToCloud(){
		$(".image-list").show();
	}
	function switchToCamera(){
		$(".image-list").hide();
		var tex = viewport.texture;

		var video = document.createElement('video');
		tex.minFilter = THREE.LinearFilter;
		tex.magFilter = THREE.LinearFilter;
		tex.image = video;
		tex.generateMipmaps = false;
		viewport.on("beforerender", function(){
			tex.needsUpdate = true;
		})
		var videoObj = {
			video : true
		}
		// use camera
		if(navigator.getUserMedia) { // Standard
			navigator.getUserMedia(videoObj, function(stream) {
				video.src = stream;
				video.play();
			}, errBack);
		} else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
			navigator.webkitGetUserMedia(videoObj, function(stream){
				video.src = window.webkitURL.createObjectURL(stream);
				video.play();
			}, errBack);
		}; 
		function errBack(){
			console.log(arguments);
		}
	}

	return nav;
})