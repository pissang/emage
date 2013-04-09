define(function(require){

	var qpf = require("qpf"),
		ko = qpf.use("knockout"),
		Module = require("../module"),
		xml = require("text!./navigator.xml"),
		NavLink = require("./navlink"),

		viewport = require("../viewport/index"),
		router = require("../router");

	var nav = new Module({
		name : "navigator",
		xml : xml
	});
	

	nav.$el.delegate(".qpf-ui-navlink", "click", function(){
		var $this= $(this),
			navlink = $this.qpf("get")[0];
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
	var video;
	
	function switchToCamera(){
		var tex = viewport.texture;

		video = document.createElement('video');
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