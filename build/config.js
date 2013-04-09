({
	appDir : '../static',
	baseUrl : "./",
	dir : "../static-dist",
	paths : {
		async	: "lib/async",
		qpf		: "lib/qpf",
		qtek 	: "lib/qtek"
	},
	shim : {
		"app" : [
				"modules/common/toggle",
				"modules/common/list.js", 
				"modules/common/iconbutton", 
				"modules/common/modal", 
				"modules/common/region"]
	},
	modules : [{
		name : "app"
	}]
})