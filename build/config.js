({
	appDir : '../static',
	baseUrl : "./",
	dir : "../static-dist",
	paths : {
		async	: "lib/async",
		qpf		: "lib/qpf"
	},
	shim : {
		"app" : ["modules/common/list.js", 
				"modules/common/iconbutton", 
				"modules/common/modal", 
				"modules/common/region"]
	},
	modules : [{
		name : "app"
	}]
})