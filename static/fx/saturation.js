define({

	name : "Saturation",
	description : "饱和度",
	preview : "",

	passes : [{
		name : "Main",
		shader : "saturation.essl",

		uniforms : {
			saturation : {
				name : "Saturation",
				type : "f",
				ui : "range",
				min : 0,
				max : 2,
				precision : 2,
				value : 1
			}
		}
	}]
})