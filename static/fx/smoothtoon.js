define({
	name : "Toon",
	description : "",
	preview : "",

	passes : [{

		name : "Horizontal",
		shader : "gaussian_h.essl",

		uniforms : {
			blurSize : {
				name : "Horizontal Blur Size",
				ui : "range",
				type : 'f',
				precision : 1,
				max : 2,
				min : 0,
				value : 0.2
			}
		}
	}, {
		name : "Vertical",
		shader : "gaussian_v.essl",

		uniforms : {
			blurSize : {
				name : "Vertical Blur Size",
				ui : "range",
				type : 'f',
				precision :1,
				max : 2,
				min : 0,
				value : 0.2
			}
		}
	}, {
		name : "Main",
		shader : "toon.essl",

		uniforms : {
			threshold : {
				name : "Threshold",
				type : "f",
				ui : "range",
				precision : 2,
				min : 0,
				max : 2,
				value : 0.2,
			}, 
			quantizationLevels : {
				name : "Quantization Levels",
				type : "f",
				ui : "spinner",
				precision : 0,
				min : 2,
				value : 10,
			}
		}
	}]
})