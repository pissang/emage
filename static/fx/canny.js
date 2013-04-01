define({

	//meta
	name : "Canny Edge Detection",
	description : "",
	preview : "",

	//passes
	passes : [{
		name : "Gray Scale",
		shader : "grayscale.essl",
		uniforms : {}
	}, {

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
		name : "Sobel",
		shader : "sobel.essl",

		uniforms : {}
	}, {
		name : "Image Directional None Maximum Suppression",
		shader : "_imagedirectionalnonmaximumsuppression.essl",

		uniforms : {
			upperThreshold : {
				name : "Upper Threshold",
				ui : "range",
				type : 'f',
				precision :2,
				max : 1,
				min : 0,
				value : 0.4
			},
			lowerThreshold : {
				name : "Lower Threshold",
				ui : "range",
				type : 'f',
				precision :2,
				max : 1,
				min : 0,
				value : 0.1
			}
		}
	}]
})