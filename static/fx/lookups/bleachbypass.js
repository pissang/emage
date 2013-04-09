define({
	name : "Bleach Bypass",
	preview : "",

	passes : [{
		name : "Main",
		shader : "imagelookup.essl",

		uniforms : {
			lookup : {
				type : "t",
				value : "texture(lookups/images/bleachbypass.png)"
			}
		}
	}]
})