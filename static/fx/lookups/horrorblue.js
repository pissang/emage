define({
	name : "Horror Blue",
	preview : "",

	passes : [{
		name : "Main",
		shader : "imagelookup.essl",

		uniforms : {
			lookup : {
				type : "t",
				value : "texture(lookups/images/horrorblue.png)"
			}
		}
	}]
})