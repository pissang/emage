/**
 * boot the web app
 */
(function(){	
	//=========================
	// CONFIG
	//=========================

	this["LIB_PATH"] 	= "lib/";

	$LAB.setGlobalDefaults({BasePath:LIB_PATH});
	//=========================
	// Load Library
	//=========================
	$LAB.script("lib.js")
		.wait(boot);

	//========================
	// Load Main Module
	//========================
	function boot(){

		config();
		
		// ZipClipboard
		ZeroClipboard.setMoviePath("resource/ZeroClipboard.swf");

		require(["app"], function(app){
			app.start();
		})
	}


	function config(){

		requirejs.config({
			paths : {
				async	: "lib/async",
				qpf		: "lib/qpf",
				qtek 	: "lib/qtek",
				// fx resource
				fxs : "fx",
				shaders : "shaders"
			},
			shim : {
				"app" : [// 公用的组件
						"modules/common/toggle",
						"modules/common/list", 
						"modules/common/iconbutton", 
						"modules/common/modal", 
						"modules/common/region"]
			}
		})
	}

}).call( this )