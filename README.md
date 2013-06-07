EMAGE
==========

EMAGE is a webgl based image processing library, it is based on the webgl library [qtek](https://github.com/pissang/qtek).

The [example](http://pissang.github.com/emage/example/#/) 

####Simple Usage####

Import the library
	
	<script type="https://github.com/pissang/emage/blob/master/dist/emage.min.js"></script>

Or in the AMD environment
	
	var emage =	require("emage")

-----
Process the image


	// Create a image processor
	var processor = new emage.Processor(canvas);
	
	// Create a layer
	var blurLayer = new emage.Layer();	
	
	// Use gaussian blur
	blurLayer.use("buildin.gaussian");
	
	// Create an other layer for color adjustment
	var colorLayer = new emage.Layer("buildin.coloradjust");
	
	// Add layers to processor and update the image
	processor.add(blurLayer);
	processor.add(colorLayer);
	processor.update();
	
	// Replace the gaussian blur with lens blur and update again
	blurLayer.use("buildin.lensblur");
	processor.update();
	
	// Set parameters of filter
	blurLayer.set("brightness", 6.0);
	blurLayer.set("blurSize", 4.0);
	
	// Or you can also write like this
	blurLayer.set({
		brightness : 6.0,
		blurSize : 4.0
	})
	
	// Export the final image
	var canvas = emage.canvas;
	var img = new Image;
	img.src = canvas.toDataURL();
	

####Supported filters####

Most of the filters is from [GPUImage](https://github.com/BradLarson/GPUImage)

#####Gaussian Blur#####

**buildin.gaussian**

+ blurSize : 2.0


#####Lens Blur#####

**buildin.lensblur**

+ blurSize : 0.4
+ brightness : 6.0

#####Color Adjust#####

**buildin.coloradjust**

+ brightness : 0.0
+ gamma : 1.0
+ contrast : 1.0
+ exposure : 0.0
+ saturation : 1.0

#####Color Matrix#####

**buildin.colormatrix**

+ colorMatrix : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
+ intensity : 1.0

#####Sepia#####

**buildin.sepia**

#####Color Lookup#####

**buildin.lut**

+ lookup : Image

#####Sobel Edge Detection#####

**buildin.sobel**

#####Toon Effect#####

**buildin.toon**

#####Sketch Effect#####

**buildin.sketch**


####Histogram compute####

Histogram compute is done in shaders and is quite effecient
	
	// Pass in the image you want to compute histogram
	var histogram = new emage.Histogram(image);
	
	// Set down sample rate
	histogram.downSample = 1/4;
	
	// Compute the histogram and get the result
	histogram.update();	
	// It will return a UnitArray(256) which store the histogram of red channel
	var redChannel = histogram.channels.red;
	// And other channels
	var blueChannel = histogram.channels.blue;
	var luminanceChannel = histogram.channels.luminance;