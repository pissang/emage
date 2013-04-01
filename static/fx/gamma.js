define({

	name : "Gamma",
	description : "Gamma",
	preview : "",

	passes : [{
		name : "Main",
		shader : "gamma.essl",

		uniforms : {
			gamma : {
				name : "Gamma",
				type : "f",
				ui : "range",
				min : 0,
				max : 3,
				precision : 2,
				value : 1
			}
		}
	}]
})