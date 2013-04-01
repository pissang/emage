define({

	name : "Exposure",
	description : "曝光度",
	preview : "",

	passes : [{
		name : "Main",
		shader : "exposure.essl",

		uniforms : {
			exposure : {
				name : "Exposure",
				type : "f",
				ui : "range",
				min : -10,
				max : 10,
				precision : 1,
				value : 0
			}
		}
	}]
})