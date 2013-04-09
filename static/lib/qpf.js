 (function(factory){
 	// AMD
 	if( typeof define !== "undefined" && define["amd"] ){
 		define(["exports"], factory);
 	// No module loader
 	}else{
 		factory( window["qpf"] = {} );
 	}

})(function(_exports){

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("build/almond", function(){});

//===================================================
// Xml Parser
// parse wml and convert it to dom with knockout data-binding
// TODO	xml valid checking, 
//		provide xml childNodes Handler in the Components
//===================================================
define('core/xmlparser',['require','exports','module'],function(require, exports, module){
	
	// return document fragment converted from the xml
	var parse = function( xmlString, dom ){
		
		if( typeof(xmlString) == "string"){
			var xml = parseXML( xmlString );
		}else{
			var xml = xmlString;
		}
		if( xml ){

			var rootDomNode = dom || document.createElement("div");

			convert( xml, rootDomNode);

			return rootDomNode;
		}
	}

	function parseXML( xmlString ){
		var xml, parser;
		try{
			if( window.DOMParser ){
				xml = (new DOMParser()).parseFromString( xmlString, "text/xml");
			}else{
				xml = new ActiveXObject("Microsoft.XMLDOM");
				xml.async = "false";
				xml.loadXML( xmlString );
			}
			return xml;
		}catch(e){
			console.error("Invalid XML:" + xmlString);
		}
	}

	var customParsers = {};
	// provided custom parser from Compositor
	// parser need to return a plain object which key is attributeName
	// and value is attributeValue
	function provideParser(componentType /*tagName*/, parser){
		customParsers[componentType] = parser;
	}

	function parseXMLNode(xmlNode){
		if( xmlNode.nodeType === 1){
			
			var bindingResults = {
				type : xmlNode.tagName.toLowerCase()
			} 

			var convertedAttr = convertAttributes( xmlNode.attributes );
			var customParser = customParsers[bindingResults.type];
			if( customParser ){
				var result = customParser(xmlNode);
				if( result &&
					typeof(result) !="object"){
					console.error("Parser must return an object converted from attributes")
				}else{
					// data in the attributes has higher priority than
					// the data from the children
					_.extend(convertedAttr, result);
				}
			}

			var bindingString = objectToDataBindingFormat( convertedAttr, bindingResults );

			var domNode = document.createElement('div');
			domNode.setAttribute('data-bind',  "qpf:"+bindingString);

			return domNode;
		}else if( xmlNode.nodeType === 8){// comment node, offer for virtual binding in knockout
			// return xmlNode;
			return;
		}else{
			return;
		}
	}

	function convertAttributes(attributes){
		var ret = {};
		for(var i = 0; i < attributes.length; i++){
			var attr = attributes[i];
			ret[attr.nodeName] = attr.nodeValue;
		}
		return ret;
	}

	function objectToDataBindingFormat(attributes, bindingResults){

		bindingResults = bindingResults || {};

		var preProcess = function(attributes, bindingResults){

			_.each(attributes, function(value, name){
				// recursive
				if( value.constructor == Array){
					bindingResults[name] = [];
					preProcess(value, bindingResults[name]);
				}else if( value.constructor == Object){
					bindingResults[name] = {};
					preProcess(value, bindingResults[name]);
				}else if( typeof(value) !== "undefined" ){
					// this value is an expression or observable
					// in the viewModel if it has @binding[] flag
					var isBinding = /^\s*@binding\[(.*?)\]\s*$/.exec(value);
					if( isBinding ){
						// add a tag to remove quotation the afterwards
						// conveniently, or knockout will treat it as a 
						// normal string, not expression
						value = "{{BINDINGSTART" + isBinding[1] + "BINDINGEND}}";

					}
					bindingResults[name] = value
				}
			});
		}
		preProcess( attributes, bindingResults );

		var bindingString = JSON.stringify(bindingResults);
		
		bindingString = bindingString.replace(/\"\{\{BINDINGSTART(.*?)BINDINGEND\}\}\"/g, "$1");

		return bindingString;
	}

	function convert(root, parent){

		var children = getChildren(root);

		for(var i = 0; i < children.length; i++){
			var node = parseXMLNode( children[i] );
			if( node ){
				parent.appendChild(node);
				convert( children[i], node);
			}
		}
	}

	function getChildren(parent){
		
		var children = [];
		var node = parent.firstChild;
		while(node){
			children.push(node);
			node = node.nextSibling;
		}
		return children;
	}

	function getChildrenByTagName(parent, tagName){
		var children = getChildren(parent);
		
		return _.filter(children, function(child){
			return child.tagName && child.tagName.toLowerCase() === tagName;
		})
	}


	exports.parse = parse;
	//---------------------------------
	// some util functions provided for the components
	exports.provideParser = provideParser;

	function getTextContent(xmlNode){
		var children = getChildren(xmlNode);
		var text = '';
		_.each(children, function(child){
			if(child.nodeType==3){
				text += child.textContent.replace(/(^\s*)|(\s*$)/g, "");
			}
		})
		return text;
	}

	exports.util = {
		convertAttributes : convertAttributes,
		objectToDataBindingFormat : objectToDataBindingFormat,
		getChildren : getChildren,
		getChildrenByTagName : getChildrenByTagName,
		getTextContent : getTextContent
	}
});
define('core/mixin/derive',[],function(){

/**
 * derive a sub class from base class
 * @makeDefaultOpt [Object|Function] default option of this sub class, 
 						method of the sub can use this.xxx to access this option
 * @initialize [Function](optional) initialize after the sub class is instantiated
 * @proto [Object](optional) prototype methods/property of the sub class
 *
 */
function derive(makeDefaultOpt, initialize/*optional*/, proto/*optional*/){

	if( typeof initialize == "object"){
		proto = initialize;
		initialize = null;
	}

	// extend default prototype method
	var extendedProto = {
		// instanceof operator cannot work well,
		// so we write a method to simulate it
		'instanceof' : function(constructor){
			var selfConstructor = sub;
			while(selfConstructor){
				if( selfConstructor === constructor ){
					return true;
				}
				selfConstructor = selfConstructor.__super__;
			}
		}
	}

	var _super = this;

	var sub = function(options){

		// call super constructor
		_super.call( this );

		// call defaultOpt generate function each time
		// if it is a function, So we can make sure each 
		// property in the object is fresh
		_.extend( this, typeof makeDefaultOpt == "function" ?
						makeDefaultOpt.call(this) : makeDefaultOpt );

		_.extend( this, options );

		if( this.constructor == sub){
			// find the base class, and the initialize function will be called 
			// in the order of inherit
			var base = sub,
				initializeChain = [initialize];
			while(base.__super__){
				base = base.__super__;
				initializeChain.unshift( base.__initialize__ );
			}
			for(var i = 0; i < initializeChain.length; i++){
				if( initializeChain[i] ){
					initializeChain[i].call( this );
				}
			}
		}
	};
	// save super constructor
	sub.__super__ = _super;
	// initialize function will be called after all the super constructor is called
	sub.__initialize__ = initialize;

	// extend prototype function
	_.extend( sub.prototype, _super.prototype, extendedProto, proto);

	sub.prototype.constructor = sub;
	
	// extend the derive method as a static method;
	sub.derive = _super.derive;


	return sub;
}

return {
	derive : derive
}

});
define('core/mixin/event',[],function(){

/**
 * Event interface
 * + on(eventName, handler[, context])
 * + trigger(eventName[, arg1[, arg2]])
 * + off(eventName[, handler])
 */
return{
	trigger : function(){
		if( ! this.__handlers__){
			return;
		}
		var name = arguments[0];
		var params = Array.prototype.slice.call( arguments, 1 );

		var handlers = this.__handlers__[ name ];
		if( handlers ){
			for( var i = 0; i < handlers.length; i+=2){
				var handler = handlers[i],
					context = handlers[i+1];
				handler.apply(context || this, params);
			}
		}
	},
	
	on : function( target, handler, context/*optional*/ ){

		if( ! target){
			return;
		}
		var handlers = this.__handlers__ || ( this.__handlers__={} );
		if( ! handlers[target] ){
			handlers[target] = [];
		}
		if( handlers[target].indexOf(handler) == -1){
			// structure in list
			// [handler,context,handler,context,handler,context..]
			handlers[target].push( handler );
			handlers[target].push( context );
		}

		return handler;
	},

	off : function( target, handler ){
		
		var handlers = this.__handlers__ || ( this.__handlers__={} );

		if( handlers[target] ){
			if( handler ){
				var arr = handlers[target];
				// remove handler and context
				var idx = arr.indexOf(handler);
				if( idx >= 0)
					arr.splice( idx, 2 );
			}else{
				handlers[target] = [];
			}
		}

	}
}
});
define('core/clazz',['require','./mixin/derive','./mixin/event'],function(require){

	var deriveMixin = require("./mixin/derive"),
		eventMixin = require("./mixin/event")

	var Clazz = new Function();
	_.extend(Clazz, deriveMixin);
	_.extend(Clazz.prototype, eventMixin);

	return Clazz;
});
// Knockout JavaScript library v2.2.1
// (c) Steven Sanderson - http://knockoutjs.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function(){
var DEBUG=true;
(function(window,document,navigator,jQuery,undefined){
!function(factory) {
    // Support three module loading scenarios
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [1] CommonJS/Node.js
        var target = module['exports'] || exports; // module.exports is for Node.js
        factory(target);
    } else if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        define('knockout',['exports'], factory);
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports){
// Internally, all KO objects are attached to koExports (even the non-exported ones whose names will be minified by the closure compiler).
// In the future, the following "ko" variable may be made distinct from "koExports" so that private objects are not externally reachable.
var ko = typeof koExports !== 'undefined' ? koExports : {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
ko.exportSymbol = function(koPath, object) {
    var tokens = koPath.split(".");

    // In the future, "ko" may become distinct from "koExports" (so that non-exported objects are not reachable)
    // At that point, "target" would be set to: (typeof koExports !== "undefined" ? koExports : ko)
    var target = ko;

    for (var i = 0; i < tokens.length - 1; i++)
        target = target[tokens[i]];
    target[tokens[tokens.length - 1]] = object;
};
ko.exportProperty = function(owner, publicName, object) {
  owner[publicName] = object;
};
ko.version = "2.2.1";

ko.exportSymbol('version', ko.version);
ko.utils = new (function () {
    var stringTrimRegex = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;

    // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = /Firefox\/2/i.test(navigator.userAgent) ? 'KeyboardEvent' : 'UIEvents';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    for (var eventType in knownEvents) {
        var knownEventsForType = knownEvents[eventType];
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    }
    var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true }; // Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406

    // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
    // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
    // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
    // If there is a future need to detect specific versions of IE10+, we will amend this.
    var ieVersion = (function() {
        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        );
        return version > 4 ? version : undefined;
    }());
    var isIe6 = ieVersion === 6,
        isIe7 = ieVersion === 7;

    function isClickOnCheckableElement(element, eventType) {
        if ((ko.utils.tagNameLower(element) !== "input") || !element.type) return false;
        if (eventType.toLowerCase() != "click") return false;
        var inputType = element.type;
        return (inputType == "checkbox") || (inputType == "radio");
    }

    return {
        fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],

        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i]);
        },

        arrayIndexOf: function (array, item) {
            if (typeof Array.prototype.indexOf == "function")
                return Array.prototype.indexOf.call(array, item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] === item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i]))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index >= 0)
                array.splice(index, 1);
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i]));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i]))
                    result.push(array[i]);
            return result;
        },

        arrayPushAll: function (array, valuesToPush) {
            if (valuesToPush instanceof Array)
                array.push.apply(array, valuesToPush);
            else
                for (var i = 0, j = valuesToPush.length; i < j; i++)
                    array.push(valuesToPush[i]);
            return array;
        },

        extend: function (target, source) {
            if (source) {
                for(var prop in source) {
                    if(source.hasOwnProperty(prop)) {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        },

        emptyDomNode: function (domNode) {
            while (domNode.firstChild) {
                ko.removeNode(domNode.firstChild);
            }
        },

        moveCleanedNodesToContainerElement: function(nodes) {
            // Ensure it's a real array, as we're about to reparent the nodes and
            // we don't want the underlying collection to change while we're doing that.
            var nodesArray = ko.utils.makeArray(nodes);

            var container = document.createElement('div');
            for (var i = 0, j = nodesArray.length; i < j; i++) {
                container.appendChild(ko.cleanNode(nodesArray[i]));
            }
            return container;
        },

        cloneNodes: function (nodesArray, shouldCleanNodes) {
            for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
                var clonedNode = nodesArray[i].cloneNode(true);
                newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
            }
            return newNodesArray;
        },

        setDomNodeChildren: function (domNode, childNodes) {
            ko.utils.emptyDomNode(domNode);
            if (childNodes) {
                for (var i = 0, j = childNodes.length; i < j; i++)
                    domNode.appendChild(childNodes[i]);
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.removeNode(nodesToReplaceArray[i]);
                }
            }
        },

        setOptionNodeSelectionState: function (optionNode, isSelected) {
            // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
            if (ieVersion < 7)
                optionNode.setAttribute("selected", isSelected);
            else
                optionNode.selected = isSelected;
        },

        stringTrim: function (string) {
            return (string || "").replace(stringTrimRegex, "");
        },

        stringTokenize: function (string, delimiter) {
            var result = [];
            var tokens = (string || "").split(delimiter);
            for (var i = 0, j = tokens.length; i < j; i++) {
                var trimmed = ko.utils.stringTrim(tokens[i]);
                if (trimmed !== "")
                    result.push(trimmed);
            }
            return result;
        },

        stringStartsWith: function (string, startsWith) {
            string = string || "";
            if (startsWith.length > string.length)
                return false;
            return string.substring(0, startsWith.length) === startsWith;
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node != null) {
                if (node == containedByNode)
                    return true;
                node = node.parentNode;
            }
            return false;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, node.ownerDocument);
        },

        tagNameLower: function(element) {
            // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
            // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
            // we don't need to do the .toLowerCase() as it will always be lower case anyway.
            return element && element.tagName && element.tagName.toLowerCase();
        },

        registerEventHandler: function (element, eventType, handler) {
            var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
            if (!mustUseAttachEvent && typeof jQuery != "undefined") {
                if (isClickOnCheckableElement(element, eventType)) {
                    // For click events on checkboxes, jQuery interferes with the event handling in an awkward way:
                    // it toggles the element checked state *after* the click event handlers run, whereas native
                    // click events toggle the checked state *before* the event handler.
                    // Fix this by intecepting the handler and applying the correct checkedness before it runs.
                    var originalHandler = handler;
                    handler = function(event, eventData) {
                        var jQuerySuppliedCheckedState = this.checked;
                        if (eventData)
                            this.checked = eventData.checkedStateBeforeEvent !== true;
                        originalHandler.call(this, event);
                        this.checked = jQuerySuppliedCheckedState; // Restore the state jQuery applied
                    };
                }
                jQuery(element)['bind'](eventType, handler);
            } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                element.addEventListener(eventType, handler, false);
            else if (typeof element.attachEvent != "undefined")
                element.attachEvent("on" + eventType, function (event) {
                    handler.call(element, event);
                });
            else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            if (typeof jQuery != "undefined") {
                var eventData = [];
                if (isClickOnCheckableElement(element, eventType)) {
                    // Work around the jQuery "click events on checkboxes" issue described above by storing the original checked state before triggering the handler
                    eventData.push({ checkedStateBeforeEvent: element.checked });
                }
                jQuery(element)['trigger'](eventType, eventData);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (typeof element.fireEvent != "undefined") {
                // Unlike other browsers, IE doesn't change the checked state of checkboxes/radiobuttons when you trigger their "click" event
                // so to make it consistent, we'll do it manually here
                if (isClickOnCheckableElement(element, eventType))
                    element.checked = element.checked !== true;
                element.fireEvent("on" + eventType);
            }
            else
                throw new Error("Browser doesn't support triggering events");
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        peekObservable: function (value) {
            return ko.isObservable(value) ? value.peek() : value;
        },

        toggleDomNodeCssClass: function (node, classNames, shouldHaveClass) {
            if (classNames) {
                var cssClassNameRegex = /[\w-]+/g,
                    currentClassNames = node.className.match(cssClassNameRegex) || [];
                ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                    var indexOfClass = ko.utils.arrayIndexOf(currentClassNames, className);
                    if (indexOfClass >= 0) {
                        if (!shouldHaveClass)
                            currentClassNames.splice(indexOfClass, 1);
                    } else {
                        if (shouldHaveClass)
                            currentClassNames.push(className);
                    }
                });
                node.className = currentClassNames.join(" ");
            }
        },

        setTextContent: function(element, textContent) {
            var value = ko.utils.unwrapObservable(textContent);
            if ((value === null) || (value === undefined))
                value = "";

            if (element.nodeType === 3) {
                element.data = value;
            } else {
                // We need there to be exactly one child: a text node.
                // If there are no children, more than one, or if it's not a text node,
                // we'll clear everything and create a single text node.
                var innerTextNode = ko.virtualElements.firstChild(element);
                if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
                    ko.virtualElements.setDomNodeChildren(element, [document.createTextNode(value)]);
                } else {
                    innerTextNode.data = value;
                }

                ko.utils.forceRefresh(element);
            }
        },

        setElementName: function(element, name) {
            element.name = name;

            // Workaround IE 6/7 issue
            // - https://github.com/SteveSanderson/knockout/issues/197
            // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (ieVersion <= 7) {
                try {
                    element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
                }
                catch(e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
            }
        },

        forceRefresh: function(node) {
            // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
            if (ieVersion >= 9) {
                // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
                var elem = node.nodeType == 1 ? node : node.parentNode;
                if (elem.style)
                    elem.style.zoom = elem.style.zoom;
            }
        },

        ensureSelectElementIsRenderedCorrectly: function(selectElement) {
            // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
            // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
            if (ieVersion >= 9) {
                var originalWidth = selectElement.style.width;
                selectElement.style.width = 0;
                selectElement.style.width = originalWidth;
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },

        makeArray: function(arrayLikeObject) {
            var result = [];
            for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                result.push(arrayLikeObject[i]);
            };
            return result;
        },

        isIe6 : isIe6,
        isIe7 : isIe7,
        ieVersion : ieVersion,

        getFormFields: function(form, fieldName) {
            var fields = ko.utils.makeArray(form.getElementsByTagName("input")).concat(ko.utils.makeArray(form.getElementsByTagName("textarea")));
            var isMatchingField = (typeof fieldName == 'string')
                ? function(field) { return field.name === fieldName }
                : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
            var matches = [];
            for (var i = fields.length - 1; i >= 0; i--) {
                if (isMatchingField(fields[i]))
                    matches.push(fields[i]);
            };
            return matches;
        },

        parseJson: function (jsonString) {
            if (typeof jsonString == "string") {
                jsonString = ko.utils.stringTrim(jsonString);
                if (jsonString) {
                    if (window.JSON && window.JSON.parse) // Use native parsing where available
                        return window.JSON.parse(jsonString);
                    return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                }
            }
            return null;
        },

        stringifyJson: function (data, replacer, space) {   // replacer and space are optional
            if ((typeof JSON == "undefined") || (typeof JSON.stringify == "undefined"))
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data), replacer, space);
        },

        postJson: function (urlOrForm, data, options) {
            options = options || {};
            var params = options['params'] || {};
            var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
            var url = urlOrForm;

            // If we were given a form, use its 'action' URL and pick out any requested field values
            if((typeof urlOrForm == 'object') && (ko.utils.tagNameLower(urlOrForm) === "form")) {
                var originalForm = urlOrForm;
                url = originalForm.action;
                for (var i = includeFields.length - 1; i >= 0; i--) {
                    var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                    for (var j = fields.length - 1; j >= 0; j--)
                        params[fields[j].name] = fields[j].value;
                }
            }

            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("form");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                var input = document.createElement("input");
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            for (var key in params) {
                var input = document.createElement("input");
                input.name = key;
                input.value = params[key];
                form.appendChild(input);
            }
            document.body.appendChild(form);
            options['submitter'] ? options['submitter'](form) : form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
        }
    }
})();

ko.exportSymbol('utils', ko.utils);
ko.exportSymbol('utils.arrayForEach', ko.utils.arrayForEach);
ko.exportSymbol('utils.arrayFirst', ko.utils.arrayFirst);
ko.exportSymbol('utils.arrayFilter', ko.utils.arrayFilter);
ko.exportSymbol('utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
ko.exportSymbol('utils.arrayIndexOf', ko.utils.arrayIndexOf);
ko.exportSymbol('utils.arrayMap', ko.utils.arrayMap);
ko.exportSymbol('utils.arrayPushAll', ko.utils.arrayPushAll);
ko.exportSymbol('utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
ko.exportSymbol('utils.extend', ko.utils.extend);
ko.exportSymbol('utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
ko.exportSymbol('utils.getFormFields', ko.utils.getFormFields);
ko.exportSymbol('utils.peekObservable', ko.utils.peekObservable);
ko.exportSymbol('utils.postJson', ko.utils.postJson);
ko.exportSymbol('utils.parseJson', ko.utils.parseJson);
ko.exportSymbol('utils.registerEventHandler', ko.utils.registerEventHandler);
ko.exportSymbol('utils.stringifyJson', ko.utils.stringifyJson);
ko.exportSymbol('utils.range', ko.utils.range);
ko.exportSymbol('utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
ko.exportSymbol('utils.triggerEvent', ko.utils.triggerEvent);
ko.exportSymbol('utils.unwrapObservable', ko.utils.unwrapObservable);

if (!Function.prototype['bind']) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype['bind'] = function (object) {
        var originalFunction = this, args = Array.prototype.slice.call(arguments), object = args.shift();
        return function () {
            return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
        };
    };
}

ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};
    return {
        get: function (node, key) {
            var allDataForNode = ko.utils.domData.getAll(node, false);
            return allDataForNode === undefined ? undefined : allDataForNode[key];
        },
        set: function (node, key, value) {
            if (value === undefined) {
                // Make sure we don't actually create a new domData key if we are actually deleting a value
                if (ko.utils.domData.getAll(node, false) === undefined)
                    return;
            }
            var allDataForNode = ko.utils.domData.getAll(node, true);
            allDataForNode[key] = value;
        },
        getAll: function (node, createIfNotFound) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
            if (!hasExistingDataStore) {
                if (!createIfNotFound)
                    return undefined;
                dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
                dataStore[dataStoreKey] = {};
            }
            return dataStore[dataStoreKey];
        },
        clear: function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
                return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
            }
            return false;
        }
    }
})();

ko.exportSymbol('utils.domData', ko.utils.domData);
ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully

ko.utils.domNodeDisposal = new (function () {
    var domDataKey = "__ko_domNodeDisposal__" + (new Date).getTime();
    var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
    var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document

    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    function destroyCallbacksCollection(node) {
        ko.utils.domData.set(node, domDataKey, undefined);
    }

    function cleanSingleNode(node) {
        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }

        // Also erase the DOM data
        ko.utils.domData.clear(node);

        // Special support for jQuery here because it's so commonly used.
        // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
        // so notify it to tear down any resources associated with the node & descendants here.
        if ((typeof jQuery == "function") && (typeof jQuery['cleanData'] == "function"))
            jQuery['cleanData']([node]);

        // Also clear any immediate-child comment nodes, as these wouldn't have been found by
        // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
        if (cleanableNodeTypesWithDescendants[node.nodeType])
            cleanImmediateCommentTypeChildren(node);
    }

    function cleanImmediateCommentTypeChildren(nodeWithChildren) {
        var child, nextChild = nodeWithChildren.firstChild;
        while (child = nextChild) {
            nextChild = child.nextSibling;
            if (child.nodeType === 8)
                cleanSingleNode(child);
        }
    }

    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },

        removeDisposeCallback : function(node, callback) {
            var callbacksCollection = getDisposeCallbacksCollection(node, false);
            if (callbacksCollection) {
                ko.utils.arrayRemoveItem(callbacksCollection, callback);
                if (callbacksCollection.length == 0)
                    destroyCallbacksCollection(node);
            }
        },

        cleanNode : function(node) {
            // First clean this node, where applicable
            if (cleanableNodeTypes[node.nodeType]) {
                cleanSingleNode(node);

                // ... then its descendants, where applicable
                if (cleanableNodeTypesWithDescendants[node.nodeType]) {
                    // Clone the descendants list in case it changes during iteration
                    var descendants = [];
                    ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
                    for (var i = 0, j = descendants.length; i < j; i++)
                        cleanSingleNode(descendants[i]);
                }
            }
            return node;
        },

        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        }
    }
})();
ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
ko.exportSymbol('cleanNode', ko.cleanNode);
ko.exportSymbol('removeNode', ko.removeNode);
ko.exportSymbol('utils.domNodeDisposal', ko.utils.domNodeDisposal);
ko.exportSymbol('utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
ko.exportSymbol('utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
(function () {
    var leadingCommentRegex = /^(\s*)<!--(.*?)-->/;

    function simpleHtmlParse(html) {
        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

        // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
        // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
        // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
        // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = document.createElement("div");

        // Finds the first match from the left column, and returns the corresponding "wrap" data from the right column
        var wrap = tags.match(/^<(thead|tbody|tfoot)/)              && [1, "<table>", "</table>"] ||
                   !tags.indexOf("<tr")                             && [2, "<table><tbody>", "</tbody></table>"] ||
                   (!tags.indexOf("<td") || !tags.indexOf("<th"))   && [3, "<table><tbody><tr>", "</tr></tbody></table>"] ||
                   /* anything else */                                 [0, "", ""];

        // Go to html and back, then peel off extra wrappers
        // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
        var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
        if (typeof window['innerShiv'] == "function") {
            div.appendChild(window['innerShiv'](markup));
        } else {
            div.innerHTML = markup;
        }

        // Move to the right depth
        while (wrap[0]--)
            div = div.lastChild;

        return ko.utils.makeArray(div.lastChild.childNodes);
    }

    function jQueryHtmlParse(html) {
        // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
        if (jQuery['parseHTML']) {
            return jQuery['parseHTML'](html);
        } else {
            // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
            var elems = jQuery['clean']([html]);

            // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
            // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
            // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
            if (elems && elems[0]) {
                // Find the top-most parent element that's a direct child of a document fragment
                var elem = elems[0];
                while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                    elem = elem.parentNode;
                // ... then detach it
                if (elem.parentNode)
                    elem.parentNode.removeChild(elem);
            }

            return elems;
        }
    }

    ko.utils.parseHtmlFragment = function(html) {
        return typeof jQuery != 'undefined' ? jQueryHtmlParse(html)   // As below, benefit from jQuery's optimisations where possible
                                            : simpleHtmlParse(html);  // ... otherwise, this simple logic will do in most common cases.
    };

    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);

        // There's no legitimate reason to display a stringified observable without unwrapping it, so we'll unwrap it
        html = ko.utils.unwrapObservable(html);

        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();

            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (typeof jQuery != 'undefined') {
                jQuery(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }
        }
    };
})();

ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
ko.exportSymbol('utils.setHtml', ko.utils.setHtml);

ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                var combinedParams = [node];
                if (extraCallbackParamsArray)
                    ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);
                ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                if (node.parentNode)
                    node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();

ko.exportSymbol('memoization', ko.memoization);
ko.exportSymbol('memoization.memoize', ko.memoization.memoize);
ko.exportSymbol('memoization.unmemoize', ko.memoization.unmemoize);
ko.exportSymbol('memoization.parseMemoText', ko.memoization.parseMemoText);
ko.exportSymbol('memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);
ko.extenders = {
    'throttle': function(target, timeout) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
        target['throttleEvaluation'] = timeout;

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
        var writeTimeoutInstance = null;
        return ko.dependentObservable({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always"
            ? function() { return false } // Treat all values as not equal
            : ko.observable["fn"]["equalityComparer"];
        return target;
    }
};

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        for (var key in requestedExtenders) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, requestedExtenders[key]);
            }
        }
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);

ko.subscription = function (target, callback, disposeCallback) {
    this.target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    this._subscriptions = {};

    ko.utils.extend(this, ko.subscribable['fn']);
    ko.exportProperty(this, 'subscribe', this.subscribe);
    ko.exportProperty(this, 'extend', this.extend);
    ko.exportProperty(this, 'getSubscriptionsCount', this.getSubscriptionsCount);
}

var defaultEvent = "change";

ko.subscribable['fn'] = {
    subscribe: function (callback, callbackTarget, event) {
        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(this, boundCallback, function () {
            ko.utils.arrayRemoveItem(this._subscriptions[event], subscription);
        }.bind(this));

        if (!this._subscriptions[event])
            this._subscriptions[event] = [];
        this._subscriptions[event].push(subscription);
        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event) {
        event = event || defaultEvent;
        if (this._subscriptions[event]) {
            ko.dependencyDetection.ignore(function() {
                ko.utils.arrayForEach(this._subscriptions[event].slice(0), function (subscription) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (subscription && (subscription.isDisposed !== true))
                        subscription.callback(valueToNotify);
                });
            }, this);
        }
    },

    getSubscriptionsCount: function () {
        var total = 0;
        for (var eventName in this._subscriptions) {
            if (this._subscriptions.hasOwnProperty(eventName))
                total += this._subscriptions[eventName].length;
        }
        return total;
    },

    extend: applyExtenders
};


ko.isSubscribable = function (instance) {
    return typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);

ko.dependencyDetection = (function () {
    var _frames = [];

    return {
        begin: function (callback) {
            _frames.push({ callback: callback, distinctDependencies:[] });
        },

        end: function () {
            _frames.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw new Error("Only subscribable things can act as dependencies");
            if (_frames.length > 0) {
                var topFrame = _frames[_frames.length - 1];
                if (!topFrame || ko.utils.arrayIndexOf(topFrame.distinctDependencies, subscribable) >= 0)
                    return;
                topFrame.distinctDependencies.push(subscribable);
                topFrame.callback(subscribable);
            }
        },

        ignore: function(callback, callbackTarget, callbackArgs) {
            try {
                _frames.push(null);
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                _frames.pop();
            }
        }
    };
})();
var primitiveTypes = { 'undefined':true, 'boolean':true, 'number':true, 'string':true };

ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if ((!observable['equalityComparer']) || !observable['equalityComparer'](_latestValue, arguments[0])) {
                observable.valueWillMutate();
                _latestValue = arguments[0];
                if (DEBUG) observable._latestValue = _latestValue;
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return _latestValue;
        }
    }
    if (DEBUG) observable._latestValue = _latestValue;
    ko.subscribable.call(observable);
    observable.peek = function() { return _latestValue };
    observable.valueHasMutated = function () { observable["notifySubscribers"](_latestValue); }
    observable.valueWillMutate = function () { observable["notifySubscribers"](_latestValue, "beforeChange"); }
    ko.utils.extend(observable, ko.observable['fn']);

    ko.exportProperty(observable, 'peek', observable.peek);
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
    ko.exportProperty(observable, "valueWillMutate", observable.valueWillMutate);

    return observable;
}

ko.observable['fn'] = {
    "equalityComparer": function valuesArePrimitiveAndEqual(a, b) {
        var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
        return oldValueIsPrimitive ? (a === b) : false;
    }
};

var protoProperty = ko.observable.protoProperty = "__ko_proto__";
ko.observable['fn'][protoProperty] = ko.observable;

ko.hasPrototype = function(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return ko.hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
};

ko.isObservable = function (instance) {
    return ko.hasPrototype(instance, ko.observable);
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == "function") && instance[protoProperty] === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == "function") && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}


ko.exportSymbol('observable', ko.observable);
ko.exportSymbol('isObservable', ko.isObservable);
ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
ko.observableArray = function (initialValues) {
    if (arguments.length == 0) {
        // Zero-parameter constructor initializes to empty array
        initialValues = [];
    }
    if ((initialValues !== null) && (initialValues !== undefined) && !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = ko.observable(initialValues);
    ko.utils.extend(result, ko.observableArray['fn']);
    return result;
}

ko.observableArray['fn'] = {
    'remove': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    'removeAll': function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'destroy': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    'destroyAll': function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this['destroy'](function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this['destroy'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'indexOf': function (item) {
        var underlyingArray = this();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    },

    'replace': function(oldItem, newItem) {
        var index = this['indexOf'](oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
}

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        return methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

ko.exportSymbol('observableArray', ko.observableArray);
ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue,
        _hasBeenEvaluated = false,
        _isBeingEvaluated = false,
        readFunction = evaluatorFunctionOrOptions;

    if (readFunction && typeof readFunction == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = readFunction;
        readFunction = options["read"];
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (!readFunction)
            readFunction = options["read"];
    }
    if (typeof readFunction != "function")
        throw new Error("Pass a function that returns the value of the ko.computed");

    function addSubscriptionToDependency(subscribable) {
        _subscriptionsToDependencies.push(subscribable.subscribe(evaluatePossiblyAsync));
    }

    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
    }

    function evaluatePossiblyAsync() {
        var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(evaluationTimeoutInstance);
            evaluationTimeoutInstance = setTimeout(evaluateImmediate, throttleEvaluationTimeout);
        } else
            evaluateImmediate();
    }

    function evaluateImmediate() {
        if (_isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Don't dispose on first evaluation, because the "disposeWhen" callback might
        // e.g., dispose when the associated DOM element isn't in the doc, and it's not
        // going to be in the doc until *after* the first evaluation
        if (_hasBeenEvaluated && disposeWhen()) {
            dispose();
            return;
        }

        _isBeingEvaluated = true;
        try {
            // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
            // Then, during evaluation, we cross off any that are in fact still being used.
            var disposalCandidates = ko.utils.arrayMap(_subscriptionsToDependencies, function(item) {return item.target;});

            ko.dependencyDetection.begin(function(subscribable) {
                var inOld;
                if ((inOld = ko.utils.arrayIndexOf(disposalCandidates, subscribable)) >= 0)
                    disposalCandidates[inOld] = undefined; // Don't want to dispose this subscription, as it's still being used
                else
                    addSubscriptionToDependency(subscribable); // Brand new subscription - add it
            });

            var newValue = readFunction.call(evaluatorFunctionTarget);

            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
            for (var i = disposalCandidates.length - 1; i >= 0; i--) {
                if (disposalCandidates[i])
                    _subscriptionsToDependencies.splice(i, 1)[0].dispose();
            }
            _hasBeenEvaluated = true;

            dependentObservable["notifySubscribers"](_latestValue, "beforeChange");
            _latestValue = newValue;
            if (DEBUG) dependentObservable._latestValue = _latestValue;
        } finally {
            ko.dependencyDetection.end();
        }

        dependentObservable["notifySubscribers"](_latestValue);
        _isBeingEvaluated = false;
        if (!_subscriptionsToDependencies.length)
            dispose();
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof writeFunction === "function") {
                // Writing a value
                writeFunction.apply(evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            if (!_hasBeenEvaluated)
                evaluateImmediate();
            ko.dependencyDetection.registerDependency(dependentObservable);
            return _latestValue;
        }
    }

    function peek() {
        if (!_hasBeenEvaluated)
            evaluateImmediate();
        return _latestValue;
    }

    function isActive() {
        return !_hasBeenEvaluated || _subscriptionsToDependencies.length > 0;
    }

    // By here, "options" is always non-null
    var writeFunction = options["write"],
        disposeWhenNodeIsRemoved = options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhen = options["disposeWhen"] || options.disposeWhen || function() { return false; },
        dispose = disposeAllSubscriptionsToDependencies,
        _subscriptionsToDependencies = [],
        evaluationTimeoutInstance = null;

    if (!evaluatorFunctionTarget)
        evaluatorFunctionTarget = options["owner"];

    dependentObservable.peek = peek;
    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; };
    dependentObservable.hasWriteFunction = typeof options["write"] === "function";
    dependentObservable.dispose = function () { dispose(); };
    dependentObservable.isActive = isActive;

    ko.subscribable.call(dependentObservable);
    ko.utils.extend(dependentObservable, ko.dependentObservable['fn']);

    ko.exportProperty(dependentObservable, 'peek', dependentObservable.peek);
    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'isActive', dependentObservable.isActive);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);

    // Evaluate, unless deferEvaluation is true
    if (options['deferEvaluation'] !== true)
        evaluateImmediate();

    // Build "disposeWhenNodeIsRemoved" and "disposeWhenNodeIsRemovedCallback" option values.
    // But skip if isActive is false (there will never be any dependencies to dispose).
    // (Note: "disposeWhenNodeIsRemoved" option both proactively disposes as soon as the node is removed using ko.removeNode(),
    // plus adds a "disposeWhen" callback that, on each evaluation, disposes if the node was removed by some other means.)
    if (disposeWhenNodeIsRemoved && isActive()) {
        dispose = function() {
            ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, arguments.callee);
            disposeAllSubscriptionsToDependencies();
        };
        ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, dispose);
        var existingDisposeWhenFunction = disposeWhen;
        disposeWhen = function () {
            return !ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved) || existingDisposeWhenFunction();
        }
    }

    return dependentObservable;
};

ko.isComputed = function(instance) {
    return ko.hasPrototype(instance, ko.dependentObservable);
};

var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.dependentObservable[protoProp] = ko.observable;

ko.dependentObservable['fn'] = {};
ko.dependentObservable['fn'][protoProp] = ko.dependentObservable;

ko.exportSymbol('dependentObservable', ko.dependentObservable);
ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
ko.exportSymbol('isComputed', ko.isComputed);

(function() {
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
    };

    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof Date));
        if (!canHaveProperties)
            return rootObject;

        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);

            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;
            }
        });

        return outputProperties;
    }

    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);

            // For arrays, also respect toJSON property for custom mappings (fixes #278)
            if (typeof rootObject['toJSON'] == 'function')
                visitorCallback('toJSON');
        } else {
            for (var propertyName in rootObject)
                visitorCallback(propertyName);
        }
    };

    function objectLookup() {
        var keys = [];
        var values = [];
        this.save = function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(keys, key);
            if (existingIndex >= 0)
                values[existingIndex] = value;
            else {
                keys.push(key);
                values.push(value);
            }
        };
        this.get = function(key) {
            var existingIndex = ko.utils.arrayIndexOf(keys, key);
            return (existingIndex >= 0) ? values[existingIndex] : undefined;
        };
    };
})();

ko.exportSymbol('toJS', ko.toJS);
ko.exportSymbol('toJSON', ko.toJSON);
(function () {
    var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    if (element[hasDomDataExpandoProperty] === true)
                        return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                    return ko.utils.ieVersion <= 7
                        ? (element.getAttributeNode('value').specified ? element.value : element.text)
                        : element.value;
                case 'select':
                    return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
                default:
                    return element.value;
            }
        },

        writeValue: function(element, value) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    switch(typeof value) {
                        case "string":
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                            if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                                delete element[hasDomDataExpandoProperty];
                            }
                            element.value = value;
                            break;
                        default:
                            // Store arbitrary object using DomData
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                            element[hasDomDataExpandoProperty] = true;

                            // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                            element.value = typeof value === "number" ? value : "";
                            break;
                    }
                    break;
                case 'select':
                    for (var i = element.options.length - 1; i >= 0; i--) {
                        if (ko.selectExtensions.readValue(element.options[i]) == value) {
                            element.selectedIndex = i;
                            break;
                        }
                    }
                    break;
                default:
                    if ((value === null) || (value === undefined))
                        value = "";
                    element.value = value;
                    break;
            }
        }
    };
})();

ko.exportSymbol('selectExtensions', ko.selectExtensions);
ko.exportSymbol('selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('selectExtensions.writeValue', ko.selectExtensions.writeValue);
ko.expressionRewriting = (function () {
    var restoreCapturedTokensRegex = /\@ko_token_(\d+)\@/g;
    var javaScriptReservedWords = ["true", "false"];

    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

    function restoreTokens(string, tokens) {
        var prevValue = null;
        while (string != prevValue) { // Keep restoring tokens until it no longer makes a difference (they may be nested)
            prevValue = string;
            string = string.replace(restoreCapturedTokensRegex, function (match, tokenIndex) {
                return tokens[tokenIndex];
            });
        }
        return string;
    }

    function getWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, ko.utils.stringTrim(expression).toLowerCase()) >= 0)
            return false;
        var match = expression.match(javaScriptAssignmentTarget);
        return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
    }

    function ensureQuoted(key) {
        var trimmedKey = ko.utils.stringTrim(key);
        switch (trimmedKey.length && trimmedKey.charAt(0)) {
            case "'":
            case '"':
                return key;
            default:
                return "'" + trimmedKey + "'";
        }
    }

    return {
        bindingRewriteValidators: [],

        parseObjectLiteral: function(objectLiteralString) {
            // A full tokeniser+lexer would add too much weight to this library, so here's a simple parser
            // that is sufficient just to split an object literal string into a set of top-level key-value pairs

            var str = ko.utils.stringTrim(objectLiteralString);
            if (str.length < 3)
                return [];
            if (str.charAt(0) === "{")// Ignore any braces surrounding the whole object literal
                str = str.substring(1, str.length - 1);

            // Pull out any string literals and regex literals
            var tokens = [];
            var tokenStart = null, tokenEndChar;
            for (var position = 0; position < str.length; position++) {
                var c = str.charAt(position);
                if (tokenStart === null) {
                    switch (c) {
                        case '"':
                        case "'":
                        case "/":
                            tokenStart = position;
                            tokenEndChar = c;
                            break;
                    }
                } else if ((c == tokenEndChar) && (str.charAt(position - 1) !== "\\")) {
                    var token = str.substring(tokenStart, position + 1);
                    tokens.push(token);
                    var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                    str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                    position -= (token.length - replacement.length);
                    tokenStart = null;
                }
            }

            // Next pull out balanced paren, brace, and bracket blocks
            tokenStart = null;
            tokenEndChar = null;
            var tokenDepth = 0, tokenStartChar = null;
            for (var position = 0; position < str.length; position++) {
                var c = str.charAt(position);
                if (tokenStart === null) {
                    switch (c) {
                        case "{": tokenStart = position; tokenStartChar = c;
                                  tokenEndChar = "}";
                                  break;
                        case "(": tokenStart = position; tokenStartChar = c;
                                  tokenEndChar = ")";
                                  break;
                        case "[": tokenStart = position; tokenStartChar = c;
                                  tokenEndChar = "]";
                                  break;
                    }
                }

                if (c === tokenStartChar)
                    tokenDepth++;
                else if (c === tokenEndChar) {
                    tokenDepth--;
                    if (tokenDepth === 0) {
                        var token = str.substring(tokenStart, position + 1);
                        tokens.push(token);
                        var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                        str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                        position -= (token.length - replacement.length);
                        tokenStart = null;
                    }
                }
            }

            // Now we can safely split on commas to get the key/value pairs
            var result = [];
            var keyValuePairs = str.split(",");
            for (var i = 0, j = keyValuePairs.length; i < j; i++) {
                var pair = keyValuePairs[i];
                var colonPos = pair.indexOf(":");
                if ((colonPos > 0) && (colonPos < pair.length - 1)) {
                    var key = pair.substring(0, colonPos);
                    var value = pair.substring(colonPos + 1);
                    result.push({ 'key': restoreTokens(key, tokens), 'value': restoreTokens(value, tokens) });
                } else {
                    result.push({ 'unknown': restoreTokens(pair, tokens) });
                }
            }
            return result;
        },

        preProcessBindings: function (objectLiteralStringOrKeyValueArray) {
            var keyValueArray = typeof objectLiteralStringOrKeyValueArray === "string"
                ? ko.expressionRewriting.parseObjectLiteral(objectLiteralStringOrKeyValueArray)
                : objectLiteralStringOrKeyValueArray;
            var resultStrings = [], propertyAccessorResultStrings = [];

            var keyValueEntry;
            for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
                if (resultStrings.length > 0)
                    resultStrings.push(",");

                if (keyValueEntry['key']) {
                    var quotedKey = ensureQuoted(keyValueEntry['key']), val = keyValueEntry['value'];
                    resultStrings.push(quotedKey);
                    resultStrings.push(":");
                    resultStrings.push(val);

                    if (val = getWriteableValue(ko.utils.stringTrim(val))) {
                        if (propertyAccessorResultStrings.length > 0)
                            propertyAccessorResultStrings.push(", ");
                        propertyAccessorResultStrings.push(quotedKey + " : function(__ko_value) { " + val + " = __ko_value; }");
                    }
                } else if (keyValueEntry['unknown']) {
                    resultStrings.push(keyValueEntry['unknown']);
                }
            }

            var combinedResult = resultStrings.join("");
            if (propertyAccessorResultStrings.length > 0) {
                var allPropertyAccessors = propertyAccessorResultStrings.join("");
                combinedResult = combinedResult + ", '_ko_property_writers' : { " + allPropertyAccessors + " } ";
            }

            return combinedResult;
        },

        keyValueArrayContainsKey: function(keyValueArray, key) {
            for (var i = 0; i < keyValueArray.length; i++)
                if (ko.utils.stringTrim(keyValueArray[i]['key']) == key)
                    return true;
            return false;
        },

        // Internal, private KO utility for updating model properties from within bindings
        // property:            If the property being updated is (or might be) an observable, pass it here
        //                      If it turns out to be a writable observable, it will be written to directly
        // allBindingsAccessor: All bindings in the current execution context.
        //                      This will be searched for a '_ko_property_writers' property in case you're writing to a non-observable
        // key:                 The key identifying the property to be written. Example: for { hasFocus: myValue }, write to 'myValue' by specifying the key 'hasFocus'
        // value:               The value to be written
        // checkIfDifferent:    If true, and if the property being written is a writable observable, the value will only be written if
        //                      it is !== existing value on that writable observable
        writeValueToProperty: function(property, allBindingsAccessor, key, value, checkIfDifferent) {
            if (!property || !ko.isWriteableObservable(property)) {
                var propWriters = allBindingsAccessor()['_ko_property_writers'];
                if (propWriters && propWriters[key])
                    propWriters[key](value);
            } else if (!checkIfDifferent || property.peek() !== value) {
                property(value);
            }
        }
    };
})();

ko.exportSymbol('expressionRewriting', ko.expressionRewriting);
ko.exportSymbol('expressionRewriting.bindingRewriteValidators', ko.expressionRewriting.bindingRewriteValidators);
ko.exportSymbol('expressionRewriting.parseObjectLiteral', ko.expressionRewriting.parseObjectLiteral);
ko.exportSymbol('expressionRewriting.preProcessBindings', ko.expressionRewriting.preProcessBindings);

// For backward compatibility, define the following aliases. (Previously, these function names were misleading because
// they referred to JSON specifically, even though they actually work with arbitrary JavaScript object literal expressions.)
ko.exportSymbol('jsonExpressionRewriting', ko.expressionRewriting);
ko.exportSymbol('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.expressionRewriting.preProcessBindings);(function() {
    // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
    // may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
    // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
    // of that virtual hierarchy
    //
    // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
    // without having to scatter special cases all over the binding and templating code.

    // IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
    // but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
    // So, use node.text where available, and node.nodeValue elsewhere
    var commentNodesHaveTextProperty = document.createComment("test").text === "<!--test-->";

    var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+(.+\s*\:[\s\S]*))?\s*-->$/ : /^\s*ko(?:\s+(.+\s*\:[\s\S]*))?\s*$/;
    var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
    var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

    function isStartComment(node) {
        return (node.nodeType == 8) && (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
    }

    function isEndComment(node) {
        return (node.nodeType == 8) && (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(endCommentRegex);
    }

    function getVirtualChildren(startComment, allowUnbalanced) {
        var currentNode = startComment;
        var depth = 1;
        var children = [];
        while (currentNode = currentNode.nextSibling) {
            if (isEndComment(currentNode)) {
                depth--;
                if (depth === 0)
                    return children;
            }

            children.push(currentNode);

            if (isStartComment(currentNode))
                depth++;
        }
        if (!allowUnbalanced)
            throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
        return null;
    }

    function getMatchingEndComment(startComment, allowUnbalanced) {
        var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
        if (allVirtualChildren) {
            if (allVirtualChildren.length > 0)
                return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
            return startComment.nextSibling;
        } else
            return null; // Must have no matching end comment, and allowUnbalanced is true
    }

    function getUnbalancedChildTags(node) {
        // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
        //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
        var childNode = node.firstChild, captureRemaining = null;
        if (childNode) {
            do {
                if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                    captureRemaining.push(childNode);
                else if (isStartComment(childNode)) {
                    var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                    if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                        childNode = matchingEndComment;
                    else
                        captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
                } else if (isEndComment(childNode)) {
                    captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
                }
            } while (childNode = childNode.nextSibling);
        }
        return captureRemaining;
    }

    ko.virtualElements = {
        allowedBindings: {},

        childNodes: function(node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        },

        emptyNode: function(node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = ko.virtualElements.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        },

        setDomNodeChildren: function(node, childNodes) {
            if (!isStartComment(node))
                ko.utils.setDomNodeChildren(node, childNodes);
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        },

        prepend: function(containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        },

        insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            } else if (!isStartComment(containerNode)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        },

        firstChild: function(node) {
            if (!isStartComment(node))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        nextSibling: function(node) {
            if (isStartComment(node))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        virtualNodeBindingValue: function(node) {
            var regexMatch = isStartComment(node);
            return regexMatch ? regexMatch[1] : null;
        },

        normaliseVirtualElementDomStructure: function(elementVerified) {
            // Workaround for https://github.com/SteveSanderson/knockout/issues/155
            // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
            // that are direct descendants of <ul> into the preceding <li>)
            if (!htmlTagsWithOptionallyClosingChildren[ko.utils.tagNameLower(elementVerified)])
                return;

            // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
            // must be intended to appear *after* that child, so move them there.
            var childNode = elementVerified.firstChild;
            if (childNode) {
                do {
                    if (childNode.nodeType === 1) {
                        var unbalancedTags = getUnbalancedChildTags(childNode);
                        if (unbalancedTags) {
                            // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                            var nodeToInsertBefore = childNode.nextSibling;
                            for (var i = 0; i < unbalancedTags.length; i++) {
                                if (nodeToInsertBefore)
                                    elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                                else
                                    elementVerified.appendChild(unbalancedTags[i]);
                            }
                        }
                    }
                } while (childNode = childNode.nextSibling);
            }
        }
    };
})();
ko.exportSymbol('virtualElements', ko.virtualElements);
ko.exportSymbol('virtualElements.allowedBindings', ko.virtualElements.allowedBindings);
ko.exportSymbol('virtualElements.emptyNode', ko.virtualElements.emptyNode);
//ko.exportSymbol('virtualElements.firstChild', ko.virtualElements.firstChild);     // firstChild is not minified
ko.exportSymbol('virtualElements.insertAfter', ko.virtualElements.insertAfter);
//ko.exportSymbol('virtualElements.nextSibling', ko.virtualElements.nextSibling);   // nextSibling is not minified
ko.exportSymbol('virtualElements.prepend', ko.virtualElements.prepend);
ko.exportSymbol('virtualElements.setDomNodeChildren', ko.virtualElements.setDomNodeChildren);
(function() {
    var defaultBindingAttributeName = "data-bind";

    ko.bindingProvider = function() {
        this.bindingCache = {};
    };

    ko.utils.extend(ko.bindingProvider.prototype, {
        'nodeHasBindings': function(node) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName) != null;   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node) != null; // Comment node
                default: return false;
            }
        },

        'getBindings': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext);
            return bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node) : null;
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'getBindingsString': function(node, bindingContext) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                default: return null;
            }
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'parseBindingsString': function(bindingsString, bindingContext, node) {
            try {
                var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache);
                return bindingFunction(bindingContext, node);
            } catch (ex) {
                throw new Error("Unable to parse bindings.\nMessage: " + ex + ";\nBindings value: " + bindingsString);
            }
        }
    });

    ko.bindingProvider['instance'] = new ko.bindingProvider();

    function createBindingsStringEvaluatorViaCache(bindingsString, cache) {
        var cacheKey = bindingsString;
        return cache[cacheKey]
            || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString));
    }

    function createBindingsStringEvaluator(bindingsString) {
        // Build the source for a function that evaluates "expression"
        // For each scope variable, add an extra level of "with" nesting
        // Example result: with(sc1) { with(sc0) { return (expression) } }
        var rewrittenBindings = ko.expressionRewriting.preProcessBindings(bindingsString),
            functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
        return new Function("$context", "$element", functionBody);
    }
})();

ko.exportSymbol('bindingProvider', ko.bindingProvider);
(function () {
    ko.bindingHandlers = {};

    ko.bindingContext = function(dataItem, parentBindingContext, dataItemAlias) {
        if (parentBindingContext) {
            ko.utils.extend(this, parentBindingContext); // Inherit $root and any custom properties
            this['$parentContext'] = parentBindingContext;
            this['$parent'] = parentBindingContext['$data'];
            this['$parents'] = (parentBindingContext['$parents'] || []).slice(0);
            this['$parents'].unshift(this['$parent']);
        } else {
            this['$parents'] = [];
            this['$root'] = dataItem;
            // Export 'ko' in the binding context so it will be available in bindings and templates
            // even if 'ko' isn't exported as a global, such as when using an AMD loader.
            // See https://github.com/SteveSanderson/knockout/issues/490
            this['ko'] = ko;
        }
        this['$data'] = dataItem;
        if (dataItemAlias)
            this[dataItemAlias] = dataItem;
    }
    ko.bindingContext.prototype['createChildContext'] = function (dataItem, dataItemAlias) {
        return new ko.bindingContext(dataItem, this, dataItemAlias);
    };
    ko.bindingContext.prototype['extend'] = function(properties) {
        var clone = ko.utils.extend(new ko.bindingContext(), this);
        return ko.utils.extend(clone, properties);
    };

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal (viewModel, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
        var currentChild, nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
        while (currentChild = nextInQueue) {
            // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
            nextInQueue = ko.virtualElements.nextSibling(currentChild);
            applyBindingsToNodeAndDescendantsInternal(viewModel, currentChild, bindingContextsMayDifferFromDomParentElement);
        }
    }

    function applyBindingsToNodeAndDescendantsInternal (viewModel, nodeVerified, bindingContextMayDifferFromDomParentElement) {
        var shouldBindDescendants = true;

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                               || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, viewModel, bindingContextMayDifferFromDomParentElement).shouldBindDescendants;

        if (shouldBindDescendants) {
            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
            //    hence bindingContextsMayDifferFromDomParentElement is false
            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
            //    hence bindingContextsMayDifferFromDomParentElement is true
            applyBindingsToDescendantsInternal(viewModel, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
        }
    }

    function applyBindingsToNodeInternal (node, bindings, viewModelOrBindingContext, bindingContextMayDifferFromDomParentElement) {
        // Need to be sure that inits are only run once, and updates never run until all the inits have been run
        var initPhase = 0; // 0 = before all inits, 1 = during inits, 2 = after all inits

        // Each time the dependentObservable is evaluated (after data changes),
        // the binding attribute is reparsed so that it can pick out the correct
        // model properties in the context of the changed data.
        // DOM event callbacks need to be able to access this changed data,
        // so we need a single parsedBindings variable (shared by all callbacks
        // associated with this node's bindings) that all the closures can access.
        var parsedBindings;
        function makeValueAccessor(bindingKey) {
            return function () { return parsedBindings[bindingKey] }
        }
        function parsedBindingsAccessor() {
            return parsedBindings;
        }

        var bindingHandlerThatControlsDescendantBindings;
        ko.dependentObservable(
            function () {
                // Ensure we have a nonnull binding context to work with
                var bindingContextInstance = viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
                    ? viewModelOrBindingContext
                    : new ko.bindingContext(ko.utils.unwrapObservable(viewModelOrBindingContext));
                var viewModel = bindingContextInstance['$data'];

                // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
                // we can easily recover it just by scanning up the node's ancestors in the DOM
                // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
                if (bindingContextMayDifferFromDomParentElement)
                    ko.storedBindingContextForNode(node, bindingContextInstance);

                // Use evaluatedBindings if given, otherwise fall back on asking the bindings provider to give us some bindings
                var evaluatedBindings = (typeof bindings == "function") ? bindings(bindingContextInstance, node) : bindings;
                parsedBindings = evaluatedBindings || ko.bindingProvider['instance']['getBindings'](node, bindingContextInstance);
                
                if (parsedBindings) {
                    // First run all the inits, so bindings can register for notification on changes
                    if (initPhase === 0) {
                        initPhase = 1;
                        for (var bindingKey in parsedBindings) {
                            var binding = ko.bindingHandlers[bindingKey];
                            if (binding && node.nodeType === 8)
                                validateThatBindingIsAllowedForVirtualElements(bindingKey);

                            if (binding && typeof binding["init"] == "function") {
                                var handlerInitFn = binding["init"];
                                var initResult = handlerInitFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, bindingContextInstance);

                                // If this binding handler claims to control descendant bindings, make a note of this
                                if (initResult && initResult['controlsDescendantBindings']) {
                                    if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                        throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                    bindingHandlerThatControlsDescendantBindings = bindingKey;
                                }
                            }
                        }
                        initPhase = 2;
                    }

                    // ... then run all the updates, which might trigger changes even on the first evaluation
                    if (initPhase === 2) {
                        for (var bindingKey in parsedBindings) {
                            var binding = ko.bindingHandlers[bindingKey];
                            if (binding && typeof binding["update"] == "function") {
                                var handlerUpdateFn = binding["update"];
                                handlerUpdateFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, bindingContextInstance);
                            }
                        }
                    }
                }
            },
            null,
            { disposeWhenNodeIsRemoved : node }
        );

        return {
            shouldBindDescendants: bindingHandlerThatControlsDescendantBindings === undefined
        };
    };

    var storedBindingContextDomDataKey = "__ko_bindingContext__";
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2)
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
        else
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
    }

    ko.applyBindingsToNode = function (node, bindings, viewModel) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, viewModel, true);
    };

    ko.applyBindingsToDescendants = function(viewModel, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(viewModel, rootNode, true);
    };

    ko.applyBindings = function (viewModel, rootNode) {
        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        applyBindingsToNodeAndDescendantsInternal(viewModel, rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        switch (node.nodeType) {
            case 1:
            case 8:
                var context = ko.storedBindingContextForNode(node);
                if (context) return context;
                if (node.parentNode) return ko.contextFor(node.parentNode);
                break;
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
var attrHtmlToJavascriptMap = { 'class': 'className', 'for': 'htmlFor' };
ko.bindingHandlers['attr'] = {
    'update': function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        for (var attrName in value) {
            if (typeof attrName == "string") {
                var attrValue = ko.utils.unwrapObservable(value[attrName]);

                // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
                // when someProp is a "no value"-like value (strictly null, false, or undefined)
                // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
                var toRemove = (attrValue === false) || (attrValue === null) || (attrValue === undefined);
                if (toRemove)
                    element.removeAttribute(attrName);

                // In IE <= 7 and IE8 Quirks Mode, you have to use the Javascript property name instead of the
                // HTML attribute name for certain attributes. IE8 Standards Mode supports the correct behavior,
                // but instead of figuring out the mode, we'll just set the attribute through the Javascript
                // property for IE <= 8.
                if (ko.utils.ieVersion <= 8 && attrName in attrHtmlToJavascriptMap) {
                    attrName = attrHtmlToJavascriptMap[attrName];
                    if (toRemove)
                        element.removeAttribute(attrName);
                    else
                        element[attrName] = attrValue;
                } else if (!toRemove) {
                    element.setAttribute(attrName, attrValue.toString());
                }

                // Treat "name" specially - although you can think of it as an attribute, it also needs
                // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
                // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
                // entirely, and there's no strong reason to allow for such casing in HTML.
                if (attrName === "name") {
                    ko.utils.setElementName(element, toRemove ? "" : attrValue.toString());
                }
            }
        }
    }
};
ko.bindingHandlers['checked'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        var updateHandler = function() {
            var valueToWrite;
            if (element.type == "checkbox") {
                valueToWrite = element.checked;
            } else if ((element.type == "radio") && (element.checked)) {
                valueToWrite = element.value;
            } else {
                return; // "checked" binding only responds to checkboxes and selected radio buttons
            }

            var modelValue = valueAccessor(), unwrappedValue = ko.utils.unwrapObservable(modelValue);
            if ((element.type == "checkbox") && (unwrappedValue instanceof Array)) {
                // For checkboxes bound to an array, we add/remove the checkbox value to that array
                // This works for both observable and non-observable arrays
                var existingEntryIndex = ko.utils.arrayIndexOf(unwrappedValue, element.value);
                if (element.checked && (existingEntryIndex < 0))
                    modelValue.push(element.value);
                else if ((!element.checked) && (existingEntryIndex >= 0))
                    modelValue.splice(existingEntryIndex, 1);
            } else {
                ko.expressionRewriting.writeValueToProperty(modelValue, allBindingsAccessor, 'checked', valueToWrite, true);
            }
        };
        ko.utils.registerEventHandler(element, "click", updateHandler);

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if ((element.type == "radio") && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });
    },
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        if (element.type == "checkbox") {
            if (value instanceof Array) {
                // When bound to an array, the checkbox being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(value, element.value) >= 0;
            } else {
                // When bound to anything other value (not an array), the checkbox being checked represents the value being trueish
                element.checked = value;
            }
        } else if (element.type == "radio") {
            element.checked = (element.value == value);
        }
    }
};
var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (typeof value == "object") {
            for (var className in value) {
                var shouldHaveClass = ko.utils.unwrapObservable(value[className]);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            }
        } else {
            value = String(value || ''); // Make sure we don't try to store or set a non-string value
            ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
            element[classesWrittenByBindingKey] = value;
            ko.utils.toggleDomNodeCssClass(element, value, true);
        }
    }
};
ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers['disable'] = {
    'update': function (element, valueAccessor) {
        ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
    }
};
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
function makeEventHandlerShortcut(eventName) {
    ko.bindingHandlers[eventName] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var newValueAccessor = function () {
                var result = {};
                result[eventName] = valueAccessor();
                return result;
            };
            return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindingsAccessor, viewModel);
        }
    }
}

ko.bindingHandlers['event'] = {
    'init' : function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var eventsToHandle = valueAccessor() || {};
        for(var eventNameOutsideClosure in eventsToHandle) {
            (function() {
                var eventName = eventNameOutsideClosure; // Separate variable to be captured by event handler closure
                if (typeof eventName == "string") {
                    ko.utils.registerEventHandler(element, eventName, function (event) {
                        var handlerReturnValue;
                        var handlerFunction = valueAccessor()[eventName];
                        if (!handlerFunction)
                            return;
                        var allBindings = allBindingsAccessor();

                        try {
                            // Take all the event args, and prefix with the viewmodel
                            var argsForHandler = ko.utils.makeArray(arguments);
                            argsForHandler.unshift(viewModel);
                            handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
                        } finally {
                            if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                                if (event.preventDefault)
                                    event.preventDefault();
                                else
                                    event.returnValue = false;
                            }
                        }

                        var bubble = allBindings[eventName + 'Bubble'] !== false;
                        if (!bubble) {
                            event.cancelBubble = true;
                            if (event.stopPropagation)
                                event.stopPropagation();
                        }
                    });
                }
            })();
        }
    }
};
// "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
// "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
ko.bindingHandlers['foreach'] = {
    makeTemplateValueAccessor: function(valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here

            // If unwrappedValue is the array, pass in the wrapped value on its own
            // The value will be unwrapped and tracked within the template binding
            // (See https://github.com/SteveSanderson/knockout/issues/523)
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

            // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
            ko.utils.unwrapObservable(modelValue);
            return {
                'foreach': unwrappedValue['data'],
                'as': unwrappedValue['as'],
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'],
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor));
    },
    'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor), allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings
ko.virtualElements.allowedBindings['foreach'] = true;
var hasfocusUpdatingProperty = '__ko_hasfocusUpdating';
ko.bindingHandlers['hasfocus'] = {
    'init': function(element, valueAccessor, allBindingsAccessor) {
        var handleElementFocusChange = function(isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            element[hasfocusUpdatingProperty] = true;
            var ownerDoc = element.ownerDocument;
            if ("activeElement" in ownerDoc) {
                isFocused = (ownerDoc.activeElement === element);
            }
            var modelValue = valueAccessor();
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindingsAccessor, 'hasfocus', isFocused, true);
            element[hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
        ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
        ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    'update': function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (!element[hasfocusUpdatingProperty]) {
            value ? element.focus() : element.blur();
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]); // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
        }
    }
};
ko.bindingHandlers['html'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
    }
};
var withIfDomDataKey = '__ko_withIfBindingData';
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.utils.domData.set(element, withIfDomDataKey, {});
            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var withIfData = ko.utils.domData.get(element, withIfDomDataKey),
                dataValue = ko.utils.unwrapObservable(valueAccessor()),
                shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                isFirstRender = !withIfData.savedNodes,
                needsRefresh = isFirstRender || isWith || (shouldDisplay !== withIfData.didDisplayOnLastUpdate);

            if (needsRefresh) {
                if (isFirstRender) {
                    withIfData.savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(withIfData.savedNodes));
                    }
                    ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                } else {
                    ko.virtualElements.emptyNode(element);
                }

                withIfData.didDisplayOnLastUpdate = shouldDisplay;
            }
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */,
    function(bindingContext, dataValue) {
        return bindingContext['createChildContext'](dataValue);
    }
);
function ensureDropdownSelectionIsConsistentWithModelValue(element, modelValue, preferModelValue) {
    if (preferModelValue) {
        if (modelValue !== ko.selectExtensions.readValue(element))
            ko.selectExtensions.writeValue(element, modelValue);
    }

    // No matter which direction we're syncing in, we want the end result to be equality between dropdown value and model value.
    // If they aren't equal, either we prefer the dropdown value, or the model value couldn't be represented, so either way,
    // change the model value to match the dropdown.
    if (modelValue !== ko.selectExtensions.readValue(element))
        ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
};

ko.bindingHandlers['options'] = {
    'update': function (element, valueAccessor, allBindingsAccessor) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw new Error("options binding applies only to SELECT elements");

        var selectWasPreviouslyEmpty = element.length == 0;
        var previousSelectedValues = ko.utils.arrayMap(ko.utils.arrayFilter(element.childNodes, function (node) {
            return node.tagName && (ko.utils.tagNameLower(node) === "option") && node.selected;
        }), function (node) {
            return ko.selectExtensions.readValue(node) || node.innerText || node.textContent;
        });
        var previousScrollTop = element.scrollTop;

        var value = ko.utils.unwrapObservable(valueAccessor());
        var selectedValue = element.value;

        // Remove all existing <option>s.
        // Need to use .remove() rather than .removeChild() for <option>s otherwise IE behaves oddly (https://github.com/SteveSanderson/knockout/issues/134)
        while (element.length > 0) {
            ko.cleanNode(element.options[0]);
            element.remove(0);
        }

        if (value) {
            var allBindings = allBindingsAccessor(),
                includeDestroyed = allBindings['optionsIncludeDestroyed'];

            if (typeof value.length != "number")
                value = [value];
            if (allBindings['optionsCaption']) {
                var option = document.createElement("option");
                ko.utils.setHtml(option, allBindings['optionsCaption']);
                ko.selectExtensions.writeValue(option, undefined);
                element.appendChild(option);
            }

            for (var i = 0, j = value.length; i < j; i++) {
                // Skip destroyed items
                var arrayEntry = value[i];
                if (arrayEntry && arrayEntry['_destroy'] && !includeDestroyed)
                    continue;

                var option = document.createElement("option");

                function applyToObject(object, predicate, defaultValue) {
                    var predicateType = typeof predicate;
                    if (predicateType == "function")    // Given a function; run it against the data value
                        return predicate(object);
                    else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                        return object[predicate];
                    else                                // Given no optionsText arg; use the data value itself
                        return defaultValue;
                }

                // Apply a value to the option element
                var optionValue = applyToObject(arrayEntry, allBindings['optionsValue'], arrayEntry);
                ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                // Apply some text to the option element
                var optionText = applyToObject(arrayEntry, allBindings['optionsText'], optionValue);
                ko.utils.setTextContent(option, optionText);

                element.appendChild(option);
            }

            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            var newOptions = element.getElementsByTagName("option");
            var countSelectionsRetained = 0;
            for (var i = 0, j = newOptions.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[i])) >= 0) {
                    ko.utils.setOptionNodeSelectionState(newOptions[i], true);
                    countSelectionsRetained++;
                }
            }

            element.scrollTop = previousScrollTop;

            if (selectWasPreviouslyEmpty && ('value' in allBindings)) {
                // Ensure consistency between model value and selected option.
                // If the dropdown is being populated for the first time here (or was otherwise previously empty),
                // the dropdown selection state is meaningless, so we preserve the model value.
                ensureDropdownSelectionIsConsistentWithModelValue(element, ko.utils.peekObservable(allBindings['value']), /* preferModelValue */ true);
            }

            // Workaround for IE9 bug
            ko.utils.ensureSelectElementIsRenderedCorrectly(element);
        }
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = '__ko.optionValueDomData__';
ko.bindingHandlers['selectedOptions'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindingsAccessor, 'value', valueToWrite);
        });
    },
    'update': function (element, valueAccessor) {
        if (ko.utils.tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor());
        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                ko.utils.setOptionNodeSelectionState(node, isSelected);
            });
        }
    }
};
ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        for (var styleName in value) {
            if (typeof styleName == "string") {
                var styleValue = ko.utils.unwrapObservable(value[styleName]);
                element.style[styleName] = styleValue || ""; // Empty string removes the value, whereas null/undefined have no effect
            }
        }
    }
};
ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel) {
        if (typeof valueAccessor() != "function")
            throw new Error("The value for a submit binding must be a function");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var value = valueAccessor();
            try { handlerReturnValue = value.call(viewModel, element); }
            finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }
        });
    }
};
ko.bindingHandlers['text'] = {
    'update': function (element, valueAccessor) {
        ko.utils.setTextContent(element, valueAccessor());
    }
};
ko.virtualElements.allowedBindings['text'] = true;
ko.bindingHandlers['uniqueName'] = {
    'init': function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);
            ko.utils.setElementName(element, name);
        }
    }
};
ko.bindingHandlers['uniqueName'].currentIndex = 0;
ko.bindingHandlers['value'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        // Always catch "change" event; possibly other events too if asked
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindingsAccessor()["valueUpdate"];
        var propertyChangedFired = false;
        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }

        var valueUpdateHandler = function() {
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindingsAccessor, 'value', elementValue);
        }

        // Workaround for https://github.com/SteveSanderson/knockout/issues/122
        // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
        var ieAutoCompleteHackNeeded = ko.utils.ieVersion && element.tagName.toLowerCase() == "input" && element.type == "text"
                                       && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
        if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
            ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
            ko.utils.registerEventHandler(element, "blur", function() {
                if (propertyChangedFired) {
                    valueUpdateHandler();
                }
            });
        }

        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handler = valueUpdateHandler;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handler = function() { setTimeout(valueUpdateHandler, 0) };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });
    },
    'update': function (element, valueAccessor) {
        var valueIsSelectOption = ko.utils.tagNameLower(element) === "select";
        var newValue = ko.utils.unwrapObservable(valueAccessor());
        var elementValue = ko.selectExtensions.readValue(element);
        var valueHasChanged = (newValue != elementValue);

        // JavaScript's 0 == "" behavious is unfortunate here as it prevents writing 0 to an empty text box (loose equality suggests the values are the same).
        // We don't want to do a strict equality comparison as that is more confusing for developers in certain cases, so we specifically special case 0 != "" here.
        if ((newValue === 0) && (elementValue !== 0) && (elementValue !== "0"))
            valueHasChanged = true;

        if (valueHasChanged) {
            var applyValueAction = function () { ko.selectExtensions.writeValue(element, newValue); };
            applyValueAction();

            // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
            // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
            // to apply the value as well.
            var alsoApplyAsynchronously = valueIsSelectOption;
            if (alsoApplyAsynchronously)
                setTimeout(applyValueAction, 0);
        }

        // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
        // because you're not allowed to have a model value that disagrees with a visible UI selection.
        if (valueIsSelectOption && (element.length > 0))
            ensureDropdownSelectionIsConsistentWithModelValue(element, newValue, /* preferModelValue */ false);
    }
};
ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};
// 'click' is just a shorthand for the usual full-length event:{click:handler}
makeEventHandlerShortcut('click');
// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    throw new Error("Override renderTemplateSource");
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw new Error("Override createJavaScriptEvaluatorBlock");
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template, templateDocument) {
    // Named template
    if (typeof template == "string") {
        templateDocument = templateDocument || document;
        var elem = templateDocument.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    return this['renderTemplateSource'](templateSource, bindingContext, options);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template, templateDocument) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    return this['makeTemplateSource'](template, templateDocument)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
};

ko.exportSymbol('templateEngine', ko.templateEngine);

ko.templateRewriting = (function () {
    var memoizeDataBindingAttributeSyntaxRegex = /(<[a-z]+\d*(\s+(?!data-bind=)[a-z0-9\-]+(=(\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind=(["'])([\s\S]*?)\5/gi;
    var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

    function validateDataBindValuesForRewriting(keyValueArray) {
        var allValidators = ko.expressionRewriting.bindingRewriteValidators;
        for (var i = 0; i < keyValueArray.length; i++) {
            var key = keyValueArray[i]['key'];
            if (allValidators.hasOwnProperty(key)) {
                var validator = allValidators[key];

                if (typeof validator === "function") {
                    var possibleErrorMessage = validator(keyValueArray[i]['value']);
                    if (possibleErrorMessage)
                        throw new Error(possibleErrorMessage);
                } else if (!validator) {
                    throw new Error("This template engine does not support the '" + key + "' binding within its templates");
                }
            }
        }
    }

    function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, templateEngine) {
        var dataBindKeyValueArray = ko.expressionRewriting.parseObjectLiteral(dataBindAttributeValue);
        validateDataBindValuesForRewriting(dataBindKeyValueArray);
        var rewrittenDataBindAttributeValue = ko.expressionRewriting.preProcessBindings(dataBindKeyValueArray);

        // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
        // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
        // extra indirection.
        var applyBindingsToNextSiblingScript =
            "ko.__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()})";
        return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
    }

    return {
        ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
            if (!templateEngine['isTemplateRewritten'](template, templateDocument))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                }, templateDocument);
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[6], /* tagToRetain: */ arguments[1], templateEngine);
            }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", templateEngine);
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings) {
            return ko.memoization.memoize(function (domNode, bindingContext) {
                if (domNode.nextSibling)
                    ko.applyBindingsToNode(domNode.nextSibling, bindings, bindingContext);
            });
        }
    }
})();


// Exported only because it has to be referenced by string lookup from within rewritten template
ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
(function() {
    // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
    // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
    //
    // Two are provided by default:
    //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
    //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
    //                                           without reading/writing the actual element text content, since it will be overwritten
    //                                           with the rendered template output.
    // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
    // Template sources need to have the following functions:
    //   text()             - returns the template text from your storage location
    //   text(value)        - writes the supplied template text to your storage location
    //   data(key)          - reads values stored using data(key, value) - see below
    //   data(key, value)   - associates "value" with this template and the key "key". Is used to store information like "isRewritten".
    //
    // Optionally, template sources can also have the following functions:
    //   nodes()            - returns a DOM element containing the nodes of this template, where available
    //   nodes(value)       - writes the given DOM element to your storage location
    // If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
    // for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
    //
    // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
    // using and overriding "makeTemplateSource" to return an instance of your custom template source.

    ko.templateSources = {};

    // ---- ko.templateSources.domElement -----

    ko.templateSources.domElement = function(element) {
        this.domElement = element;
    }

    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        var tagNameLower = ko.utils.tagNameLower(this.domElement),
            elemContentsProperty = tagNameLower === "script" ? "text"
                                 : tagNameLower === "textarea" ? "value"
                                 : "innerHTML";

        if (arguments.length == 0) {
            return this.domElement[elemContentsProperty];
        } else {
            var valueToWrite = arguments[0];
            if (elemContentsProperty === "innerHTML")
                ko.utils.setHtml(this.domElement, valueToWrite);
            else
                this.domElement[elemContentsProperty] = valueToWrite;
        }
    };

    ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
        if (arguments.length === 1) {
            return ko.utils.domData.get(this.domElement, "templateSourceData_" + key);
        } else {
            ko.utils.domData.set(this.domElement, "templateSourceData_" + key, arguments[1]);
        }
    };

    // ---- ko.templateSources.anonymousTemplate -----
    // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
    // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
    // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

    var anonymousTemplatesDomDataKey = "__ko_anon_template__";
    ko.templateSources.anonymousTemplate = function(element) {
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            if (templateData.textData === undefined && templateData.containerData)
                templateData.textData = templateData.containerData.innerHTML;
            return templateData.textData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {textData: valueToWrite});
        }
    };
    ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            return templateData.containerData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {containerData: valueToWrite});
        }
    };

    ko.exportSymbol('templateSources', ko.templateSources);
    ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
    ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
})();
(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw new Error("templateEngine must inherit from ko.templateEngine");
        _templateEngine = templateEngine;
    }

    function invokeForEachNodeOrCommentInContinuousRange(firstNode, lastNode, action) {
        var node, nextInQueue = firstNode, firstOutOfRangeNode = ko.virtualElements.nextSibling(lastNode);
        while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
            nextInQueue = ko.virtualElements.nextSibling(node);
            if (node.nodeType === 1 || node.nodeType === 8)
                action(node);
        }
    }

    function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
        // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
        // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
        // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
        // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
        // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

        if (continuousNodeArray.length) {
            var firstNode = continuousNodeArray[0], lastNode = continuousNodeArray[continuousNodeArray.length - 1];

            // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
            // whereas a regular applyBindings won't introduce new memoized nodes
            invokeForEachNodeOrCommentInContinuousRange(firstNode, lastNode, function(node) {
                ko.applyBindings(bindingContext, node);
            });
            invokeForEachNodeOrCommentInContinuousRange(firstNode, lastNode, function(node) {
                ko.memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]);
            });
        }
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
        options = options || {};
        var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
        var templateDocument = firstTargetNode && firstTargetNode.ownerDocument;
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse, templateDocument);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options, templateDocument);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw new Error("Template engine must return an array of DOM nodes");

        var haveAddedNodesToParent = false;
        switch (renderMode) {
            case "replaceChildren":
                ko.virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "replaceNode":
                ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "ignoreTargetNode": break;
            default:
                throw new Error("Unknown renderMode: " + renderMode);
        }

        if (haveAddedNodesToParent) {
            activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
            if (options['afterRender'])
                ko.dependencyDetection.ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
        }

        return renderedNodesArray;
    }

    ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw new Error("Set a template engine before calling renderTemplate");
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

            return ko.dependentObservable( // So the DOM is automatically updated when any dependency changes
                function () {
                    // Ensure we've got a proper binding context to work with
                    var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                        ? dataOrBindingContext
                        : new ko.bindingContext(ko.utils.unwrapObservable(dataOrBindingContext));

                    // Support selecting template as a function of the data being rendered
                    var templateName = typeof(template) == 'function' ? template(bindingContext['$data'], bindingContext) : template;

                    var renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);
                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
        // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
        // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
        var arrayItemContext;

        // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
        var executeTemplateForArrayItem = function (arrayValue, index) {
            // Support selecting template as a function of the data being rendered
            arrayItemContext = parentBindingContext['createChildContext'](ko.utils.unwrapObservable(arrayValue), options['as']);
            arrayItemContext['$index'] = index;
            var templateName = typeof(template) == 'function' ? template(arrayValue, arrayItemContext) : template;
            return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
        }

        // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
        var activateBindingsCallback = function(arrayValue, addedNodesArray, index) {
            activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
            if (options['afterRender'])
                options['afterRender'](addedNodesArray, arrayValue);
        };

        return ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return options['includeDestroyed'] || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
            // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
            ko.dependencyDetection.ignore(ko.utils.setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

        }, null, { disposeWhenNodeIsRemoved: targetNode });
    };

    var templateComputedDomDataKey = '__ko__templateComputedDomDataKey__';
    function disposeOldComputedAndStoreNewOne(element, newComputed) {
        var oldComputed = ko.utils.domData.get(element, templateComputedDomDataKey);
        if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
            oldComputed.dispose();
        ko.utils.domData.set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
    }

    ko.bindingHandlers['template'] = {
        'init': function(element, valueAccessor) {
            // Support anonymous templates
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            if ((typeof bindingValue != "string") && (!bindingValue['name']) && (element.nodeType == 1 || element.nodeType == 8)) {
                // It's an anonymous template - store the element contents, then clear the element
                var templateNodes = element.nodeType == 1 ? element.childNodes : ko.virtualElements.childNodes(element),
                    container = ko.utils.moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            }
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var templateName = ko.utils.unwrapObservable(valueAccessor()),
                options = {},
                shouldDisplay = true,
                dataValue,
                templateComputed = null;

            if (typeof templateName != "string") {
                options = templateName;
                templateName = options['name'];

                // Support "if"/"ifnot" conditions
                if ('if' in options)
                    shouldDisplay = ko.utils.unwrapObservable(options['if']);
                if (shouldDisplay && 'ifnot' in options)
                    shouldDisplay = !ko.utils.unwrapObservable(options['ifnot']);

                dataValue = ko.utils.unwrapObservable(options['data']);
            }

            if ('foreach' in options) {
                // Render once for each data point (treating data set as empty if shouldDisplay==false)
                var dataArray = (shouldDisplay && options['foreach']) || [];
                templateComputed = ko.renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
            } else if (!shouldDisplay) {
                ko.virtualElements.emptyNode(element);
            } else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var innerBindingContext = ('data' in options) ?
                    bindingContext['createChildContext'](dataValue, options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                    bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
                templateComputed = ko.renderTemplate(templateName || element, innerBindingContext, options, element);
            }

            // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
            disposeOldComputedAndStoreNewOne(element, templateComputed);
        }
    };

    // Anonymous templates can't be rewritten. Give a nice error message if you try to do it.
    ko.expressionRewriting.bindingRewriteValidators['template'] = function(bindingValue) {
        var parsedBindingValue = ko.expressionRewriting.parseObjectLiteral(bindingValue);

        if ((parsedBindingValue.length == 1) && parsedBindingValue[0]['unknown'])
            return null; // It looks like a string literal, not an object literal, so treat it as a named template (which is allowed for rewriting)

        if (ko.expressionRewriting.keyValueArrayContainsKey(parsedBindingValue, "name"))
            return null; // Named templates can be rewritten, so return "no error"
        return "This template engine does not support anonymous templates nested within its templates";
    };

    ko.virtualElements.allowedBindings['template'] = true;
})();

ko.exportSymbol('setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('renderTemplate', ko.renderTemplate);

ko.utils.compareArrays = (function () {
    var statusNotInOld = 'added', statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
    function compareArrays(oldArray, newArray, dontLimitMoves) {
        oldArray = oldArray || [];
        newArray = newArray || [];

        if (oldArray.length <= newArray.length)
            return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, dontLimitMoves);
        else
            return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, dontLimitMoves);
    }

    function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, dontLimitMoves) {
        var myMin = Math.min,
            myMax = Math.max,
            editDistanceMatrix = [],
            smlIndex, smlIndexMax = smlArray.length,
            bigIndex, bigIndexMax = bigArray.length,
            compareRange = (bigIndexMax - smlIndexMax) || 1,
            maxDistance = smlIndexMax + bigIndexMax + 1,
            thisRow, lastRow,
            bigIndexMaxForRow, bigIndexMinForRow;

        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = []);
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex)
                    thisRow[bigIndex] = smlIndex + 1;
                else if (!smlIndex)  // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                else {
                    var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                }
            }
        }

        var editScript = [], meMinusOne, notInSml = [], notInBig = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
                notInSml.push(editScript[editScript.length] = {     // added
                    'status': statusNotInSml,
                    'value': bigArray[--bigIndex],
                    'index': bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = {     // deleted
                    'status': statusNotInBig,
                    'value': smlArray[--smlIndex],
                    'index': smlIndex });
            } else {
                editScript.push({
                    'status': "retained",
                    'value': bigArray[--bigIndex] });
                --smlIndex;
            }
        }

        if (notInSml.length && notInBig.length) {
            // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
            // smlIndexMax keeps the time complexity of this algorithm linear.
            var limitFailedCompares = smlIndexMax * 10, failedCompares,
                a, d, notInSmlItem, notInBigItem;
            // Go through the items that have been added and deleted and try to find matches between them.
            for (failedCompares = a = 0; (dontLimitMoves || failedCompares < limitFailedCompares) && (notInSmlItem = notInSml[a]); a++) {
                for (d = 0; notInBigItem = notInBig[d]; d++) {
                    if (notInSmlItem['value'] === notInBigItem['value']) {
                        notInSmlItem['moved'] = notInBigItem['index'];
                        notInBigItem['moved'] = notInSmlItem['index'];
                        notInBig.splice(d,1);       // This item is marked as moved; so remove it from notInBig list
                        failedCompares = d = 0;     // Reset failed compares count because we're checking for consecutive failures
                        break;
                    }
                }
                failedCompares += d;
            }
        }
        return editScript.reverse();
    }

    return compareArrays;
})();

ko.exportSymbol('utils.compareArrays', ko.utils.compareArrays);

(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function fixUpNodesToBeMovedOrRemoved(contiguousNodeArray) {
        // Before moving, deleting, or replacing a set of nodes that were previously outputted by the "map" function, we have to reconcile
        // them against what is in the DOM right now. It may be that some of the nodes have already been removed from the document,
        // or that new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
        // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
        // So, this function translates the old "map" output array into its best guess of what set of current DOM nodes should be removed.
        //
        // Rules:
        //   [A] Any leading nodes that aren't in the document any more should be ignored
        //       These most likely correspond to memoization nodes that were already removed during binding
        //       See https://github.com/SteveSanderson/knockout/pull/440
        //   [B] We want to output a contiguous series of nodes that are still in the document. So, ignore any nodes that
        //       have already been removed, and include any nodes that have been inserted among the previous collection

        // Rule [A]
        while (contiguousNodeArray.length && !ko.utils.domNodeIsAttachedToDocument(contiguousNodeArray[0]))
            contiguousNodeArray.splice(0, 1);

        // Rule [B]
        if (contiguousNodeArray.length > 1) {
            // Build up the actual new contiguous node set
            var current = contiguousNodeArray[0], last = contiguousNodeArray[contiguousNodeArray.length - 1], newContiguousSet = [current];
            while (current !== last) {
                current = current.nextSibling;
                if (!current) // Won't happen, except if the developer has manually removed some DOM elements (then we're in an undefined scenario)
                    return;
                newContiguousSet.push(current);
            }

            // ... then mutate the input array to match this.
            // (The following line replaces the contents of contiguousNodeArray with newContiguousSet)
            Array.prototype.splice.apply(contiguousNodeArray, [0, contiguousNodeArray.length].concat(newContiguousSet));
        }
        return contiguousNodeArray;
    }

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap, index) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                ko.utils.replaceDomNodes(fixUpNodesToBeMovedOrRemoved(mappedNodes), newMappedNodes);
                if (callbackAfterAddingNodes)
                    ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.splice(0, mappedNodes.length);
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return (mappedNodes.length == 0) || !ko.utils.domNodeIsAttachedToDocument(mappedNodes[0]) } });
        return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
    }

    var lastMappingResultDomDataKey = "setDomNodeChildrenFromArrayMapping_lastMappingResult";

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var newMappingResultIndex = 0;

        var nodesToDelete = [];
        var itemsToProcess = [];
        var itemsForBeforeRemoveCallbacks = [];
        var itemsForMoveCallbacks = [];
        var itemsForAfterAddCallbacks = [];
        var mapData;

        function itemMovedOrRetained(editScriptIndex, oldPosition) {
            mapData = lastMappingResult[oldPosition];
            if (newMappingResultIndex !== oldPosition)
                itemsForMoveCallbacks[editScriptIndex] = mapData;
            // Since updating the index might change the nodes, do so before calling fixUpNodesToBeMovedOrRemoved
            mapData.indexObservable(newMappingResultIndex++);
            fixUpNodesToBeMovedOrRemoved(mapData.mappedNodes);
            newMappingResult.push(mapData);
            itemsToProcess.push(mapData);
        }

        function callCallback(callback, items) {
            if (callback) {
                for (var i = 0, n = items.length; i < n; i++) {
                    if (items[i]) {
                        ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                            callback(node, i, items[i].arrayEntry);
                        });
                    }
                }
            }
        }

        for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
            movedIndex = editScriptItem['moved'];
            switch (editScriptItem['status']) {
                case "deleted":
                    if (movedIndex === undefined) {
                        mapData = lastMappingResult[lastMappingResultIndex];

                        // Stop tracking changes to the mapping for these nodes
                        if (mapData.dependentObservable)
                            mapData.dependentObservable.dispose();

                        // Queue these nodes for later removal
                        nodesToDelete.push.apply(nodesToDelete, fixUpNodesToBeMovedOrRemoved(mapData.mappedNodes));
                        if (options['beforeRemove']) {
                            itemsForBeforeRemoveCallbacks[i] = mapData;
                            itemsToProcess.push(mapData);
                        }
                    }
                    lastMappingResultIndex++;
                    break;

                case "retained":
                    itemMovedOrRetained(i, lastMappingResultIndex++);
                    break;

                case "added":
                    if (movedIndex !== undefined) {
                        itemMovedOrRetained(i, movedIndex);
                    } else {
                        mapData = { arrayEntry: editScriptItem['value'], indexObservable: ko.observable(newMappingResultIndex++) };
                        newMappingResult.push(mapData);
                        itemsToProcess.push(mapData);
                        if (!isFirstExecution)
                            itemsForAfterAddCallbacks[i] = mapData;
                    }
                    break;
            }
        }

        // Call beforeMove first before any changes have been made to the DOM
        callCallback(options['beforeMove'], itemsForMoveCallbacks);

        // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
        ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

        // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
        for (var i = 0, nextNode = ko.virtualElements.firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
            // Get nodes for newly added items
            if (!mapData.mappedNodes)
                ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

            // Put nodes in the right place if they aren't there already
            for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
                if (node !== nextNode)
                    ko.virtualElements.insertAfter(domNode, node, lastNode);
            }

            // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
            if (!mapData.initialized && callbackAfterAddingNodes) {
                callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                mapData.initialized = true;
            }
        }

        // If there's a beforeRemove callback, call it after reordering.
        // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
        // some sort of animation, which is why we first reorder the nodes that will be removed. If the
        // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
        // Perhaps we'll make that change in the future if this scenario becomes more common.
        callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var templateText = templateSource['text']();
        return ko.utils.parseHtmlFragment(templateText);
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
(function() {
    ko.jqueryTmplTemplateEngine = function () {
        // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl
        // doesn't expose a version number, so we have to infer it.
        // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
        // which KO internally refers to as version "2", so older versions are no longer detected.
        var jQueryTmplVersion = this.jQueryTmplVersion = (function() {
            if ((typeof(jQuery) == "undefined") || !(jQuery['tmpl']))
                return 0;
            // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
            try {
                if (jQuery['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                    // Since 1.0.0pre, custom tags should append markup to an array called "__"
                    return 2; // Final version of jquery.tmpl
                }
            } catch(ex) { /* Apparently not the version we were looking for */ }

            return 1; // Any older version that we don't support
        })();

        function ensureHasReferencedJQueryTemplates() {
            if (jQueryTmplVersion < 2)
                throw new Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");
        }

        function executeTemplate(compiledTemplate, data, jQueryTemplateOptions) {
            return jQuery['tmpl'](compiledTemplate, data, jQueryTemplateOptions);
        }

        this['renderTemplateSource'] = function(templateSource, bindingContext, options) {
            options = options || {};
            ensureHasReferencedJQueryTemplates();

            // Ensure we have stored a precompiled version of this template (don't want to reparse on every render)
            var precompiled = templateSource['data']('precompiled');
            if (!precompiled) {
                var templateText = templateSource['text']() || "";
                // Wrap in "with($whatever.koBindingContext) { ... }"
                templateText = "{{ko_with $item.koBindingContext}}" + templateText + "{{/ko_with}}";

                precompiled = jQuery['template'](null, templateText);
                templateSource['data']('precompiled', precompiled);
            }

            var data = [bindingContext['$data']]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
            var jQueryTemplateOptions = jQuery['extend']({ 'koBindingContext': bindingContext }, options['templateOptions']);

            var resultNodes = executeTemplate(precompiled, data, jQueryTemplateOptions);
            resultNodes['appendTo'](document.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work

            jQuery['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
            return resultNodes;
        };

        this['createJavaScriptEvaluatorBlock'] = function(script) {
            return "{{ko_code ((function() { return " + script + " })()) }}";
        };

        this['addTemplate'] = function(templateName, templateMarkup) {
            document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "</script>");
        };

        if (jQueryTmplVersion > 0) {
            jQuery['tmpl']['tag']['ko_code'] = {
                open: "__.push($1 || '');"
            };
            jQuery['tmpl']['tag']['ko_with'] = {
                open: "with($1) {",
                close: "} "
            };
        }
    };

    ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();

    // Use this one by default *only if jquery.tmpl is referenced*
    var jqueryTmplTemplateEngineInstance = new ko.jqueryTmplTemplateEngine();
    if (jqueryTmplTemplateEngineInstance.jQueryTmplVersion > 0)
        ko.setTemplateEngine(jqueryTmplTemplateEngineInstance);

    ko.exportSymbol('jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
})();
});
})(window,document,navigator,window["jQuery"]);
})();
//=====================================
// Base class of all components
// it also provides some util methods like
//=====================================
define('components/base',["core/clazz",
		"core/mixin/event",
		"knockout"], function(Clazz, Event, ko){

var repository = {};	//repository to store all the component instance

var Base = Clazz.derive(function(){
return {	// Public properties
	// Name of component, will be used in the query of the component
	name : "",
	// Tag of wrapper element
	tag : "div",
	// Attribute of the wrapper element
	attr : {},
	// Jquery element as a wrapper
	// It will be created in the constructor
	$el : null,
	// Attribute will be applied to self
	// WARNING: It will be only used in the constructor
	// So there is no need to re-assign a new viewModel when created an instance
	// if property in the attribute is a observable
	// it will be binded to the property in viewModel
	attributes : {},
	
	parent : null,
	// ui skin
	skin : "",
	// Class prefix
	classPrefix : "qpf-ui-",
	// Skin prefix
	skinPrefix : "qpf-skin-",

	id : ko.observable(""),
	width : ko.observable(),
	class : ko.observable(),
	height : ko.observable(),
	visible : ko.observable(true),
	disable : ko.observable(false),
	style : ko.observable(""),

	// If the temporary is set true,
	// It will not be stored in the repository and 
	// will be destroyed when there are no reference any more
	// Maybe a ugly solution to prevent memory leak 
	temporary : false,
	// events list inited at first time
	events : {}
}}, function(){	//constructor

	this.__GUID__ = genGUID();
	// add to repository
	if( ! this.temporary ){
		repository[this.__GUID__] = this;
	}

	if( ! this.$el){
		this.$el = $(document.createElement(this.tag));
	}
	this.$el[0].setAttribute("data-qpf-guid", this.__GUID__);

	this.$el.attr(this.attr);
	if( this.skin ){
		this.$el.addClass( this.withPrefix(this.skin, this.skinPrefix) );
	}

	if( this.css ){
		_.each( _.union(this.css), function(className){
			this.$el.addClass( this.withPrefix(className, this.classPrefix) );
		}, this)
	}
	// Class name of wrapper element is depend on the lowercase of component type
	// this.$el.addClass( this.withPrefix(this.type.toLowerCase(), this.classPrefix) );

	this.width.subscribe(function(newValue){
		this.$el.width(newValue);
		this.afterResize();
	}, this);
	this.height.subscribe(function(newValue){
		this.$el.height(newValue);
		this.afterResize();
	}, this);
	this.disable.subscribe(function(newValue){
		this.$el[newValue?"addClass":"removeClass"]("qpf-disable");
	}, this);
	this.id.subscribe(function(newValue){
		this.$el.attr("id", newValue);
	}, this);
	this.class.subscribe(function(newValue){
		this.$el.addClass( newValue );
	}, this);
	this.visible.subscribe(function(newValue){
		newValue ? this.$el.show() : this.$el.hide();
	}, this);
	this.style.subscribe(function(newValue){
		var valueSv = newValue;
		var styleRegex = /(\S*?)\s*:\s*(.*)/g;
		// preprocess the style string
		newValue = "{" + _.chain(newValue.split(";"))
						.map(function(item){
							return item.replace(/(^\s*)|(\s*$)/g, "") //trim
										.replace(styleRegex, '"$1":"$2"');
						})
						.filter(function(item){return item;})
						.value().join(",") + "}";
		try{
			var obj = ko.utils.parseJson(newValue);
			this.$el.css(obj);
		}catch(e){
			console.error("Syntax Error of style: "+ valueSv);
		}
	}, this);

	// register the events before initialize
	for( var name in this.events ){
		var handler = this.events[name];
		if( typeof(handler) == "function"){
			this.on(name, handler);
		}
	}

	// apply attribute 
	this._mappingAttributes( this.attributes );

	this.initialize();
	this.trigger("initialize");
	// Here we removed auto rendering at constructor
	// to support deferred rendering after the $el is attached
	// to the document
	// this.render();

}, {// Prototype
	// Type of component. The className of the wrapper element is
	// depend on the type
	type : "BASE",
	// Template of the component, will be applyed binging with viewModel
	template : "",
	// Declare the events that will be provided 
	// Developers can use on method to subscribe these events
	// It is used in the binding handlers to judge which parameter
	// passed in is events
	eventsProvided : ["click", "mousedown", "mouseup", "mousemove", "resize",
						"initialize", "beforerender", "render", "dispose"],

	// Will be called after the component first created
	initialize : function(){},
	// set the attribute in the modelView
	set : function(key, value){
		if( typeof(key) == "string" ){
			var source = {};
			source[key] = value;
		}else{
			source = key;
		};
		this._mappingAttributes( source, true );
	},
	// Call to refresh the component
	// Will trigger beforeRender and afterRender hooks
	// beforeRender and afterRender hooks is mainly provide for
	// the subclasses
	render : function(){
		this.beforeRender && this.beforeRender();
		this.trigger("beforerender");

		this.doRender();
		this.afterRender && this.afterRender();

		this.trigger("render");
		// trigger the resize events
		this.afterResize();
	},
	// Default render method
	doRender : function(){
		this.$el.children().each(function(){
			Base.disposeDom( this );
		})

		this.$el.html(this.template);
		ko.applyBindings( this, this.$el[0] );
	},
	// Dispose the component instance
	dispose : function(){
		if( this.$el ){
			// remove the dom element
			this.$el.remove()
		}
		// remove from repository
		repository[this.__GUID__] = null;

		this.trigger("dispose");
	},
	resize : function(width, height){
		if( typeof(width) === "number"){
			this.width( width );
		}
		if( typeof(height) == "number"){
			this.height( height );
		}
	},
	afterResize : function(){
		this.trigger('resize');
	},
	withPrefix : function(className, prefix){
		if( className.indexOf(prefix) != 0 ){
			return prefix + className;
		}
	},
	withoutPrefix : function(className, prefix){
		if( className.indexOf(prefix) == 0){
			return className.substr(prefix.length);
		}
	},
	_mappingAttributes : function(attributes, onlyUpdate){
		for(var name in attributes){
			var attr = attributes[name];
			var propInVM = this[name];
			// create new attribute when property is not existed, even if it will not be used
			if( ! propInVM ){
				var value = ko.utils.unwrapObservable(attr);
				// is observableArray or plain array
				if( (ko.isObservable(attr) && attr.push) ||
					attr.constructor == Array){
					this[name] = ko.observableArray(value);
				}else{
					this[name] = ko.observable(value);
				}
				propInVM = this[name];
			}
			else if( ko.isObservable(propInVM) ){
				propInVM(ko.utils.unwrapObservable(attr) );
			}else{
				this[name] = ko.utils.unwrapObservable(attr);
			}
			if( ! onlyUpdate){
				if( ko.isObservable(attr) ){
					bridge(propInVM, attr);
				}
			}
		}	
	}
})

// register proxy events of dom
var proxyEvents = ["click", "mousedown", "mouseup", "mousemove"];
Base.prototype.on = function(eventName){
	// lazy register events
	if( proxyEvents.indexOf(eventName) >= 0 ){
		this.$el.unbind(eventName, proxyHandler)
		.bind(eventName, {context : this}, proxyHandler);
	}
	Event.on.apply(this, arguments);
}
function proxyHandler(e){
	var context = e.data.context;
	var eventType = e.type;

	context.trigger(eventType);
}


// get a unique component by guid
Base.get = function(guid){
	return repository[guid];
}
Base.getByDom = function(domNode){
	var guid = domNode.getAttribute("data-qpf-guid");
	return Base.get(guid);
}

// dispose all the components attached in the domNode and
// its children(if recursive is set true)
Base.disposeDom = function(domNode, resursive){

	if(typeof(recursive) == "undefined"){
		recursive = true;
	}

	function dispose(node){
		var guid = node.getAttribute("data-qpf-guid");
		var component = Base.get(guid);
		if( component ){
			// do not recursive traverse the children of component
			// element
			// hand over dispose of sub element task to the components
			// it self
			component.dispose();
		}else{
			if( recursive ){
				for(var i = 0; i < node.childNodes.length; i++){
					var child = node.childNodes[i];
					if( child.nodeType == 1 ){
						dispose( child );
					}
				}
			}
		}
	}

	dispose(domNode);
}
// util function of generate a unique id
var genGUID = (function(){
	var id = 0;
	return function(){
		return id++;
	}
})();

//----------------------------
// knockout extenders
ko.extenders.numeric = function(target, precision) {

	var fixer = ko.computed({
		read : target,
		write : function(newValue){	
			if( newValue === "" ){
				target("");
				return;
			}else{
				var val = parseFloat(newValue);
			}
			val = isNaN( val ) ? 0 : val;
			var precisionValue = parseFloat( ko.utils.unwrapObservable(precision) );
			if( ! isNaN( precisionValue ) ) {
				var multiplier = Math.pow(10, precisionValue);
				val = Math.round(val * multiplier) / multiplier;
			}
			target(val);
		}
	});

	fixer( target() );

	return fixer;
};

ko.extenders.clamp = function(target, options){
	var min = options.min,
		max = options.max;

	var clamper = ko.computed({
		read : target,
		write : function(value){
			var minValue = parseFloat( ko.utils.unwrapObservable(min) ),
				maxValue = parseFloat( ko.utils.unwrapObservable(max) );

			if( ! isNaN(minValue) ){
				value = Math.max(minValue, value);
			}
			if( ! isNaN(maxValue) ){
				value = Math.min(maxValue, value);
			}
			target(value);
		}
	})

	clamper( target() );
	return clamper;
}

//-------------------------------------------
// Handle bingings in the knockout template

var bindings = {};
Base.provideBinding = function(name, Component ){
	bindings[name] = Component;
}

// provide bindings to knockout
ko.bindingHandlers["qpf"] = {

	createComponent : function(element, valueAccessor){
		// dispose the previous component host on the element
		var prevComponent = Base.getByDom( element );
		if( prevComponent ){
			prevComponent.dispose();
		}
		var component = createComponentFromDataBinding( element, valueAccessor, bindings );
		return component;
	},

	init : function( element, valueAccessor ){

		var component = ko.bindingHandlers["qpf"].createComponent(element, valueAccessor);

		component.render();
		// not apply bindings to the descendant doms in the UI component
		return { 'controlsDescendantBindings': true };
	},

	update : function( element, valueAccessor ){

	}
}

// append the element of view in the binding
ko.bindingHandlers["qpf_view"] = {
	init : function(element, valueAccessor){
		var value = valueAccessor();

		var subView = ko.utils.unwrapObservable(value);
		if( subView && subView.$el ){
			Base.disposeDom(element);
			element.parentNode.replaceChild(subView.$el[0], element);
		}
		// PENDING
		// handle disposal (if KO removes by the template binding)
        // ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        //     subView.dispose();
        // });

		return { 'controlsDescendantBindings': true };
	}
}

//-----------------------------------
// Provide plugins to jquery
$.fn.qpf = function( op, viewModel ){
	op = op || "get";
	if( op === "get"){
		var result = [];
		this.each(function(){
			var item = Base.getByDom(this);
			if( item ){
				result.push(item);
			}
		})
		return result;
	}else if( op === "init"){
		this.each(function(){
			ko.applyBindings(viewModel, this);
		});
		return this.qpf("get");
	}else if(op === "dispose"){
		this.each(function(){
			Base.disposeDom(this);
		})
	}
}

//------------------------------------
// Util functions
var unwrap = ko.utils.unwrapObservable;

function createComponentFromDataBinding(element, valueAccessor){

	var value = valueAccessor();
	
	var options = unwrap(value) || {},
		type = unwrap(options.type);

	if( type ){
		var Constructor = bindings[type];

		if( Constructor ){
			var component = createComponentFromJSON( options, Constructor)
			if( component ){
				element.innerHTML = "";
				element.appendChild( component.$el[0] );
				
				$(element).addClass("qpf-wrapper");
			}
			// save the guid in the element data attribute
			element.setAttribute("data-qpf-guid", component.__GUID__);
		}else{
			console.error("Unkown UI type, " + type);
		}
	}else{
		console.error("UI type is needed");
	}
	return component;
}

function createComponentFromJSON(options, Constructor){

	var type = unwrap(options.type),
		name = unwrap(options.name),
		attr = _.omit(options, "type", "name");

	var events = {};

	// Find which property is event
	_.each(attr, function(value, key){
		if( key.indexOf("on") == 0 &&
			Constructor.prototype.eventsProvided.indexOf(key.substr("on".length)) >= 0 &&
			typeof(value) == "function"){
			delete attr[key];
			events[key.substr("on".length)] = value;
		}
	})

	var component = new Constructor({
		name : name || "",
		attributes : attr,
		events : events
	});

	return component;
}

// build a bridge of twe observables
// and update the value from source to target
// at first time
function bridge(target, source){
	
	target( source() );

	// Save the previous value use clone method in underscore
	// In case the notification is triggered by push methods of
	// Observable Array and the commonValue instance is same with new value
	// instance
	// Reference : `set` method in backbone
	var commonValue = _.clone( target() );
	target.subscribe(function(newValue){
        // Knockout will always suppose the value is mutated each time it is writted
        // the value which is not primitive type(like array)
        // So here will cause a recurse trigger if the value is not a primitive type
        // We use underscore deep compare function to evaluate if the value is changed
		// PENDING : use shallow compare function?
		try{
			if( ! _.isEqual(commonValue, newValue) ){
				commonValue = _.clone( newValue );
				source(newValue);
			}
		}catch(e){
			// Normally when source is computed value
			// and it don't have a write function  
			console.error(e.toString());
		}
	})
	source.subscribe(function(newValue){
		try{
			if( ! _.isEqual(commonValue, newValue) ){
				commonValue = _.clone( newValue );
				target(newValue);
			}
		}catch(e){
			console.error(e.toString());
		}
	})
}

// export the interface
return Base;

});
//==========================
// Util.js
// provide util function to operate
// the components
//===========================
define('components/util',['knockout',
		'core/xmlparser',
		'./base',
		'exports'], function(ko, XMLParser, Base, exports){

	// Return an array of components created from XML
	exports.createComponentsFromXML = function(XMLString, viewModel){

		var dom = XMLParser.parse(XMLString);
		ko.applyBindings(viewModel || {}, dom);
		var ret = [];
		var node = dom.firstChild;
		while(node){
			var component = Base.getByDom(node);
			if( component ){
				ret.push(component);
			}
			node = node.nextSibling;
		}
		return ret;
	}
})
;
/// Knockout Mapping plugin v2.3.5
/// (c) 2012 Steven Sanderson, Roy Jacobs - http://knockoutjs.com/
/// License: MIT (http://www.opensource.org/licenses/mit-license.php)
(function (factory) {
	// Module systems magic dance.

	if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
		// CommonJS or Node: hard-coded dependency on "knockout"
		factory(require("knockout"), exports);
	} else if (typeof define === "function" && define["amd"]) {
		// AMD anonymous module with hard-coded dependency on "knockout"
		define('ko.mapping',["knockout", "exports"], factory);
	} else {
		// <script> tag: use the global `ko` object, attaching a `mapping` property
		factory(ko, ko.mapping = {});
	}
}(function (ko, exports) {
	var DEBUG=true;
	var mappingProperty = "__ko_mapping__";
	var realKoDependentObservable = ko.dependentObservable;
	var mappingNesting = 0;
	var dependentObservables;
	var visitedObjects;
	var recognizedRootProperties = ["create", "update", "key", "arrayChanged"];
	var emptyReturn = {};

	var _defaultOptions = {
		include: ["_destroy"],
		ignore: [],
		copy: [],
		observe: []
	};
	var defaultOptions = _defaultOptions;

	// Author: KennyTM @ StackOverflow
	function unionArrays (x, y) {
		var obj = {};
		for (var i = x.length - 1; i >= 0; -- i) obj[x[i]] = x[i];
		for (var i = y.length - 1; i >= 0; -- i) obj[y[i]] = y[i];
		var res = [];

		for (var k in obj) {
			res.push(obj[k]);
		};

		return res;
	}

	function extendObject(destination, source) {
		var destType;

		for (var key in source) {
			if (source.hasOwnProperty(key) && source[key]) {
				destType = exports.getType(destination[key]);
				if (key && destination[key] && destType !== "array" && destType !== "string") {
					extendObject(destination[key], source[key]);
				} else {
					var bothArrays = exports.getType(destination[key]) === "array" && exports.getType(source[key]) === "array";
					if (bothArrays) {
						destination[key] = unionArrays(destination[key], source[key]);
					} else {
						destination[key] = source[key];
					}
				}
			}
		}
	}

	function merge(obj1, obj2) {
		var merged = {};
		extendObject(merged, obj1);
		extendObject(merged, obj2);

		return merged;
	}

	exports.isMapped = function (viewModel) {
		var unwrapped = ko.utils.unwrapObservable(viewModel);
		return unwrapped && unwrapped[mappingProperty];
	}

	exports.fromJS = function (jsObject /*, inputOptions, target*/ ) {
		if (arguments.length == 0) throw new Error("When calling ko.fromJS, pass the object you want to convert.");

		// When mapping is completed, even with an exception, reset the nesting level
		// window.setTimeout(function () {
			mappingNesting = 0;
		// }, 0);

		if (!mappingNesting++) {
			dependentObservables = [];
			visitedObjects = new objectLookup();
		}

		var options;
		var target;

		if (arguments.length == 2) {
			if (arguments[1][mappingProperty]) {
				target = arguments[1];
			} else {
				options = arguments[1];
			}
		}
		if (arguments.length == 3) {
			options = arguments[1];
			target = arguments[2];
		}

		if (target) {
			options = merge(options, target[mappingProperty]);
		}
		options = fillOptions(options);

		var result = updateViewModel(target, jsObject, options);
		if (target) {
			result = target;
		}

		// Evaluate any dependent observables that were proxied.
		// Do this in a timeout to defer execution. Basically, any user code that explicitly looks up the DO will perform the first evaluation. Otherwise,
		// it will be done by this code.
		if (!--mappingNesting) {
			window.setTimeout(function () {
				while (dependentObservables.length) {
					var DO = dependentObservables.pop();
					if (DO) DO();
				}
			}, 0);
		}

		// Save any new mapping options in the view model, so that updateFromJS can use them later.
		result[mappingProperty] = merge(result[mappingProperty], options);

		return result;
	};

	exports.fromJSON = function (jsonString /*, options, target*/ ) {
		var parsed = ko.utils.parseJson(jsonString);
		arguments[0] = parsed;
		return exports.fromJS.apply(this, arguments);
	};

	exports.updateFromJS = function (viewModel) {
		throw new Error("ko.mapping.updateFromJS, use ko.mapping.fromJS instead. Please note that the order of parameters is different!");
	};

	exports.updateFromJSON = function (viewModel) {
		throw new Error("ko.mapping.updateFromJSON, use ko.mapping.fromJSON instead. Please note that the order of parameters is different!");
	};

	exports.toJS = function (rootObject, options) {
		if (!defaultOptions) exports.resetDefaultOptions();

		if (arguments.length == 0) throw new Error("When calling ko.mapping.toJS, pass the object you want to convert.");
		if (exports.getType(defaultOptions.ignore) !== "array") throw new Error("ko.mapping.defaultOptions().ignore should be an array.");
		if (exports.getType(defaultOptions.include) !== "array") throw new Error("ko.mapping.defaultOptions().include should be an array.");
		if (exports.getType(defaultOptions.copy) !== "array") throw new Error("ko.mapping.defaultOptions().copy should be an array.");

		// Merge in the options used in fromJS
		options = fillOptions(options, rootObject[mappingProperty]);

		// We just unwrap everything at every level in the object graph
		return exports.visitModel(rootObject, function (x) {
			return ko.utils.unwrapObservable(x)
		}, options);
	};

	exports.toJSON = function (rootObject, options) {
		var plainJavaScriptObject = exports.toJS(rootObject, options);
		return ko.utils.stringifyJson(plainJavaScriptObject);
	};

	exports.defaultOptions = function () {
		if (arguments.length > 0) {
			defaultOptions = arguments[0];
		} else {
			return defaultOptions;
		}
	};

	exports.resetDefaultOptions = function () {
		defaultOptions = {
			include: _defaultOptions.include.slice(0),
			ignore: _defaultOptions.ignore.slice(0),
			copy: _defaultOptions.copy.slice(0)
		};
	};

	exports.getType = function(x) {
		if ((x) && (typeof (x) === "object")) {
			if (x.constructor == (new Date).constructor) return "date";
			if (Object.prototype.toString.call(x) === "[object Array]") return "array";
		}
		return typeof x;
	}

	function fillOptions(rawOptions, otherOptions) {
		var options = merge({}, rawOptions);

		// Move recognized root-level properties into a root namespace
		for (var i = recognizedRootProperties.length - 1; i >= 0; i--) {
			var property = recognizedRootProperties[i];

			// Carry on, unless this property is present
			if (!options[property]) continue;

			// Move the property into the root namespace
			if (!(options[""] instanceof Object)) options[""] = {};
			options[""][property] = options[property];
			delete options[property];
		}

		if (otherOptions) {
			options.ignore = mergeArrays(otherOptions.ignore, options.ignore);
			options.include = mergeArrays(otherOptions.include, options.include);
			options.copy = mergeArrays(otherOptions.copy, options.copy);
			options.observe = mergeArrays(otherOptions.observe, options.observe);
		}
		options.ignore = mergeArrays(options.ignore, defaultOptions.ignore);
		options.include = mergeArrays(options.include, defaultOptions.include);
		options.copy = mergeArrays(options.copy, defaultOptions.copy);
		options.observe = mergeArrays(options.observe, defaultOptions.observe);

		options.mappedProperties = options.mappedProperties || {};
		options.copiedProperties = options.copiedProperties || {};
		return options;
	}

	function mergeArrays(a, b) {
		if (exports.getType(a) !== "array") {
			if (exports.getType(a) === "undefined") a = [];
			else a = [a];
		}
		if (exports.getType(b) !== "array") {
			if (exports.getType(b) === "undefined") b = [];
			else b = [b];
		}

		return ko.utils.arrayGetDistinctValues(a.concat(b));
	}

	// When using a 'create' callback, we proxy the dependent observable so that it doesn't immediately evaluate on creation.
	// The reason is that the dependent observables in the user-specified callback may contain references to properties that have not been mapped yet.
	function withProxyDependentObservable(dependentObservables, callback) {
		var localDO = ko.dependentObservable;
		ko.dependentObservable = function (read, owner, options) {
			options = options || {};

			if (read && typeof read == "object") { // mirrors condition in knockout implementation of DO's
				options = read;
			}

			var realDeferEvaluation = options.deferEvaluation;

			var isRemoved = false;

			// We wrap the original dependent observable so that we can remove it from the 'dependentObservables' list we need to evaluate after mapping has
			// completed if the user already evaluated the DO themselves in the meantime.
			var wrap = function (DO) {
				// Temporarily revert ko.dependentObservable, since it is used in ko.isWriteableObservable
				var tmp = ko.dependentObservable;
				ko.dependentObservable = realKoDependentObservable;
				var isWriteable = ko.isWriteableObservable(DO);
				ko.dependentObservable = tmp;

				var wrapped = realKoDependentObservable({
					read: function () {
						if (!isRemoved) {
							ko.utils.arrayRemoveItem(dependentObservables, DO);
							isRemoved = true;
						}
						return DO.apply(DO, arguments);
					},
					write: isWriteable && function (val) {
						return DO(val);
					},
					deferEvaluation: true
				});
				if (DEBUG) wrapped._wrapper = true;
				return wrapped;
			};

			options.deferEvaluation = true; // will either set for just options, or both read/options.
			var realDependentObservable = new realKoDependentObservable(read, owner, options);

			if (!realDeferEvaluation) {
				realDependentObservable = wrap(realDependentObservable);
				dependentObservables.push(realDependentObservable);
			}

			return realDependentObservable;
		}
		ko.dependentObservable.fn = realKoDependentObservable.fn;
		ko.computed = ko.dependentObservable;
		var result = callback();
		ko.dependentObservable = localDO;
		ko.computed = ko.dependentObservable;
		return result;
	}

	function updateViewModel(mappedRootObject, rootObject, options, parentName, parent, parentPropertyName, mappedParent) {
		var isArray = exports.getType(ko.utils.unwrapObservable(rootObject)) === "array";

		parentPropertyName = parentPropertyName || "";

		// If this object was already mapped previously, take the options from there and merge them with our existing ones.
		if (exports.isMapped(mappedRootObject)) {
			var previousMapping = ko.utils.unwrapObservable(mappedRootObject)[mappingProperty];
			options = merge(previousMapping, options);
		}

		var callbackParams = {
			data: rootObject,
			parent: mappedParent || parent
		};

		var hasCreateCallback = function () {
			return options[parentName] && options[parentName].create instanceof Function;
		};

		var createCallback = function (data) {
			return withProxyDependentObservable(dependentObservables, function () {

				if (ko.utils.unwrapObservable(parent) instanceof Array) {
					return options[parentName].create({
						data: data || callbackParams.data,
						parent: callbackParams.parent,
						skip: emptyReturn
					});
				} else {
					return options[parentName].create({
						data: data || callbackParams.data,
						parent: callbackParams.parent
					});
				}				
			});
		};

		var hasUpdateCallback = function () {
			return options[parentName] && options[parentName].update instanceof Function;
		};

		var updateCallback = function (obj, data) {
			var params = {
				data: data || callbackParams.data,
				parent: callbackParams.parent,
				target: ko.utils.unwrapObservable(obj)
			};

			if (ko.isWriteableObservable(obj)) {
				params.observable = obj;
			}

			return options[parentName].update(params);
		}

		var alreadyMapped = visitedObjects.get(rootObject);
		if (alreadyMapped) {
			return alreadyMapped;
		}

		parentName = parentName || "";

		if (!isArray) {
			// For atomic types, do a direct update on the observable
			if (!canHaveProperties(rootObject)) {
				switch (exports.getType(rootObject)) {
				case "function":
					if (hasUpdateCallback()) {
						if (ko.isWriteableObservable(rootObject)) {
							rootObject(updateCallback(rootObject));
							mappedRootObject = rootObject;
						} else {
							mappedRootObject = updateCallback(rootObject);
						}
					} else {
						mappedRootObject = rootObject;
					}
					break;
				default:
					if (ko.isWriteableObservable(mappedRootObject)) {
						if (hasUpdateCallback()) {
							var valueToWrite = updateCallback(mappedRootObject);
							mappedRootObject(valueToWrite);
							return valueToWrite;
						} else {
							var valueToWrite = ko.utils.unwrapObservable(rootObject);
							mappedRootObject(valueToWrite);
							return valueToWrite;
						}
					} else {
						var hasCreateOrUpdateCallback = hasCreateCallback() || hasUpdateCallback();

						if (hasCreateCallback()) {
							mappedRootObject = createCallback();
						} else {
							mappedRootObject = ko.observable(ko.utils.unwrapObservable(rootObject));
						}

						if (hasUpdateCallback()) {
							mappedRootObject(updateCallback(mappedRootObject));
						}

						if (hasCreateOrUpdateCallback) return mappedRootObject;
					}
				}

			} else {
				mappedRootObject = ko.utils.unwrapObservable(mappedRootObject);
				if (!mappedRootObject) {
					if (hasCreateCallback()) {
						var result = createCallback();

						if (hasUpdateCallback()) {
							result = updateCallback(result);
						}

						return result;
					} else {
						if (hasUpdateCallback()) {
							return updateCallback(result);
						}

						mappedRootObject = {};
					}
				}

				if (hasUpdateCallback()) {
					mappedRootObject = updateCallback(mappedRootObject);
				}

				visitedObjects.save(rootObject, mappedRootObject);
				if (hasUpdateCallback()) return mappedRootObject;

				// For non-atomic types, visit all properties and update recursively
				visitPropertiesOrArrayEntries(rootObject, function (indexer) {
					var fullPropertyName = parentPropertyName.length ? parentPropertyName + "." + indexer : indexer;

					if (ko.utils.arrayIndexOf(options.ignore, fullPropertyName) != -1) {
						return;
					}

					if (ko.utils.arrayIndexOf(options.copy, fullPropertyName) != -1) {
						mappedRootObject[indexer] = rootObject[indexer];
						return;
					}

					if(typeof rootObject[indexer] != "object" && typeof rootObject[indexer] != "array" && options.observe.length > 0 && ko.utils.arrayIndexOf(options.observe, fullPropertyName) == -1)
					{
						mappedRootObject[indexer] = rootObject[indexer];
						options.copiedProperties[fullPropertyName] = true;
						return;
					}

					// In case we are adding an already mapped property, fill it with the previously mapped property value to prevent recursion.
					// If this is a property that was generated by fromJS, we should use the options specified there
					var prevMappedProperty = visitedObjects.get(rootObject[indexer]);
					var retval = updateViewModel(mappedRootObject[indexer], rootObject[indexer], options, indexer, mappedRootObject, fullPropertyName, mappedRootObject);
					var value = prevMappedProperty || retval;

					if(options.observe.length > 0 && ko.utils.arrayIndexOf(options.observe, fullPropertyName) == -1)
					{
						mappedRootObject[indexer] = value();
						options.copiedProperties[fullPropertyName] = true;
						return;
					}

					if (ko.isWriteableObservable(mappedRootObject[indexer])) {
						mappedRootObject[indexer](ko.utils.unwrapObservable(value));
					} else {
						value = mappedRootObject[indexer] === undefined ? value : ko.utils.unwrapObservable(value);
						mappedRootObject[indexer] = value;
					}

					options.mappedProperties[fullPropertyName] = true;
				});
			}
		} else { //mappedRootObject is an array
			var changes = [];

			var hasKeyCallback = false;
			var keyCallback = function (x) {
				return x;
			}
			if (options[parentName] && options[parentName].key) {
				keyCallback = options[parentName].key;
				hasKeyCallback = true;
			}

			if (!ko.isObservable(mappedRootObject)) {
				// When creating the new observable array, also add a bunch of utility functions that take the 'key' of the array items into account.
				mappedRootObject = ko.observableArray([]);

				mappedRootObject.mappedRemove = function (valueOrPredicate) {
					var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) {
							return value === keyCallback(valueOrPredicate);
						};
					return mappedRootObject.remove(function (item) {
						return predicate(keyCallback(item));
					});
				}

				mappedRootObject.mappedRemoveAll = function (arrayOfValues) {
					var arrayOfKeys = filterArrayByKey(arrayOfValues, keyCallback);
					return mappedRootObject.remove(function (item) {
						return ko.utils.arrayIndexOf(arrayOfKeys, keyCallback(item)) != -1;
					});
				}

				mappedRootObject.mappedDestroy = function (valueOrPredicate) {
					var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) {
							return value === keyCallback(valueOrPredicate);
						};
					return mappedRootObject.destroy(function (item) {
						return predicate(keyCallback(item));
					});
				}

				mappedRootObject.mappedDestroyAll = function (arrayOfValues) {
					var arrayOfKeys = filterArrayByKey(arrayOfValues, keyCallback);
					return mappedRootObject.destroy(function (item) {
						return ko.utils.arrayIndexOf(arrayOfKeys, keyCallback(item)) != -1;
					});
				}

				mappedRootObject.mappedIndexOf = function (item) {
					var keys = filterArrayByKey(mappedRootObject(), keyCallback);
					var key = keyCallback(item);
					return ko.utils.arrayIndexOf(keys, key);
				}

				mappedRootObject.mappedCreate = function (value) {
					if (mappedRootObject.mappedIndexOf(value) !== -1) {
						throw new Error("There already is an object with the key that you specified.");
					}

					var item = hasCreateCallback() ? createCallback(value) : value;
					if (hasUpdateCallback()) {
						var newValue = updateCallback(item, value);
						if (ko.isWriteableObservable(item)) {
							item(newValue);
						} else {
							item = newValue;
						}
					}
					mappedRootObject.push(item);
					return item;
				}
			}

			var currentArrayKeys = filterArrayByKey(ko.utils.unwrapObservable(mappedRootObject), keyCallback).sort();
			var newArrayKeys = filterArrayByKey(rootObject, keyCallback);
			if (hasKeyCallback) newArrayKeys.sort();
			var editScript = ko.utils.compareArrays(currentArrayKeys, newArrayKeys);

			var ignoreIndexOf = {};

			var i, j;

			var unwrappedRootObject = ko.utils.unwrapObservable(rootObject);
			var itemsByKey = {};
			var optimizedKeys = true;
			for (i = 0, j = unwrappedRootObject.length; i < j; i++) {
				var key = keyCallback(unwrappedRootObject[i]);
				if (key === undefined || key instanceof Object) {
					optimizedKeys = false;
					break;
				}
				itemsByKey[key] = unwrappedRootObject[i];
			}

			var newContents = [];
			var passedOver = 0;
			for (i = 0, j = editScript.length; i < j; i++) {
				var key = editScript[i];
				var mappedItem;
				var fullPropertyName = parentPropertyName + "[" + i + "]";
				switch (key.status) {
				case "added":
					var item = optimizedKeys ? itemsByKey[key.value] : getItemByKey(ko.utils.unwrapObservable(rootObject), key.value, keyCallback);
					mappedItem = updateViewModel(undefined, item, options, parentName, mappedRootObject, fullPropertyName, parent);
					if(!hasCreateCallback()) {
						mappedItem = ko.utils.unwrapObservable(mappedItem);
					}

					var index = ignorableIndexOf(ko.utils.unwrapObservable(rootObject), item, ignoreIndexOf);

					if (mappedItem === emptyReturn) {
						passedOver++;
					} else {
						newContents[index - passedOver] = mappedItem;
					}

					ignoreIndexOf[index] = true;
					break;
				case "retained":
					var item = optimizedKeys ? itemsByKey[key.value] : getItemByKey(ko.utils.unwrapObservable(rootObject), key.value, keyCallback);
					mappedItem = getItemByKey(mappedRootObject, key.value, keyCallback);
					updateViewModel(mappedItem, item, options, parentName, mappedRootObject, fullPropertyName, parent);

					var index = ignorableIndexOf(ko.utils.unwrapObservable(rootObject), item, ignoreIndexOf);
					newContents[index] = mappedItem;
					ignoreIndexOf[index] = true;
					break;
				case "deleted":
					mappedItem = getItemByKey(mappedRootObject, key.value, keyCallback);
					break;
				}

				changes.push({
					event: key.status,
					item: mappedItem
				});
			}

			mappedRootObject(newContents);

			if (options[parentName] && options[parentName].arrayChanged) {
				ko.utils.arrayForEach(changes, function (change) {
					options[parentName].arrayChanged(change.event, change.item);
				});
			}
		}

		return mappedRootObject;
	}

	function ignorableIndexOf(array, item, ignoreIndices) {
		for (var i = 0, j = array.length; i < j; i++) {
			if (ignoreIndices[i] === true) continue;
			if (array[i] === item) return i;
		}
		return null;
	}

	function mapKey(item, callback) {
		var mappedItem;
		if (callback) mappedItem = callback(item);
		if (exports.getType(mappedItem) === "undefined") mappedItem = item;

		return ko.utils.unwrapObservable(mappedItem);
	}

	function getItemByKey(array, key, callback) {
		array = ko.utils.unwrapObservable(array);
		for (var i = 0, j = array.length; i < j; i++) {
			var item = array[i];
			if (mapKey(item, callback) === key) return item;
		}

		throw new Error("When calling ko.update*, the key '" + key + "' was not found!");
	}

	function filterArrayByKey(array, callback) {
		return ko.utils.arrayMap(ko.utils.unwrapObservable(array), function (item) {
			if (callback) {
				return mapKey(item, callback);
			} else {
				return item;
			}
		});
	}

	function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
		if (exports.getType(rootObject) === "array") {
			for (var i = 0; i < rootObject.length; i++)
			visitorCallback(i);
		} else {
			for (var propertyName in rootObject)
			visitorCallback(propertyName);
		}
	};

	function canHaveProperties(object) {
		var type = exports.getType(object);
		return ((type === "object") || (type === "array")) && (object !== null);
	}

	// Based on the parentName, this creates a fully classified name of a property

	function getPropertyName(parentName, parent, indexer) {
		var propertyName = parentName || "";
		if (exports.getType(parent) === "array") {
			if (parentName) {
				propertyName += "[" + indexer + "]";
			}
		} else {
			if (parentName) {
				propertyName += ".";
			}
			propertyName += indexer;
		}
		return propertyName;
	}

	exports.visitModel = function (rootObject, callback, options) {
		options = options || {};
		options.visitedObjects = options.visitedObjects || new objectLookup();

		var mappedRootObject;
		var unwrappedRootObject = ko.utils.unwrapObservable(rootObject);

		if (!canHaveProperties(unwrappedRootObject)) {
			return callback(rootObject, options.parentName);
		} else {
			options = fillOptions(options, unwrappedRootObject[mappingProperty]);

			// Only do a callback, but ignore the results
			callback(rootObject, options.parentName);
			mappedRootObject = exports.getType(unwrappedRootObject) === "array" ? [] : {};
		}

		options.visitedObjects.save(rootObject, mappedRootObject);

		var parentName = options.parentName;
		visitPropertiesOrArrayEntries(unwrappedRootObject, function (indexer) {
			if (options.ignore && ko.utils.arrayIndexOf(options.ignore, indexer) != -1) return;

			var propertyValue = unwrappedRootObject[indexer];
			options.parentName = getPropertyName(parentName, unwrappedRootObject, indexer);

			// If we don't want to explicitly copy the unmapped property...
			if (ko.utils.arrayIndexOf(options.copy, indexer) === -1) {
				// ...find out if it's a property we want to explicitly include
				if (ko.utils.arrayIndexOf(options.include, indexer) === -1) {
					// The mapped properties object contains all the properties that were part of the original object.
					// If a property does not exist, and it is not because it is part of an array (e.g. "myProp[3]"), then it should not be unmapped.
				    if (unwrappedRootObject[mappingProperty]
				        && unwrappedRootObject[mappingProperty].mappedProperties && !unwrappedRootObject[mappingProperty].mappedProperties[indexer]
				        && unwrappedRootObject[mappingProperty].copiedProperties && !unwrappedRootObject[mappingProperty].copiedProperties[indexer]
				        && !(exports.getType(unwrappedRootObject) === "array")) {
						return;
					}
				}
			}

			var outputProperty;
			switch (exports.getType(ko.utils.unwrapObservable(propertyValue))) {
			case "object":
			case "array":
			case "undefined":
				var previouslyMappedValue = options.visitedObjects.get(propertyValue);
				mappedRootObject[indexer] = (exports.getType(previouslyMappedValue) !== "undefined") ? previouslyMappedValue : exports.visitModel(propertyValue, callback, options);
				break;
			default:
				mappedRootObject[indexer] = callback(propertyValue, options.parentName);
			}
		});

		return mappedRootObject;
	}

	function simpleObjectLookup() {
		var keys = [];
		var values = [];
		this.save = function (key, value) {
			var existingIndex = ko.utils.arrayIndexOf(keys, key);
			if (existingIndex >= 0) values[existingIndex] = value;
			else {
				keys.push(key);
				values.push(value);
			}
		};
		this.get = function (key) {
			var existingIndex = ko.utils.arrayIndexOf(keys, key);
			var value = (existingIndex >= 0) ? values[existingIndex] : undefined;
			return value;
		};
	};

	function objectLookup() {
		var buckets = {};

		var findBucket = function(key) {
			var bucketKey;
			try {
				bucketKey = key;//JSON.stringify(key);
			}
			catch (e) {
				bucketKey = "$$$";
			}

			var bucket = buckets[bucketKey];
			if (bucket === undefined) {
				bucket = new simpleObjectLookup();
				buckets[bucketKey] = bucket;
			}
			return bucket;
		};

		this.save = function (key, value) {
			findBucket(key).save(key, value);
		};
		this.get = function (key) {
			return findBucket(key).get(key);
		};
	};
}));
//==================================
// Base class of all meta component
// Meta component is the ui component
// that has no children
//==================================
define('components/meta/meta',['../base',
		'knockout',
		'ko.mapping'], function(Base, ko, koMapping){

var Meta = Base.derive(
{
}, {
	type : "META",

	css : 'meta'
})

// Inherit the static methods
Meta.provideBinding = Base.provideBinding;

return Meta;

});
//======================================
// Button component
//======================================
define('components/meta/button',['./meta',
		'core/xmlparser',
		'knockout'], function(Meta, XMLParser, ko){

var Button = Meta.derive(function(){
return {
	$el : $('<button data-bind="html:text"></button>'),
	
	// value of the button
	text : ko.observable('Button')
	
}}, {

	type : 'BUTTON',

	css : 'button',

	afterRender : function(){
		var me = this;
	}
});

Meta.provideBinding("button", Button);

// provide parser when do xmlparsing
XMLParser.provideParser("button", function(xmlNode){
	
	var text = XMLParser.util.getTextContent(xmlNode);
	if(text){
		return {
			text : text
		}
	}
})

return Button;

});
/**
 * GooJS
 *
 * A simple, flexible canvas drawing library,
 * Provides:
 * + Retained mode drawing
 * + Drawing element management
 * + Render tree management
 * + Both pixel based picking and shape based picking
 * + Mouse events dispatch
 * + Common shape 
 * + Word wrap and wordbreak of text
 * @author shenyi01@baidu.com
 *
 */
 (function(factory){
 	// AMD
 	if( typeof define !== "undefined" && define["amd"] ){
 		define('goo',["exports"], factory);
 	// No module loader
 	}else{
 		factory( window["GooJS"] = {} );
 	}

})(function(_exports){

var GooJS = _exports;

GooJS.create = function(dom){
		//elements to be rendered in the scene
	var renderPool = {},
		//canvas element
		container = null,
		//context of canvans
		context = null,
		//width of canvas
		clientWidth = 0,
		//height of canvas
		clientHeight = 0,
		//a ghost canvas for pixel based picking
		ghostCanvas = null,
		//context of ghost canvas
		ghostCanvasContext = null,
		//store the element for picking, 
		//index is the color drawed in the ghost canvas
		elementLookupTable = [],

		ghostImageData;

	function add(elem){
		elem && 
			(renderPool[elem.__GUID__] = elem);
	}
	/**
	 * @param elem element id || element
	 */
	function remove(elem){
		if(typeof(elem) == 'string'){
			elem = elementsMap[elem];
		}
		
		delete renderPool[elem.__GUID__];
	}
	
	function render(){

		context.clearRect(0, 0, clientWidth, clientHeight);
		ghostCanvasContext.clearRect(0, 0, clientWidth, clientHeight);
		
		elementLookupTable = [];

		var renderQueue = getSortedRenderQueue(renderPool);		

		for(var i =0; i < renderQueue.length; i++){
			var r = renderQueue[i];
			
			draw(r);

			drawGhost(r);
		}
		////////get image data
		ghostImageData = ghostCanvasContext.getImageData(0, 0, ghostCanvas.width, ghostCanvas.height);

		function draw(r){
			
			if( ! r.visible){
				return ;
			}

			context.save();

			// set style
			if(r.style){
				// support mutiple style bind
				if( ! r.style instanceof GooJS.Style){

					for(var name in r.style){
						
						r.style[name].bind(context);
 					}
				}else{

					r.style.bind(context);
				}
			}
			// set transform
			r._transform && context.transform(r._transform[0],
											r._transform[1],
											r._transform[2],
											r._transform[3],
											r._transform[4],
											r._transform[5]);

			r.draw(context);
			//clip from current shape;
			r.clip && context.clip();
			//draw its children
			var renderQueue = getSortedRenderQueue(r.children);
			for(var i = 0; i < renderQueue.length; i++){
				draw(renderQueue[i]);
			}

			context.restore();
		}

		function drawGhost(r){
			if( ! r.visible){
				return;
			}

			elementLookupTable.push(r);

			ghostCanvasContext.save();

			var rgb = packID(elementLookupTable.length),
				color = 'rgb('+rgb.r+','+rgb.g+','+rgb.b+')';

			ghostCanvasContext.fillStyle = color;
			ghostCanvasContext.strokeStyle = color;

			if(r.intersectLineWidth){
				ghostCanvasContext.lineWidth = r.intersectLineWidth;
			}
			else if(r.style && r.style.lineWidth){
				ghostCanvasContext.lineWidth = r.style.lineWidth;
			}

			// set transform
			r._transform && ghostCanvasContext.transform(r._transform[0],
											r._transform[1],
											r._transform[2],
											r._transform[3],
											r._transform[4],
											r._transform[5]);
		
			if(r instanceof GooJS.Text){
			}
			else if(r instanceof GooJS.Image){
			}
			else{
				r.draw(ghostCanvasContext);
			}
			// set clip
			r.clip && ghostCanvasContext.clip();

			//draw its children
			var renderQueue = getSortedRenderQueue(r.children);
			for(var i = 0; i < renderQueue.length; i++){
				drawGhost(renderQueue[i]);
			}

			ghostCanvasContext.restore();
		}

		function getSortedRenderQueue(pool){
			var renderQueue = [];

			for (var guid in pool) {
			
				renderQueue.push(pool[guid]);
			};

			//z值从小到大排, 相同按照GUID的顺序
			renderQueue.sort(function(x, y){
				if(x.z == y.z)
					return x.__GUID__ > y.__GUID__ ? 1 : -1;
				
				return x.z > y.z ? 1 : -1;
			})
			return renderQueue;
		}
	}

	function getMousePosition(e){
		var offsetX = e.pageX - this.offsetLeft,
			offsetY = e.pageY - this.offsetTop,
			p = this,
			props = {};
			
		while(p = p.offsetParent){
			offsetX -= p.offsetLeft;
			offsetY -= p.offsetTop;
		}
		return {
			x : offsetX,
			y : offsetY,
			pageX : e.pageX,
			pageY : e.pageY
		}
	}
	
	function clickHandler(e){
	
		findTrigger.call(this, e, 'click');
	}
	
	function mouseDownHandler(e){
		
		findTrigger.call(this, e, 'mousedown');
	}
	
	function mouseUpHandler(e){

		var props = getMousePosition.call(this, e);

		for(var i = 0; i < elementLookupTable.length; i++){
			
			var elem = elementLookupTable[i];
			
			MouseEvent.throw("mouseup", elem, props);
		}
	}
	
	function mouseMoveHandler(e){
		
		var props = getMousePosition.call(this, e);

		for(var i = 0; i < elementLookupTable.length; i++){
			
			var elem = elementLookupTable[i];

			MouseEvent.throw("mousemove", elem, props);
		}

		var trigger = findTrigger.call(this, e, 'mouseover');
		trigger && (trigger.__mouseover__ = true);
	}
	
	function mouseOutHandler(e){
		
		var props = getMousePosition.call(this, e);

		for(var i = 0; i < elementLookupTable.length; i++){

			var elem = elementLookupTable[i];
			if(elem.__mouseover__){
				MouseEvent.throw("mouseout", elem, props);
				elem.__mouseover__ = false;
			}
		}
	}

	function packID(id){
		var r = id >> 16,
			g = (id - (r << 8)) >> 8,
			b = id - (r << 16) - (g<<8);
		return {
			r : r,
			g : g,
			b : b
		}
	}

	function unpackID(r, g, b){
		return (r << 16) + (g<<8) + b;
	}
	/**
	 * 查询被点击的元素
	 */
	function findTrigger(e, type){

		var props = getMousePosition.call(this, e),
			x = props.x,
			y = props.y,
			trigger = null;

		var cursor = ((y-1) * ghostCanvas.width + x-1)*4,
			r = ghostImageData.data[cursor],
			g = ghostImageData.data[cursor+1],
			b = ghostImageData.data[cursor+2],
			a = ghostImageData.data[cursor+3],
			id = unpackID(r, g, b);

		if( id && ( a == 255 || a == 0)){
			trigger = elementLookupTable[id-1];

			if(type == 'mouseover' && trigger.__mouseover__){
				return null;
			}
			MouseEvent.throw(type, trigger, props);
		}
		for(var i = 0; i < elementLookupTable.length; i++){
			var elem = elementLookupTable[i];

			if(elem.__mouseover__ && elem != trigger){
				MouseEvent.throw('mouseout', elem, props);
				elem.__mouseover__ = false;
			}
		}
		return trigger;
	}
	
	function initContext(dom){
		if(typeof(dom) == "string"){
			dom = document.getElementById(dom);
		}
		container = dom;
		// dom.addEventListener('click', clickHandler);
		// dom.addEventListener('mousedown', mouseDownHandler);
		// dom.addEventListener('mouseup', mouseUpHandler);
		// dom.addEventListener('mousemove', mouseMoveHandler);
		// dom.addEventListener('mouseout', mouseOutHandler);
		
		clientWidth = dom.width;
		clientHeight = dom.height;
		
		context = dom.getContext('2d');

		//ghost canvas for hit test
		ghostCanvas = document.createElement('canvas');
		ghostCanvas.width = clientWidth;
		ghostCanvas.height = clientHeight;
		ghostCanvasContext = ghostCanvas.getContext('2d');

	}

	function resize(width, height){
		container.width = width;
		container.height = height;

		ghostCanvas.width = width;
		ghostCanvas.height = height;

		clientWidth = width;
		clientHeight = height;
	}
	
	initContext(dom);
	
	return {
		
		'add' : add,
		
		'remove' : remove,
		
		'render' : render,
		
		'initContext' : initContext,

		'resize' : resize,

		'getContext' : function(){return context;},
		
		'getClientWidth' : function(){return clientWidth},
		
		'getClientHeight' : function(){return clientHeight},
		
		'getContainer' : function(){return container},

		'getGhostCanvas' : function(){return ghostCanvas},

		'getGhostContext' : function(){return ghostCanvasContext}
	}
}

/**********************
 * Util methods of GooJS
 *********************/
GooJS.Util = {}

var genGUID = (function(){
	var guid = 0;
	
	return function(){
		return ++guid;
	}
})()

function each(arr, callback, context){
	if( ! arr){
		return;
	}
	if( Array.prototype.forEach ){
		Array.prototype.forEach.call( arr, callback, context );
	}else{
		for( var i = 0; i < arr.length; i++){
			callback.call( context, arr[i], i);
		}
	}
}

function extend(obj){
	each(Array.prototype.slice.call(arguments, 1), function(source, idx){
		if( source ){	
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
    });
    return obj;
}

function trim(str){
	return (str || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
}


function derive(makeDefaultOpt, initialize/*optional*/, proto/*optional*/){

	if( typeof initialize == "object"){
		proto = initialize;
		initialize = null;
	}

	// extend default prototype method
	var extendedProto = {
		// instanceof operator cannot work well,
		// so we write a method to simulate it
		'instanceof' : function(constructor){
			var selfConstructor = sub;
			while(selfConstructor){
				if( selfConstructor === constructor ){
					return true;
				}
				selfConstructor = selfConstructor.__super__;
			}
		}
	}

	var _super = this;

	var sub = function(options){

		// call super constructor
		_super.call( this );

		// call makeDefaultOpt each time
		// if it is a function, So we can make sure each 
		// property in the object is fresh
		extend( this, typeof makeDefaultOpt == "function" ?
						makeDefaultOpt.call(this) : makeDefaultOpt );

		for( var name in options ){
			if( typeof this[name] == "undefined" ){
				console.warn( name+" is not an option");
			}
		}
		extend( this, options );

		if( this.constructor == sub){
			// find the base class, and the initialize function will be called 
			// in the order of inherit
			var base = sub,
				initializeChain = [initialize];
			while(base.__super__){
				base = base.__super__;
				initializeChain.unshift( base.__initialize__ );
			}
			for(var i = 0; i < initializeChain.length; i++){
				if( initializeChain[i] ){
					initializeChain[i].call( this );
				}
			}
		}
	};
	// save super constructor
	sub.__super__ = _super;
	// initialize function will be called after all the super constructor is called
	sub.__initialize__ = initialize;

	// extend prototype function
	extend( sub.prototype, _super.prototype, extendedProto, proto);

	sub.prototype.constructor = sub;
	
	// extend the derive method as a static method;
	sub.derive = _super.derive;


	return sub;
}
/***********************
 * Mouse Event
 * @prop 	cancelBubble
 * @prop 	target
 * @prop 	sourceTarget
 * @prop 	x
 * @prop 	y
 * @prop 	pageX
 * @prop 	pageY
 ***********************/
function MouseEvent(props){

	this.cancelBubble = false;

	extend(this, props);
}

MouseEvent.prototype.stopPropagation = function(){
	
	this.cancelBubble = true;
}

MouseEvent.throw = function(eventType, target, props){

	var e = new MouseEvent(props);
	e.sourceTarget = target;

	// enable bubble
	while(target && !e.cancelBubble ){
		e.target = target;
		target.trigger(eventType, e);

		target = target.parent;
	}
}
/***************************************
 * Event interface
 * + on(eventName, handler)
 * + trigger(eventName[, arg1[, arg2]])
 * + off(eventName[, handler])
 **************************************/
var Event = {
	
	trigger : function(){
		if( ! this.__handlers__){
			return;
		}
		var name = arguments[0];
		var params = Array.prototype.slice.call( arguments, 1 );

		var handlers = this.__handlers__[ name ];
		if( handlers ){
			for( var i = 0; i < handlers.length; i+=2){
				var handler = handlers[i],
					context = handlers[i+1];
				handler.apply(context || this, params);
			}
		}
	},

	on : function( target, handler, context ){

		if( ! target){
			return;
		}
		var handlers = this.__handlers__ || ( this.__handlers__={} );
		if( ! handlers[target] ){
			handlers[target] = [];
		}
		if( handlers[target].indexOf(handler) == -1){
			// struct in list
			// [handler,context,handler,context,handler,context..]
			handlers[target].push( handler );
			handlers[target].push( context );
		}
	},

	off : function( target, handler ){
		
		var handlers = this.__handlers__;

		if( handlers[target] ){
			if( handler ){
				var arr = handlers[target];
				// remove handler and context
				arr.splice( arr.indexOf(handler), 2 )
			}else{
				handlers[target] = [];
			}
		}
	}
}
GooJS.Event = Event;

/******************************************
 * Math Library of GooJS 
 *****************************************/
_Math = {};
GooJS.Math = _Math;

_Math.max = function(array){
	var max = 0;
	for(var i =0; i < array.length; i++){
		if(array[i] > max){
			max = array[i];
		}
	}
	return max;
}
_Math.min = function(array){
	var min = 9999999999;
	for(var i = 0; i < array.length; i++){
		if(array[i] < min){
			min = array[i];
		}
	}
	return min;
}

_Math.computeAABB = function(points){
	var left = points[0][0],
		right = points[0][0],
		top = points[0][1],
		bottom = points[0][1];
	
	for(var i = 1; i < points.length; i++){
		left = points[i][0] < left ? points[i][0] : left;
		right = points[i][0] > right ? points[i][0] : right;
		top = points[i][1] < top ? points[i][1] : top;
		bottom = points[i][1] > bottom ? points[i][1] : bottom;
	}
	return [[left, top], [right, bottom]];
}

_Math.intersectAABB = function(point, AABB){
	var x = point[0],
		y = point[1];
	return  (AABB[0][0] < x && x < AABB[1][0]) && (AABB[0][1] < y && y< AABB[1][1]);
}
var _offset = [0.5, 0.5];
_Math.fixPos = function(pos){
	return _Math.Vector.add(pos, _offset);
}
_Math.fixPosArray = function(poslist){
	var ret = [],
		len = poslist.length;
	for(var i = 0; i < len; i++){
		ret.push( _Math.Vector.add(poslist[i], _offset) );
	}
	return ret;
}

_Math.unfixAA = function(pos){
	return _Math.Vector.sub(pos, [0.5, 0.5]);
}

_Math.Vector = {};

_Math.Vector.add = function(v1, v2){
	
	return [v1[0]+v2[0], v1[1]+v2[1]];
}

_Math.Vector.sub = function(v1, v2){
	
	return [v1[0]-v2[0], v1[1]-v2[1]];
}

_Math.Vector.abs = function(v){
	
	return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
}

_Math.Vector.mul = function(p1, p2){
	return [p1[0]*p2[0], p1[1]*p2[1]];
}

_Math.Vector.scale = function(v, s){
	return [v[0]*s, v[1]*s];
}

_Math.Vector.expand = function(v){
	return [v[0], v[0], 1];
}
/**
 * dot 
 */
_Math.Vector.dot = function(p1, p2){
	return p1[0]*p2[0]+p1[1]*p2[1];
}
/**
 * normalize
 */
_Math.Vector.normalize = function(v){
	var d = _Math.Vector.length(v),
		r = [];
	r[0] = v[0]/d;
	r[1] = v[1]/d;
	return r
}
/**
 * 距离
 */
_Math.Vector.distance = function(v1, v2){
	return this.length(this.sub(v1, v2));
}

_Math.Vector.middle = function(v1, v2){
	return [(v1[0]+v2[0])/2,
			(v1[1]+v2[1])/2];
}


_Math.Matrix = {};

_Math.Matrix.identity = function(){
	return [1, 0, 
			0, 1, 
			0, 0];
}
/**
 * Multiplication of 3x2 matrix
 *	a	c	e
 *	b	d	f
 *	0	0	1
 */
_Math.Matrix.mul = function(m1, m2){
	return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
   ];
}

_Math.Matrix.translate = function(m, v){
	return this.mul([1, 0, 0, 1, v[0], v[1]], m);
}

_Math.Matrix.rotate = function(m, angle){
	var sin = Math.sin(angle),
		cos = Math.cos(angle);
	return this.mul([cos, sin, -sin, cos, 0, 0], m);
}

_Math.Matrix.scale = function(m, v){
	return this.mul([v[0], 0, 0, v[1], 0, 0], m);
}

/**
 * Inverse of 3x3 matrix, from tdl
 * http://code.google.com/p/webglsamples/source/browse/tdl/math.js
 */
_Math.Matrix.inverse = function(m){
	var t00 = m[1*3+1] * m[2*3+2] - m[1*3+2] * m[2*3+1],
		t10 = m[0*3+1] * m[2*3+2] - m[0*3+2] * m[2*3+1],
		t20 = m[0*3+1] * m[1*3+2] - m[0*3+2] * m[1*3+1],
		d = 1.0 / (m[0*3+0] * t00 - m[1*3+0] * t10 + m[2*3+0] * t20);
	return [ d * t00, -d * t10, d * t20,
			-d * (m[1*3+0] * m[2*3+2] - m[1*3+2] * m[2*3+0]),
			d * (m[0*3+0] * m[2*3+2] - m[0*3+2] * m[2*3+0]),
			-d * (m[0*3+0] * m[1*3+2] - m[0*3+2] * m[1*3+0]),
			d * (m[1*3+0] * m[2*3+1] - m[1*3+1] * m[2*3+0]),
			-d * (m[0*3+0] * m[2*3+1] - m[0*3+1] * m[2*3+0]),
			d * (m[0*3+0] * m[1*3+1] - m[0*3+1] * m[1*3+0])];
}
/**
 * Expand a 3x2 matrix to 3x3
 *	a	c	e
 *	b	d	f
 *	0	0	1
 * http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#transformations
 */
_Math.Matrix.expand = function(m){
	return [
		m[0], m[1], 0, 
		m[2], m[3], 0, 
		m[4], m[5], 1
	]
}
/**
 * 矩阵左乘
 */
_Math.Matrix.mulVector = function(m, v){
	var r = [];
	for(var i =0; i < 3; i++){
		r[i] = v[0]*m[i]+v[1]*m[i+3]+v[2]*m[i+6];
	}
	return r;
}
/*************************************
 * Base Element
 ************************************/
GooJS.Element = function(){
	
	//a flag to judge if mouse is over the element
	this.__mouseover__ = false;
	
	this.id = 0;
	// auto generated guid
	this.__GUID__ = genGUID();
	
	//Axis Aligned Bounding Box
	this.AABB = [[0, 0], [0, 0]];
	// z index
	this.z = 0;
	// GooJS.Style
	this.style = null;
	
	this._position = [0, 0],
	this._rotation = 0,
	this._scale = [1, 1];

	this._transform = null;
	// inverse matrix of transform matrix
	this._transformInverse = null;
	// data stored by user
	this._data = {};
	// visible flag
	this.visible = true;

	this.children = {};
	// virtual width of the stroke line for intersect
	this.intersectLineWidth = 0;
}

GooJS.Element.prototype = {
	
	// flag of fill when drawing the element
	fill : true,
	// flag of stroke when drawing the element
	stroke : true,
	// Clip flag
	// If it is true, this element can be used as a mask
	// and all the children will be clipped in its shape
	//
	// TODO: add an other mask flag to distinguish with the clip?
	clip : false,
	// fix aa problem
	// https://developer.mozilla.org/en-US/docs/HTML/Canvas/Tutorial/Applying_styles_and_colors?redirectlocale=en-US&redirectslug=Canvas_tutorial%2FApplying_styles_and_colors#section_8
	fixAA : true,

	// intersect with the bounding box
	intersectAABB : function(x, y){
		return _Math.intersectAABB([x,y], this.AABB);
	},
	// set position on the xy plane
	position : function(x, y){
		this._position = [x, y];
		this.updateTransform();
		// this.updateTransformInverse();
	},
	// set rotation on the xy plane
	rotation : function(angle){
		this._rotation = angle;
		this.updateTransform();
		// this.updateTransformInverse();
	},
	// do scale on the xy plane
	scale : function(v){
		if(typeof v == 'number'){
			v = [v, v];
		}
		this._scale = v;
		this.updateTransform();
		// this.updateTransformInverse();
	},
	updateTransform : function(){
		var M = _Math.Matrix;
		var _transform = M.identity();
		if( this._scale)
			_transform = M.scale(_transform, this._scale);
		if( this._rotation)
			_transform = M.rotate(_transform, this._rotation);
		if( this._position)
			_transform = M.translate(_transform, this._position);
		this._transform = _transform;
		return _transform;
	},

	updateTransformInverse : function(){
		this._transformInverse = _Math.Matrix.inverse(
									_Math.Matrix.expand(this._transform));
	},

	getTransformInverse : function(){
		return this._transformInverse;	
	},

	getTransform : function(){
		if( ! this._transform){
			this.updateTransform();
		}
		return this._transform;
	},

	setTransform : function(m){
		this._transform = m;
		// this.updateTransformInverse();
	},

	pushMatrix : function(m){
		this._transform = _Math.Matrix.mul(m, this._transform);
	},

	popMatrix : function(){
		var t = this._transform;
		this._transform = _Math.Matrix.identity();
		return t;
	},

	getTransformedAABB : function(){
		var point = [],
			M = _Math.Matrix,
			V = _Math.Vector;
		point[0] = M.mulVector(this._transform, V.expand(this.AABB[0]));
		point[1] = M.mulVector(this._transform, V.expand(this.AABB[1]));
		point[2] = M.mulVector(this._transform, [this.AABB[0][0], this.AABB[1][1], 1]);
		point[3] = M.mulVector(this._transform, [this.AABB[1][0], this.AABB[0][1], 1]);
		return _Math.computeAABB(point);
	},

	intersect : function(x, y, ghost){},
	
	draw : function(context){},
	
	computeAABB : function(){},

	add : function(elem){
		if( elem ){
			this.children[elem.__GUID__] = elem;
			elem.parent = this;
		}
	},

	remove : function(elem){
		delete this.children[elem.__GUID__];
		elem.parent = null;
	},

	data : function(key, value){
		if( typeof value == "undefined" ){
			return this._data[key];
		}else{
			this._data[key] = value;
			return this._data[key];
		}
	}
}

extend( GooJS.Element.prototype, Event );
GooJS.Element.derive = derive;

/***********************************************
 * Style
 * @config 	fillStyle | fill,
 * @config 	strokeStyle | stroke,
 * @config	lineWidth,
 * @config	shadowColor,
 * @config	shadowOffsetX,
 * @config	shadowOffsetY,
 * @config	shadowBlur,
 * @config 	globalAlpha | alpha
 * @config	shadow
 **********************************************/
GooJS.Style = function(opt_options){
	
	extend(this, opt_options);
}

GooJS.Style.__STYLES__ = ['fillStyle', 
						'strokeStyle', 
						'lineWidth', 
						'shadowColor', 
						'shadowOffsetX', 
						'shadowOffsetY',
						'shadowBlur',
						'globalAlpha',
						'font'];

GooJS.Style.__STYLEALIAS__ = {			//extend some simplify style name
						 'fill' : 'fillStyle',
						 'stroke' : 'strokeStyle',
						 'alpha' : 'globalAlpha',
						 'shadow' : ['shadowOffsetX', 
						 			'shadowOffsetY', 
						 			'shadowBlur', 
						 			'shadowColor']
						}
var shadowSyntaxRegex = /(.*?)\s+(.*?)\s+(.*?)\s+(rgb\(.*?\))/
GooJS.Style.prototype.bind = function(ctx){

	var styles = GooJS.Style.__STYLES__,
		styleAlias = GooJS.Style.__STYLEALIAS__;
	for( var alias in styleAlias ){
		if( this.hasOwnProperty(alias) ){
			var name = styleAlias[alias];
			var value = this[alias];
			// composite styles, like shadow, the value can be "0 0 10 #000"
			if( name.constructor == Array ){
				var res = shadowSyntaxRegex.exec(trim(value));
				if( ! res )
					continue;
				value = res.slice(1);
				each( value, function(item, idx){
					if( name[idx] ){
						ctx[ name[idx] ] = item;
					}
				}, this)
			}else{
				ctx[ name ] = value;
			}
		}
	}
	each(styles, function(styleName){
		if( this.hasOwnProperty( styleName ) ){
			ctx[styleName] = this[styleName];
		}	
	}, this)

}

/*************************************************
 * Line Shape
 *************************************************/
GooJS.Line = GooJS.Element.derive(function(){
return {
	start : [0, 0],
	end : [0, 0],
	width : 0	//virtual width of the line for intersect computation 
}}, {
computeAABB : function(){

	this.AABB = _Math.computeAABB([this.start, this.end]);
	
	if(this.AABB[0][0] == this.AABB[1][0]){	//line is vertical
		this.AABB[0][0] -= this.width/2;
		this.AABB[1][0] += this.width/2;
	}
	if(this.AABB[0][1] == this.AABB[1][1]){	//line is horizontal
		this.AABB[0][1] -= this.width/2;
		this.AABB[1][1] += this.width/2;
	}
},
draw : function(ctx){
	
	var start = this.fixAA ? _Math.fixPos(this.start) : this.start,
		end = this.fixAA ? _Math.fixPos(this.end) : this.end;

	ctx.beginPath();
	ctx.moveTo(start[0], start[1]);
	ctx.lineTo(end[0], end[1]);
	ctx.stroke();

},
intersect : function(x, y){
	
	if(!this.intersectAABB(x, y)){
		return false;
	}
	//计算投影点
	var V = _Math.Vector,
		a = [x, y]
		b = this.start,
		c = this.end,
		ba = [a[0]-b[0], a[1]-b[1]],
		bc = [c[0]-b[0], c[1]-b[1]],
		dd = V.dot(V.normalize(bc), ba),	//ba在bc上的投影长度
		d = V.add(b, V.scale(V.normalize(bc), dd));		//投影点	
		
		var distance = V.length(V.sub(a, d));
		return distance < this.width/2;
}
});

/**********************************************
 * Rectangle Shape
 ***********************************************/
GooJS.Rectangle = GooJS.Element.derive(function(){
return {
	start 	: [0, 0],
	size 	: [0, 0]
}}, {
computeAABB : function(){
	
	this.AABB = _Math.computeAABB([this.start, _Math.Vector.add(this.start, this.size)]);
},
draw : function(ctx){

	var start = this.fixAA ? _Math.fixPos(this.start) : this.start;

	ctx.beginPath();
	ctx.rect(start[0], start[1], this.size[0], this.size[1]);
	if(this.stroke){
		ctx.stroke();
	}
	if(this.fill){
		ctx.fill();
	}
},
intersect : function(x, y){
	
	return this.intersectAABB(x, y);
}
});
/**************************************************
 * Rounded Rectangle Shape
 **************************************************/
GooJS.RoundedRectangle = GooJS.Element.derive(function(){
return {
	start 	: [0, 0],
	size	: [0, 0],
	radius 	: 0
}}, {
computeAABB : function(){
	this.AABB = _Math.computeAABB([this.start, _Math.Vector.add(this.start, this.size)])
},
draw : function(ctx){

	if( this.radius.constructor == Number){
		// topleft, topright, bottomright, bottomleft
		var radius = [this.radius, this.radius, this.radius, this.radius];
	}else if( this.radius.length == 2){
		var radius = [this.radius[0], this.radius[1], this.radius[0], this.radius[1]];
	}else{
		var radius = this.radius;
	}

	var V = _Math.Vector,
		start = this.fixAA ? _Math.fixPos(this.start) : this.start,
		size = this.size;
	var v1 = V.add(start, [radius[0], 0]),	//left top
		v2 = V.add(start, [size[0], 0]),//right top
		v3 = V.add(start, size),		//right bottom
		v4 = V.add(start, [0, size[1]]);//left bottom
	ctx.beginPath();
	ctx.moveTo( v1[0], v1[1] );
	radius[1] ? 
		ctx.arcTo( v2[0], v2[1], v3[0], v3[1], radius[1]) :
		ctx.lineTo( v2[0], v2[1] );
	radius[2] ?
		ctx.arcTo( v3[0], v3[1], v4[0], v4[1], radius[2]) :
		ctx.lineTo( v3[0], v3[1] );
	radius[3] ?
		ctx.arcTo( v4[0], v4[1], start[0], start[1], radius[3]) :
		ctx.lineTo( v4[0], v4[1] );
	radius[0] ? 
		ctx.arcTo( start[0], start[1], v2[0], v2[1], radius[0]) :
		ctx.lineTo( start[0], start[1]);
	
	if( this.stroke ){
		ctx.stroke();
	}
	if( this.fill ){
		ctx.fill();
	}
},
intersect : function(x, y){
	// TODO
	return false;
}
})

/**************************************************
 * circle
 **************************************************/
GooJS.Circle = GooJS.Element.derive(function(){
return {
	'center' : [0, 0],
	'radius' : 0
}}, {
computeAABB : function(){
	
	this.AABB = [[this.center[0]-this.radius, this.center[1]-this.radius],
				 [this.center[0]+this.radius, this.center[1]+this.radius]]
},
draw : function(ctx){

	var center = this.fixAA ? _Math.fixPos( this.center ) : this.center;

	ctx.beginPath();
	ctx.arc(center[0], center[1], this.radius, 0, 2*Math.PI, false);
	if(this.stroke){
		ctx.stroke();
	}
	if(this.fill){
		ctx.fill();
	}
},
intersect : function(x, y){

	return _Math.Vector.length([this.center[0]-x, this.center[1]-y]) < this.radius;
}
})

/**************************************************
 * Arc shape
 **************************************************/
GooJS.Arc = GooJS.Element.derive(function(){
return {
	center 		: [0, 0],
	radius 		: 0,
	startAngle 	: 0,
	endAngle 	: Math.PI*2,
	clockwise 	: true
}}, {
computeAABB : function(){
	// TODO
	this.AABB = [[0, 0], [0, 0]];
},
draw : function(ctx){

	var center = this.fixAA ? _Math.fixPos( this.center ) : this.center;

	ctx.beginPath();
	ctx.arc(center[0], center[1], this.radius, this.startAngle, this.endAngle,  ! this.clockwise);
	if(this.stroke){
		ctx.stroke();
	}
	if(this.fill){
		ctx.fill();
	}

},
intersect : function(x, y){
	// TODO
	return false;
}
});
/*********************************************
 * Polygon Shape
 ********************************************/
GooJS.Polygon = GooJS.Element.derive(function(){
return {
	'points' : []
}}, {
computeAABB : function(){
	
	this.AABB = _Math.computeAABB(this.points);
},
draw : function(ctx){

	var points = this.fixAA ? _Math.fixPosArray(this.points) : this.points;

	ctx.beginPath();
	
	ctx.moveTo(points[0][0], points[0][1]);
	for(var i =1; i < points.length; i++){
		ctx.lineTo(points[i][0], points[i][1]);
	}
	ctx.closePath();
	if(this.stroke){
		ctx.stroke();
	}
	if(this.fill){
		ctx.fill();
	}
},
intersect : function(x, y){
	
	if(!this.intersectAABB(x, y)){
		return false;
	}

	var len = this.points.length,
		angle = 0,
		V = _Math.Vector,
		points = this.points;
	for(var i =0; i < len; i++){
		var vec1 = V.normalize([points[i][0]-x, points[i][1]-y]),
			j = (i+1)%len,
			vec2 =  V.normalize([points[j][0]-x, points[j][1]-y]),
			foo = Math.acos(V.dot(vec1, vec2));
			
			angle += foo;
	}
	return Math.length(angle - 2*Math.PI) < 0.1;
}
});

/*********************************************
 * Sector Shape
 ********************************************/
GooJS.Sector = GooJS.Element.derive(function(){
return {
	center 		: [0, 0],
	innerRadius : 0,
	outerRadius : 0,
	startAngle 	: 0,
	endAngle 	: 0,
	clockwise 	: true
}},{
computeAABB : function(){

	this.AABB = [0, 0];
},
intersect : function(x, y){

	var V = _Math.Vector,
		startAngle = this.startAngle,
		endAngle = this.endAngle,
		r1 = this.innerRadius,
		r2 = this.outerRadius,
		c = this.center,
		v = V.sub([x, y], c),
		r = V.length(v),
		pi2 = Math.PI * 2;

	if(r < r1 || r > r2){
		return false;
	}
	var angle = Math.atan2(v[1], v[0]);

	//need to constraint the angle between 0 - 360

	if(angle < 0){
		angle = angle+pi2;
	}
	
	if(this.clockwise){
		
		return angle < endAngle && angle > startAngle;
	}else{
		startAngle =  pi2 - startAngle;
		endAngle = pi2 - endAngle;
		return angle > endAngle && angle < startAngle;
	}

},
draw : function(ctx){

	var V = _Math.Vector;
		startAngle = this.startAngle,
		endAngle = this.endAngle,
		r1 = this.innerRadius,
		r2 = this.outerRadius,
		c = this.fixAA ? _Math.fixPos( this.center ) : this.center;

	if( ! this.clockwise ){
		startAngle =  Math.PI*2 - startAngle;
		endAngle =  Math.PI*2 - endAngle;
	}

	var	startInner = V.add(c, [r1 * Math.cos(startAngle), r1 * Math.sin(startAngle)]),
		startOuter = V.add(c, [r2 * Math.cos(startAngle), r2 * Math.sin(startAngle)]),
		endInner = V.add(c, [r1 * Math.cos(endAngle), r1 * Math.sin(endAngle)]),
		endOuter = V.add(c, [r2 * Math.cos(endAngle), r2 * Math.sin(endAngle)]);

	ctx.beginPath();
	ctx.moveTo(startInner[0], startInner[1]);
	ctx.lineTo(startOuter[0], startOuter[1]);
	ctx.arc(c[0], c[1], r2, startAngle, endAngle, ! this.clockwise);
	ctx.lineTo(endInner[0], endInner[1]);
	ctx.arc(c[0], c[1], r1, endAngle, startAngle, this.clockwise);

	if(this.stroke){
		ctx.stroke();
	}
	if(this.fill){
		ctx.fill();
	}

}
});

/*********************************************
 * Path Shape
 *********************************************/
GooJS.Path = GooJS.Element.derive(function(){
return {
	segments 	: [],
	globalStyle : true
}}, {
computeAABB : function(){
	this.AABB = [[0, 0], [0, 0]];
},
draw : function(ctx){
	
	if(this.globalStyle){
		this.drawWithSameStyle(ctx);
	}else{
		this.drawWithDifferentStyle(ctx);
	}
},
drawWithSameStyle : function(ctx){
	
	var l = this.segments.length,
		segs = this.segments;

	ctx.beginPath();
	ctx.moveTo(segs[0].point[0], segs[0].point[1]);
	for(var i =1; i < l; i++){

		if(segs[i-1].handleOut || segs[i].handleIn){
			var prevHandleOut = segs[i-1].handleOut || segs[i-1].point,
				handleIn = segs[i].handleIn || segs[i].point;
			ctx.bezierCurveTo(prevHandleOut[0], prevHandleOut[1],
					handleIn[0], handleIn[1], segs[i].point[0], segs[i].point[1]);
		}
		else{
			ctx.lineTo(segs[i].point[0], segs[i].point[1]);
		}

	}
	if(this.fill){
		ctx.fill();
	}
	if(this.stroke){
		ctx.stroke();
	}	
},
drawWithDifferentStyle : function(ctx){
	
	var l = this.segments.length,
		segs = this.segments;

	for(var i =0; i < l-1; i++){

		ctx.save();
		segs[i].style && segs[i].style.bind(ctx);

		ctx.beginPath();
		ctx.moveTo(segs[i].point[0], segs[i].point[1]);

		if(segs[i].handleOut || segs[i+1].handleIn){
			var handleOut = segs[i].handleOut || segs[i].point,
				nextHandleIn = segs[i+1].handleIn || segs[i+1].point;
			ctx.bezierCurveTo(handleOut[0], handleOut[1],
					nextHandleIn[0], nextHandleIn[1], segs[i+1].point[0], segs[i+1].point[1]);
		}
		else{
			ctx.lineTo(segs[i+1].point[0], segs[i+1].point[1]);
		}

		if(this.stroke){
			ctx.stroke();
		}
		if(this.fill){
			ctx.fill();
		}
		ctx.restore();
	}
},
smooth : function(degree){
	var Vector = _Math.Vector,
		len = this.segments.length,
		middlePoints = [],
		segs = this.segments;

	function computeVector(a, b, c){
		var m = Vector.middle(b, c);
		return Vector.sub(a, m);
	}

	for(var i = 0; i < len; i++){
		var point = segs[i].point,
			nextPoint = (i == len-1) ? segs[0].point : segs[i+1].point;
		middlePoints.push(
				Vector.middle(point, nextPoint));
	}

	for(var i = 0; i < len; i++){
		var point = segs[i].point,
			middlePoint = middlePoints[i],
			prevMiddlePoint = (i == 0) ? middlePoints[len-1] : middlePoints[i-1],
			degree = segs[i].smoothLevel || degree || 1;
		var middleMiddlePoint = Vector.middle(middlePoint, prevMiddlePoint);
			v1 = Vector.sub(middlePoint, middleMiddlePoint),
			v2 = Vector.sub(prevMiddlePoint, middleMiddlePoint);

		var dv = computeVector(point, prevMiddlePoint, middlePoint);
		//use degree to scale the handle length
		segs[i].handleIn = Vector.add(Vector.add(middleMiddlePoint, Vector.scale(v2, degree)), dv);
		segs[i].handleOut = Vector.add(Vector.add(middleMiddlePoint, Vector.scale(v1, degree)), dv);
	}
	segs[0].handleOut = segs[0].handleIn = null;
	segs[len-1].handleIn = segs[len-1].handleOut = null;
	
},
pushPoints : function(points){
	for(var i = 0; i < points.length; i++){
		this.segments.push({
			point : points[i],
			handleIn : null,
			handleOut : null
		})
	}
}
});
/**
 * Image
 */
GooJS.Image = GooJS.Element.derive(function(){
return {
	img 	: '',
	start 	: [0, 0],
	size 	: 0,
	onload 	: function(){}
}}, function(){
	if(typeof this.img == 'string'){
		var self = this;
		GooJS.Image.load( this.img, function(img){
			self.img = img;
			self.onload.call( self );
		})
	}
}, {
computeAABB : function(){

	this.AABB = _Math.computeAABB([this.start, [this.start[0]+this.size[0], this.start[1]+this.size[1]]]);
},
draw : function(ctx){

	var start = this.fixAA ? _Math.fixPos(this.start) : this.start;

	if(typeof this.img != 'string'){
		this.size ? 
			ctx.drawImage(this.img, start[0], start[1], this.size[0], this.size[1]) :
			ctx.drawImage(this.img, start[0], start[1]);
	}

},
intersect : function(x, y){

	return this.intersectAABB(x, y);
}
});

_imageCache = {};

GooJS.Image.load = function( src, callback ){

	if( _imageCache[src] ){
		var img = _imageCache[src];
		if( img.constructor == Array ){
			img.push( callback );
		}else{
			callback(img);
		}
	}else{
		_imageCache[src] = [callback];
		var img = new Image();
		img.onload = function(){
			each( _imageCache[src], function(cb){
				cb( img );
			})
			_imageCache[src] = img;
		}
		img.src = src;
	}
}

/************************************************
 * Text
 ***********************************************/
GooJS.Text = GooJS.Element.derive(function(){

return {
	text 			: '',
	start 			: [0, 0],
	size 			: [0, 0],
	font 			: '',
	textAlign 		: '',
	textBaseline 	: ''
}}, {
computeAABB : function(){

	this.AABB = _Math.computeAABB([this.start, [this.start[0]+this.size[0], this.start[1]+this.size[1]]]);
},
draw : function(ctx){
	var start = this.fixAA ? _Math.fixPos(this.start) : this.start;
	if(this.font){
		ctx.font = this.font;
	}
	if(this.textAlign){
		ctx.textAlign = this.textAlign;
	}
	if(this.textBaseline){
		ctx.textBaseline = this.textBaseline
	}
	if(this.fill){
		this.size.length && this.size[0] ?
			ctx.fillText(this.text, start[0], start[1], this.size[0]) :
			ctx.fillText(this.text, start[0], start[1]);
	}
	if(this.stroke){
		this.size.length && this.size[0] ?
			ctx.strokeText(this.text, start[0], start[1], this.size[0]) :
			ctx.strokeText(this.text, start[0], start[1]);
	}
},
resize : function(ctx){

	if(! this.size[0] || this.needResize){
		this.size[0] = ctx.measureText(this.text).width;
		this.size[1] = ctx.measureText('m').width;
	}
},
intersect : function(x, y){

	return this.intersectAABB(x, y);
}
});
/***********************************
 * Text Box
 * Support word wrap and word break
 * Drawing is based on the GooJS.Text
 * TODO: support word wrap of non-english text
 * 		shift first line by (lineHeight-fontSize)/2
 ***********************************/
GooJS.TextBox = GooJS.Element.derive(function(){
return {
	text 			: '',
	textAlign 		: '',
	textBaseline 	: 'top',
	font			: '',

	start 			: [0, 0],
	width 			: 0,
	wordWrap		: false,
	wordBreak		: false,
	lineHeight 		: 0,
	stroke 			: false,
	// private prop, save GooJS.Text instances
	_texts 			: []
}}, function(){
	// to verify if the text is changed
	this._oldText = "";
}, {
computeAABB : function(){
},
draw : function(ctx){
	if( this.text != this._oldText){
		this._oldText = this.text;

		//set font for measureText
		if( this.font ){
			ctx.font = this.font;
		}
		if( this.wordBreak){
			this._texts = this.computeWordBreak( ctx );
		}
		else if(this.wordWrap){
			this._texts = this.computeWordWrap( ctx );
		}
		else{
			var txt = new GooJS.Text({
				text : this.text,
				textBaseline : this.textBaseline
			})
			this.extendCommonProperties(txt);
			this._texts = [txt]
		}
	}
	each(this._texts, function(_text){
		_text.draw(ctx);
	})
},
computeWordWrap : function( ctx ){
	if( ! this.text){
		return;
	}
	var words = this.text.split(' '),
		len = words.length,
		lineWidth = 0,
		wordWidth,
		wordText,
		texts = [],
		txt;

	for( var i = 0; i < len; i++){
		wordText = i == len-1 ? words[i] : words[i]+' ';
		wordWidth = ctx.measureText( wordText ).width;
		if( lineWidth + wordWidth > this.width ||
			! txt ){	//first line
			// create a new text line and put current word
			// in the head of new line
			txt = new GooJS.Text({
				text : wordText, //append last word
				start : _Math.Vector.add(this.start, [0, this.lineHeight*texts.length])
			})
			this.extendCommonProperties(txt);
			texts.push( txt );

			lineWidth = wordWidth;
		}else{
			lineWidth += wordWidth;
			txt.text += wordText;
		}
	}
	return texts;
},
computeWordBreak : function( ctx ){
	if( ! this.text){
		return;
	}
	var len = this.text.length,
		letterWidth,
		letter,
		lineWidth = ctx.measureText(this.text[0]).width,
		texts = [],
		txt;
	for(var i = 0; i < len; i++){
		letter = this.text[i];
		letterWidth = ctx.measureText( letter ).width;
		if( lineWidth + letterWidth > this.width || 
			! txt ){	//first line
			var txt = new GooJS.Text({
				text : letter,
				start : _Math.Vector.add(this.start, [0, this.lineHeight*texts.length])
			});
			this.extendCommonProperties(txt);
			texts.push(txt);
			// clear prev line states
			lineWidth = letterWidth;
		}else{
			lineWidth += letterWidth;
			txt.text += letter;
		}
	}
	return texts;
},
extendCommonProperties : function(txt){
	var props = {};
	extend(txt, {
		textAlign : this.textAlign,
		textBaseline : this.textBaseline,
		style : this.style,
		font : this.font,
		fill : this.fill,
		stroke : this.stroke
	})
},
intersect : function(x, y){

}
})

});// end of factory function;
//==============================
// Canvas, 
// Use Goo.js as drawing library 
//==============================
define('components/meta/canvas',["goo",
		"knockout",
		"./meta"], function(Goo, ko, Meta){

var Canvas = Meta.derive(function(){

return {

	tag : "canvas",
		
	framerate : ko.observable(0),

	stage : null
}}, {

	type : 'CANVAS',

	css : 'canvas',

	initialize : function(){

		this.stage = Goo.create(this.$el[0]);

		this.framerate.subscribe(function(newValue){
			newValue ?
				this.run( newValue ) :
				this.stop();
		});

		this.afterResize();
	},

	_runInstance : 0,
	run : function( fps ){
		if( this._runInstance ){
			clearTimeout( this._runInstance)
		}
		this._runInstance = setTimeout( this.render.bind(this), 1000 / fps)
	},
	stop : function(){
		clearTimeout( this._runInstance );
		this._runInstance = 0;
	},

	doRender : function(){
		this.stage.render();
	},

	afterResize : function(){
		if( this.stage ){
			var width = this.width(),
				height = this.height();
			if( width && height ){
				this.stage.resize( width, height );
			}
			this.doRender();
		}
	}
});

Meta.provideBinding("canvas", Canvas);

return Canvas;

});
//======================================
// Checkbox component
//======================================
define('components/meta/checkbox',['./meta',
		'knockout'], function(Meta, ko){

var Checkbox = Meta.derive(function(){
return {
	
	// value of the button
	checked : ko.observable(false),
	label : ko.observable("")
	
}}, {

	template : '<input type="checkbox" data-bind="checked:checked" />\
				<span data-bind="css:{checked:checked}"></span>\
				<label data-bind="text:label"></label>',

	type : 'CHECKBOX',
	css : 'checkbox',

	// binding events
	afterRender : function(){
		var self = this;
		this.$el.click(function(){
			self.checked( ! self.checked() );
		})
	}
});

Meta.provideBinding("checkbox", Checkbox);

return Checkbox;

})	;
//===================================
// Combobox component
// 
// @VMProp	value
// @VMProp	items
//			@property	value
//			@property	text
//===================================

define('components/meta/combobox',['./meta',
		'core/xmlparser',
		'knockout'], function(Meta, XMLParser, ko){

var Combobox = Meta.derive(function(){
return {

	$el : $('<div data-bind="css:{active:active}" tabindex="0"></div>'),

	value : ko.observable(),

	items : ko.observableArray(),	//{value, text}

	defaultText : ko.observable("select"),

	active : ko.observable(false),

}}, {
	
	type : 'COMBOBOX',

	css : 'combobox',

	eventsProvided : _.union(Meta.prototype.eventsProvided, "change"),

	initialize : function(){

		this.selectedText = ko.computed(function(){
			var val = this.value();
			var result =  _.filter(this.items(), function(item){
				return ko.utils.unwrapObservable(item.value) == val;
			})[0];
			if( typeof(result) == "undefined"){
				return this.defaultText();
			}
			return ko.utils.unwrapObservable(result.text);
		}, this);

	},

	template : '<div class="qpf-combobox-selected" data-bind="click:_toggle">\
					<div class="qpf-left" data-bind="html:selectedText"></div>\
					<div class="qpf-right qpf-common-button">\
						<div class="qpf-icon"></div>\
					</div>\
				</div>\
				<ul class="qpf-combobox-items" data-bind="foreach:items">\
					<li data-bind="html:text,attr:{\'data-qpf-value\':value},click:$parent._select.bind($parent,value),css:{selected:$parent._isSelected(value)}"></li>\
				</ul>',

	afterRender : function(){

		var self = this;
		this._$selected = this.$el.find(".qpf-combobox-selected");
		this._$items = this.$el.find(".qpf-combobox-items");

		this.$el.blur(function(){
			self._blur();
		})

	},

	//events
	_focus : function(){
		this.active(true);
	},
	_blur : function(){
		this.active(false);
	},
	_toggle : function(){
		this.active( ! this.active() );
	},
	_select : function(value){
		value = ko.utils.unwrapObservable(value);
		this.value(value);
		this._blur();
	},
	_isSelected : function(value){
		return this.value() === ko.utils.unwrapObservable(value);
	}
})

Meta.provideBinding("combobox", Combobox);

XMLParser.provideParser('combobox', function(xmlNode){
	var items = [];
	var nodes = XMLParser.util.getChildrenByTagName(xmlNode, "item");
	_.each(nodes, function(child){
		// Data source can from item tags of the children
		var value = child.getAttribute("value");
		var text = child.getAttribute("text") ||
					XMLParser.util.getTextContent(child);

		if( value !== null){
			items.push({
				value : value,
				text : text
			})
		}
	})
	if( items.length){
		return {
			items : items
		}
	}
})


return Combobox;

});
//======================================
// Label component
//======================================
define('components/meta/label',['./meta',
		'core/xmlparser',
		'knockout'], function(Meta, XMLParser, ko){

var Label = Meta.derive(function(){
return {
	// value of the Label
	text : ko.observable('Label')
	
} }, {

	template : '<Label data-bind="html:text"></Label>',

	type : 'LABEL',

	css : 'label'
});

Meta.provideBinding("label", Label);

// provide parser when do xmlparsing
XMLParser.provideParser("label", function(xmlNode){

	var text = XMLParser.util.getTextContent(xmlNode);
	if(text){
		return {
			text : text
		}
	}
})

return Label;

});
//=================================
// mixin to provide draggable interaction
// support multiple selection
//
// @property	helper
// @property	axis "x" | "y"
// @property	container
// @method		add( target[, handle] )
// @method		remove( target )
//=================================

define('components/mixin/draggable',["core/mixin/derive",
		"core/mixin/event",
		"knockout"], function(Derive, Event, ko){

var clazz = new Function();
_.extend(clazz, Derive);
_.extend(clazz.prototype, Event);

//---------------------------------
var DraggableItem = clazz.derive(function(){
return {

	id : 0,

	target : null,

	handle : null,

	margins : {},

	// original position of the target relative to 
	// its offsetParent, here we get it with jQuery.position method
	originPosition : {},

	// offset of the offsetParent, which is get with jQuery.offset
	// method
	offsetParentOffset : {},
	// cache the size of the draggable target
	width : 0,
	height : 0,
	// save the original css position of dragging target
	// to be restored when stop the drag
	positionType : "",
	//
	// data to be transferred
	data : {},

	// instance of [Draggable]
	host : null
}}, {
	
	setData : function( data ){

	},

	remove : function(){
		this.host.remove( this.target );
	}
});

//--------------------------------
var Draggable = clazz.derive(function(){
return {

	items : {}, 

	axis : null,

	// the container where draggable item is limited
	// can be an array of boundingbox or HTMLDomElement or jquery selector
	container : null,

	helper : null,

	//private properties
	// boundingbox of container compatible with getBoundingClientRect method
	_boundingBox : null,

	_mouseStart : {},
	_$helper : null

}}, {

add : function( elem, handle ){
	
	var id = genGUID(),
		$elem = $(elem);
	if( handle ){
		var $handle = $(handle);
	}

	$elem.attr( "data-qpf-draggable", id )
		.addClass("qpf-draggable");
	
	(handle ? $(handle) : $elem)
		.unbind("mousedown", this._mouseDown)
		.bind("mousedown", {context:this}, this._mouseDown);

	var newItem = new DraggableItem({
		id : id,
		target : elem,
		host : this,
		handle : handle
	})
	this.items[id] = newItem;

	return newItem;
},

remove : function( elem ){

	if( elem instanceof DraggableItem){
		var item = elem,
			$elem = $(item.elem),
			id = item.id;
	}else{
		var $elem = $(elem),
			id = $elem.attr("data-qpf-draggable");
		
		if( id  ){
			var item = this.items[id];
		}
	}	
	delete this.items[ id ];

	
	$elem.removeAttr("data-qpf-draggable")
		.removeClass("qpf-draggable");
	// remove the events binded to it
	(item.handle ? $(item.handle) : $elem)
		.unbind("mousedown", this._mouseDown);
},

clear : function(){

	_.each(this.items, function(item){
		this.remove( item.target );
	}, this);
},

_save : function(){

	_.each(this.items, function(item){

		var $elem = $(item.target),
			$offsetParent = $elem.offsetParent(),
			position = $elem.position(),
			offsetParentOffset = $offsetParent.offset(),
			margin = {
				left : parseInt($elem.css("marginLeft")) || 0,
				top : parseInt($elem.css("marginTop")) || 0
			};

		item.margin = margin;
		// fix the position with margin
		item.originPosition = {
			left : position.left - margin.left,
			top : position.top - margin.top
		},
		item.offsetParentOffset = offsetParentOffset;
		// cache the size of the dom element
		item.width = $elem.width(),
		item.height = $elem.height(),
		// save the position info for restoring after drop
		item.positionType = $elem.css("position");

	}, this);

},

_restore : function( restorePosition ){

	_.each( this.items, function(item){

		var $elem = $(item.target),
			position = $elem.offset();

		$elem.css("position", item.positionType);

		if( restorePosition ){
			$elem.offset({
				left : item.originPosition.left + item.margin.left,
				top : item.originPosition.top + item.margin.top
			})
		}else{
			$elem.offset(position);
		}
	}, this);
},

_mouseDown : function(e){
	
	if( e.which !== 1){
		return;
	}

	var self = e.data.context;
	//disable selection
	e.preventDefault();

	self._save();

	self._triggerProxy("dragstart", e);

	if( ! self.helper ){

		_.each( self.items, function(item){
			
			var $elem = $(item.target);

			$elem.addClass("qpf-draggable-dragging");

			$elem.css({
				"position" : "absolute",
				"left" : (item.originPosition.left)+"px",
				"top" : (item.originPosition.top)+"px"
			});

		}, self);

		if( self.container ){
			self._boundingBox = self._computeBoundingBox( self.container );
		}else{
			self._boundingBox = null;
		}

	}else{

		self._$helper = $(self.helper);
		document.body.appendChild(self._$helper[0]);
		self._$helper.css({
			left : e.pageX,
			top : e.pageY
		})
	}

	$(document.body)
		.unbind("mousemove", self._mouseMove)
		.bind("mousemove", {context:self}, self._mouseMove )
		.unbind("mouseout", self._mouseOut)
		.bind("mouseout", {context:self}, self._mouseOut )
		.unbind('mouseup', self._mouseUp)
		.bind("mouseup", {context:self}, self._mouseUp );

	self._mouseStart = {
		x : e.pageX,
		y : e.pageY
	};

},

_computeBoundingBox : function(container){

	if( _.isArray(container) ){

		return {
			left : container[0][0],
			top : container[0][1],
			right : container[1][0],
			bottom : container[1][1]
		}

	}else if( container.left && 
				container.right &&
				container.top &&
				container.bottom ) {

		return container;
	}else{
		// using getBoundingClientRect to get the bounding box
		// of HTMLDomElement
		try{
			var $container = $(container),
				offset = $container.offset();
			var bb = {
				left : offset.left + parseInt($container.css("padding-left")) || 0,
				top : offset.top + parseInt($container.css("padding-top")) || 0,
				right : offset.left + $container.width() - parseInt($container.css("padding-right")) || 0,
				bottom : offset.top + $container.height() - parseInt($container.css("padding-bottom")) || 0
			};
			
			return bb;
		}catch(e){
			console.error("Invalid container type");
		}
	}

},

_mouseMove : function(e){

	var self = e.data.context;

	self._triggerProxy("drag", e);

	var offset = {
		x : e.pageX - self._mouseStart.x,
		y : e.pageY - self._mouseStart.y
	}

	if( ! self._$helper){

		_.each( self.items, function(item){
			// calculate the offset position to the document
			var left = item.originPosition.left + item.offsetParentOffset.left + offset.x,
				top = item.originPosition.top + item.offsetParentOffset.top + offset.y;
			// constrained in the area of container
			if( self._boundingBox ){
				var bb = self._boundingBox;
				left = left > bb.left ? 
								(left+item.width < bb.right ? left : bb.right-item.width)
								 : bb.left;
				top = top > bb.top ? 
							(top+item.height < bb.bottom ? top : bb.bottom-item.height)
							: bb.top;
			}

			var axis = ko.utils.unwrapObservable(self.axis);
			if( !axis || axis.toLowerCase() !== "y"){
				$(item.target).css("left", left - item.offsetParentOffset.left + "px");
			}
			if( !axis || axis.toLowerCase() !== "x"){
				$(item.target).css("top", top - item.offsetParentOffset.top + "px");
			}

		}, self );


	}else{

		self._$helper.css({
			"left" : e.pageX,
			"top" : e.pageY
		})
	}	
},

_mouseUp : function(e){

	var self = e.data.context;

	$(document.body).unbind("mousemove", self._mouseMove)
		.unbind("mouseout", self._mouseOut)
		.unbind("mouseup", self._mouseUp)

	if( self._$helper ){

		self._$helper.remove();
	}else{

		_.each(self.items, function(item){

			var $elem = $(item.target);

			$elem.removeClass("qpf-draggable-dragging");

		}, self)
	}
	self._restore();

	self._triggerProxy("dragend", e);
},

_mouseOut : function(e){
	// PENDING
	// this._mouseUp.call(this, e);
},

_triggerProxy : function(){
	var args = arguments;
	_.each(this.items, function(item){
		item.trigger.apply(item, args);
	});
}

});


var genGUID = (function(){
	var id = 1;
	return function(){
		return id++;
	}
}) ();

return {
	applyTo : function(target, options){

		// define a namespace for draggable mixin
		target.draggable = target.draggable || {};

		_.extend( target.draggable, new Draggable(options) );
		
	}
}

});
//===================================
// Range component
// 
// @VMProp value
// @VMProp step
// @VMProp min
// @VMProp max
// @VMProp orientation
// @VMProp format
//
// @method computePercentage
// @method updatePosition	update the slider position manually
// @event change newValue prevValue self[Range]
//===================================
define('components/meta/range',['./meta',
		'../mixin/draggable',
		'knockout'], function(Meta, Draggable, ko){

var Range = Meta.derive(function(){

	var ret =  {

		$el : $('<div data-bind="css:orientation"></div>'),

		value : ko.observable(0),

		step : ko.observable(1),

		min : ko.observable(-100),

		max : ko.observable(100),

		orientation : ko.observable("horizontal"),// horizontal | vertical

		precision : ko.observable(0),

		format : "{{value}}",

		_format : function(number){
			return this.format.replace("{{value}}", number);
		},

		// compute size dynamically when dragging
		autoResize : true
	}

	ret.value = ko.observable(1).extend({
		numeric : ret.precision,
		clamp : { 
					max : ret.max,
					min : ret.min
				}
	})
	return ret;

}, {

	type : "RANGE",

	css : 'range',

	template : '<div class="qpf-range-groove-box">\
					<div class="qpf-range-groove-outer">\
						<div class="qpf-range-groove">\
							<div class="qpf-range-percentage"></div>\
						</div>\
					</div>\
				</div>\
				<div class="qpf-range-min" data-bind="text:_format(min())"></div>\
				<div class="qpf-range-max" data-bind="text:_format(max())"></div>\
				<div class="qpf-range-slider">\
					<div class="qpf-range-slider-inner"></div>\
					<div class="qpf-range-value" data-bind="text:_format(value())"></div>\
				</div>',

	eventsProvided : _.union(Meta.prototype.eventsProvided, "change"),
	
	initialize : function(){
		// add draggable mixin
		Draggable.applyTo( this, {
			axis : ko.computed(function(){
				return this.orientation() == "horizontal" ? "x" : "y"
			}, this)
		});

		var prevValue = this.value();
		this.value.subscribe(function(newValue){
			if( this._$box){
				this.updatePosition();
			}
			this.trigger("change", parseFloat(newValue), parseFloat(prevValue), this);
			
			prevValue = newValue;
		}, this);
	},

	afterRender : function(){

		// cache the element;
		this._$box = this.$el.find(".qpf-range-groove-box");
		this._$percentage = this.$el.find(".qpf-range-percentage");
		this._$slider = this.$el.find(".qpf-range-slider");

		this.draggable.container = this.$el.find(".qpf-range-groove-box");
		var item = this.draggable.add( this._$slider );
		
		item.on("drag", this._dragHandler, this);

		this.updatePosition();

		// disable text selection
		this.$el.mousedown(function(e){
			e.preventDefault();
		});
	},

	afterResize : function(){

		this.updatePosition();
		Meta.prototype.afterResize.call(this);
	},

	_dragHandler : function(){

		var percentage = this.computePercentage(),
			min = parseFloat( this.min() ),
			max = parseFloat( this.max() ),
			value = (max-min)*percentage+min;

		this.value( value );

		
	},

	_cacheSize : function(){

		// cache the size of the groove and slider
		var isHorizontal =this._isHorizontal();
		this._boxSize =  isHorizontal ?
							this._$box.width() :
							this._$box.height();
		this._sliderSize = isHorizontal ?
							this._$slider.width() :
							this._$slider.height();
	},

	computePercentage : function(){

		if( this.autoResize ){
			this._cacheSize();
		}

		var offset = this._computeOffset();
		return offset / ( this._boxSize - this._sliderSize );
	},

	_computeOffset : function(){

		var isHorizontal = this._isHorizontal(),
			grooveOffset = isHorizontal ?
							this._$box.offset().left :
							this._$box.offset().top;
			sliderOffset = isHorizontal ? 
							this._$slider.offset().left :
							this._$slider.offset().top;

		return sliderOffset - grooveOffset;
	},

	_setOffset : function(offsetSize){
		var isHorizontal = this._isHorizontal(),
			grooveOffset = isHorizontal ?
							this._$box.offset().left :
							this._$box.offset().top,
			offset = isHorizontal ? 
					{left : grooveOffset+offsetSize} :
					{top : grooveOffset+offsetSize};

		this._$slider.offset( offset );
	},

	updatePosition : function(){
		
		if( ! this._$slider){
			return;
		}
		if( this.autoResize ){
			this._cacheSize();
		}

		var min = this.min(),
			max = this.max(),
			value = this.value(),
			percentage = ( value - min ) / ( max - min ),
		
			size = (this._boxSize-this._sliderSize)*percentage;
		
		if( this._boxSize > 0 ){
			this._setOffset(size);
		}else{	//incase the element is still not in the document
			this._$slider.css( this._isHorizontal() ?
								"right" : "bottom", (1-percentage)*100+"%");
		}
		this._$percentage.css( this._isHorizontal() ?
								'width' : 'height', percentage*100+"%");
	},

	_isHorizontal : function(){
		return ko.utils.unwrapObservable( this.orientation ) == "horizontal";
	}
})

Meta.provideBinding("range", Range);

return Range;

});
//===================================
// Spinner component
//
// @VMProp step
// @VMProp value
// @VMProp precision
//
// @event change newValue prevValue self[Range]
//===================================
define('components/meta/spinner',['./meta',
		'knockout'], function(Meta, ko){

function increase(){
	this.value( parseFloat(this.value()) + parseFloat(this.step()) );
}

function decrease(){
	this.value( parseFloat(this.value()) - parseFloat(this.step()) );
}

var Spinner = Meta.derive(function(){
	var ret = {
		step : ko.observable(1),
		valueUpdate : "afterkeydown", //"keypress" "keyup" "afterkeydown"
		precision : ko.observable(2),
		min : ko.observable(null),
		max : ko.observable(null),
		increase : increase,
		decrease : decrease
	}
	ret.value = ko.observable(1).extend({
		numeric : ret.precision,
		clamp : { 
					max : ret.max,
					min : ret.min
				}
	})
	return ret;
}, {
	type : 'SPINNER',

	css : 'spinner',

	initialize : function(){
		var prevValue = this.value() || 0;
		this.value.subscribe(function(newValue){

			this.trigger("change", parseFloat(newValue), parseFloat(prevValue), this);
			prevValue = newValue;
		}, this)
	},

	eventsProvided : _.union(Meta.prototype.eventsProvided, "change"),

	template : '<div class="qpf-left">\
					<input type="text" class="qpf-spinner-value" data-bind="value:value,valueUpdate:valueUpdate" />\
				</div>\
				<div class="qpf-right">\
					<div class="qpf-common-button qpf-increase" data-bind="click:increase">\
					+</div>\
					<div class="qpf-common-button qpf-decrease" data-bind="click:decrease">\
					-</div>\
				</div>',

	afterRender : function(){
		var self = this;
		// disable selection
		this.$el.find('.qpf-increase,.qpf-decrease').mousedown(function(e){
			e.preventDefault();
		})
		this._$value = this.$el.find(".qpf-spinner-value")
		// numeric input only
		this._$value.keydown(function(event){
			// Allow: backspace, delete, tab, escape and dot
			if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 190 ||
				 // Allow: Ctrl+A
				(event.keyCode == 65 && event.ctrlKey === true) || 
				// Allow: home, end, left, right
				(event.keyCode >= 35 && event.keyCode <= 39)) {
				// let it happen, don't do anything
				return;
			}
			else {
				// Ensure that it is a number and stop the keypress
				if ( event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 ) ) 
				{
					event.preventDefault(); 
				}
	        }
		})

		this._$value.change(function(){
			// sync the value in the input
			if( this.value !== self.value().toString() ){
				this.value = self.value();
			}
		})

	}
})

Meta.provideBinding('spinner', Spinner);

return Spinner;
});
//===================================
// Textfiled component
//
// @VMProp text
// @VMProp placeholder
//
//===================================
define('components/meta/textfield',['./meta',
		'knockout'], function(Meta, ko){

var TextField = Meta.derive(function(){
return {
	
	tag : "div",

	text : ko.observable(""),
		
	placeholder : ko.observable("")

}}, {
	
	type : "TEXTFIELD",

	css : 'textfield',

	template : '<input type="text" data-bind="attr:{placeholder:placeholder}, value:text"/>',

	afterResize : function(){
		this.$el.find("input").width( this.width() );
		Meta.prototype.afterResize.call(this);
	}
})

Meta.provideBinding("textfield", TextField);

return TextField;
});
//============================================
// Base class of all container component
//============================================
define('components/container/container',["../base",
		"knockout"], function(Base, ko){

var Container = Base.derive(function(){
	return {
		// all child components
		children : ko.observableArray()
	}
}, {

	type : "CONTAINER",

	css : 'container',
	
	template : '<div data-bind="foreach:children" class="qpf-children">\
					<div data-bind="qpf_view:$data"></div>\
				</div>',
	initialize : function(){
		var self = this,
			oldArray = this.children().slice();
		this.children.subscribe(function(newArray){
			var differences = ko.utils.compareArrays( oldArray, newArray );
			_.each(differences, function(item){
				// In case the dispose operation is launched by the child component
				if( item.status == "added"){
					item.value.on("dispose", _onItemDispose, item.value);
				}else if(item.status == "deleted"){
					item.value.off("dispose", _onItemDispose);
				}
			}, this);
		});
		function _onItemDispose(){
			self.remove( this );
		}
	},
	// add child component
	add : function( sub ){
		sub.parent = this;
		this.children.push( sub );
	},
	// remove child component
	remove : function( sub ){
		sub.parent = null;
		this.children.remove( sub );
	},
	removeAll : function(){
		_.each(this.children(), function(child){
			this.remove(child);
		}, this);
	},
	children : function(){
		return this.children()
	},
	doRender : function(){
		// do render in the hierarchy from parent to child
		// traverse tree in pre-order
		
		Base.prototype.doRender.call(this);

		_.each(this.children(), function(child){
			child.render();
		})

	},
	// resize when width or height is changed
	afterResize : function(){
		// stretch the children
		if( this.height() ){
			this.$el.children(".qpf-children").height( this.height() );	
		}
		// trigger the after resize event in post-order
		_.each(this.children(), function(child){
			child.afterResize();
		}, this);
		Base.prototype.afterResize.call(this);
	},
	dispose : function(){
		
		_.each(this.children(), function(child){
			child.dispose();
		});

		Base.prototype.dispose.call( this );
	},
	// get child component by name
	get : function( name ){
		if( ! name ){
			return;
		}
		return _.filter( this.children(), function(item){ return item.name === name } )[0];
	}
})

Container.provideBinding = Base.provideBinding;

// modify the qpf bindler
var baseBindler = ko.bindingHandlers["qpf"];
ko.bindingHandlers["qpf"] = {

	init : function(element, valueAccessor, allBindingsAccessor, viewModel){
		
		//save the child nodes before the element's innerHTML is changed in the createComponentFromDataBinding method
		var childNodes = Array.prototype.slice.call(element.childNodes);

		var component = baseBindler.createComponent(element, valueAccessor);

		if( component && component.instanceof(Container) ){
			// hold the renderring of children until parent is renderred
			// If the child renders first, the element is still not attached
			// to the document. So any changes of observable will not work.
			// Even worse, the dependantObservable is disposed so the observable
			// is detached in to the dom
			// https://groups.google.com/forum/?fromgroups=#!topic/knockoutjs/aREJNrD-Miw
			var subViewModel = {
				'__deferredrender__' : true	
			}
			_.extend(subViewModel, viewModel);
			// initialize from the dom element
			for(var i = 0; i < childNodes.length; i++){
				var child = childNodes[i];
				if( ko.bindingProvider.prototype.nodeHasBindings(child) ){
					// Binding with the container's viewModel
					ko.applyBindings(subViewModel, child);
					var sub = Base.getByDom( child );
					if( sub ){
						component.add( sub );
					}
				}
			}
		}
		if( ! viewModel['__deferredrender__']){
			
			component.render();
		}

		return { 'controlsDescendantBindings': true };

	},
	update : function(element, valueAccessor){
		baseBindler.update(element, valueAccessor);
	}
}

Container.provideBinding("container", Container);

return Container;

});
//===================================
// Panel
// Container has title and content
//===================================
define('components/container/panel',["./container",
		"knockout"], function(Container, ko){

var Panel = Container.derive(function(){

return {

	title : ko.observable("")
	
}}, {

	type : 'PANEL',

	css : 'panel',

	template : '<div class="qpf-panel-header">\
					<div class="qpf-panel-title" data-bind="html:title"></div>\
					<div class="qpf-panel-tools"></div>\
				</div>\
				<div class="qpf-panel-body" data-bind="foreach:children" class="qpf-children">\
					<div data-bind="qpf_view:$data"></div>\
				</div>\
				<div class="qpf-panel-footer"></div>',
	
	afterRender : function(){
		var $el = this.$el;
		this._$header = $el.children(".qpf-panel-header");
		this._$tools = this._$header.children(".qpf-panel-tools");
		this._$body = $el.children(".qpf-panel-body");
		this._$footer = $el.children(".qpf-panel-footer");
	},

	afterResize : function(){
		// stretch the body when the panel's height is given
		if( this._$body && this.height() ){
			var headerHeight = this._$header.height();
			var footerHeight = this._$footer.height();

			// PENDING : here use jquery innerHeight method ?because we still 
			// need to consider the padding of body
			this._$body.height( this.$el.height() - headerHeight - footerHeight );
	
		}
		Container.prototype.afterResize.call(this);
	}
})

Container.provideBinding("panel", Panel);

return Panel;

})

;
//===================================
// Window componennt
// Window is a panel wich can be drag
// and close
//===================================
define('components/container/window',["./container",
		"./panel",
		'../mixin/draggable',
		"knockout"], function(Container, Panel, Draggable, ko){

var Window = Panel.derive(function(){

return {

	$el : $('<div data-bind="style:{left:_leftPx, top:_topPx}"></div>'),

	children : ko.observableArray(),
	title : ko.observable("Window"),

	left : ko.observable(0),
	top : ko.observable(0),

	_leftPx : ko.computed(function(){
		return this.left()+"px";
	}, this, {
		deferEvaluation : true
	}),
	_topPx : ko.computed(function(){
		return this.top()+"px";
	}, this, {
		deferEvaluation : true
	})
	
}}, {

	type : 'WINDOW',

	css : _.union('window', Panel.prototype.css),

	initialize : function(){
		Draggable.applyTo( this );
		
		Panel.prototype.initialize.call( this );
	},

	afterRender : function(){
		
		Panel.prototype.afterRender.call( this );

		this.draggable.add( this.$el, this._$header);
		
	}
})

Container.provideBinding("window", Window);

return Window;

});
//============================================
// Tab Container
// Children of tab container must be a panel
//============================================
define('components/container/tab',["./panel",
		"./container",
		"../base",
		"knockout"], function(Panel, Container, Base, ko){

var Tab = Panel.derive(function(){

	var ret = {
			
		actived : ko.observable(0),

		maxTabWidth : 100,

		minTabWidth : 30

	}

	ret.actived.subscribe(function(idx){
		this._active(idx);
	}, this);

	return ret;
}, {

	type : "TAB",

	css : 'tab',

	add : function(item){
		if( item.instanceof(Panel) ){
			Panel.prototype.add.call(this, item);
		}else{
			console.error("Children of tab container must be instance of panel");
		}
		this._active( this.actived() );
	},

	eventsProvided : _.union('change', Container.prototype.eventsProvided),

	initialize : function(){
		// compute the tab value;
		this.children.subscribe(function(){
			this._updateTabSize();
		}, this);

		Panel.prototype.initialize.call(this);
	},

	template : '<div class="qpf-tab-header">\
					<ul class="qpf-tab-tabs" data-bind="foreach:children">\
						<li data-bind="click:$parent.actived.bind($data, $index())">\
							<a data-bind="html:title"></a>\
						</li>\
					</ul>\
					<div class="qpf-tab-tools"></div>\
				</div>\
				<div class="qpf-tab-body">\
					<div class="qpf-tab-views" data-bind="foreach:children" class="qpf-children">\
						<div data-bind="qpf_view:$data"></div>\
					</div>\
				</div>\
				<div class="qpf-tab-footer"></div>',

	afterRender : function(){
		this._updateTabSize();
		// cache the $element will be used
		var $el = this.$el;
		this._$header = $el.children(".qpf-tab-header");
		this._$tools = this._$header.children(".qpf-tab-tools");
		this._$body = $el.children(".qpf-tab-body");
		this._$footer = $el.children('.qpf-tab-footer');

		this._active( this.actived() );
	},

	afterResize : function(){
		this._adjustCurrentSize();
		this._updateTabSize();
		Container.prototype.afterResize.call(this);
	},

	_unActiveAll : function(){
		_.each(this.children(), function(child){
			child.$el.css("display", "none");
		});
	},

	_updateTabSize : function(){
		var length = this.children().length,
			tabSize = Math.floor((this.$el.width()-20)/length);
		// clamp
		tabSize = Math.min(this.maxTabWidth, Math.max(this.minTabWidth, tabSize) );

		this.$el.find(".qpf-tab-header>.qpf-tab-tabs>li").width(tabSize);
	},

	_adjustCurrentSize : function(){

		var current = this.children()[ this.actived() ];
		if( current && this._$body ){
			var headerHeight = this._$header.height(),
				footerHeight = this._$footer.height();

			if( this.height() &&
				this.height() !== "auto" ){
				current.height( this.$el.height() - headerHeight - footerHeight );
			}
			// PENDING : compute the width ???
			if( this.width() == "auto" ){
			}
		}
	},

	_active : function(idx){
		this._unActiveAll();
		var current = this.children()[idx];
		if( current ){
			current.$el.css("display", "block");

			// Trigger the resize events manually
			// Because the width and height is zero when the panel is hidden,
			// so the children may not be properly layouted, We need to force the
			// children do layout again when panel is visible;
			this._adjustCurrentSize();
			current.afterResize();

			this.trigger('change', idx, current);
		}

		this.$el.find(".qpf-tab-header>.qpf-tab-tabs>li")
				.removeClass("actived")
				.eq(idx).addClass("actived");
	}

})

Container.provideBinding("tab", Tab);

return Tab;

});
//===============================================
// base class of vbox and hbox
//===============================================

define('components/container/box',['./container',
		'knockout'], function(Container, ko){

var Box = Container.derive(function(){

return {

}}, {

	type : 'BOX',

	css : 'box',

	initialize : function(){

		this.children.subscribe(function(children){
			this.afterResize();
			// resize after the child resize happens will cause recursive
			// reszie problem
			// _.each(children, function(child){
			// 	child.on('resize', this.afterResize, this);
			// }, this)
		}, this);

		this.$el.css("position", "relative");

		Container.prototype.initialize.call(this);
	},

	_getMargin : function($el){
		return {
			left : parseInt($el.css("marginLeft")) || 0,
			top : parseInt($el.css("marginTop")) || 0,
			bottom : parseInt($el.css("marginBottom")) || 0,
			right : parseInt($el.css("marginRight")) || 0,
		}
	},

	_resizeTimeout : 0,

	afterResize : function(){

		var self = this;
		// put resize in next tick,
		// if multiple child have triggered the resize event
		// it will do only once;
		if( this._resizeTimeout ){
			clearTimeout( this._resizeTimeout );
		}
		this._resizeTimeout = setTimeout(function(){
			self.resizeChildren();
			Container.prototype.afterResize.call(self);
		});

	}

})


// Container.provideBinding("box", Box);

return Box;

});
//===============================================
// vbox layout
// 
// Items of vbox can have flex and prefer two extra properties
// About this tow properties, can reference to flexbox in css3
// http://www.w3.org/TR/css3-flexbox/
// https://github.com/doctyper/flexie/blob/master/src/flexie.js
// TODO : add flexbox support
// 		 align 
//		padding ????
//===============================================

define('components/container/vbox',['./container',
		'./box',
		'knockout'], function(Container, Box, ko){

var vBox = Box.derive(function(){

return {

}}, {

	type : 'VBOX',

	css : 'vbox',

	resizeChildren : function(){

		var flexSum = 0,
			remainderHeight = this.$el.height(),
			childrenWithFlex = [];

			marginCache = [],
			marginCacheWithFlex = [];

		_.each(this.children(), function(child){
			var margin = this._getMargin(child.$el);
			marginCache.push(margin);
			// stretch the width
			// (when align is stretch)
			child.width( this.$el.width()-margin.left-margin.right );

			var prefer = ko.utils.unwrapObservable( child.prefer );

			// item has a prefer size;
			if( prefer ){
				// TODO : if the prefer size is lager than vbox size??
				prefer = Math.min(prefer, remainderHeight);
				child.height( prefer );

				remainderHeight -= prefer+margin.top+margin.bottom;
			}else{
				var flex = parseInt(ko.utils.unwrapObservable( child.flex ) || 1);
				// put it in the next step to compute
				// the height based on the flex property
				childrenWithFlex.push(child);
				marginCacheWithFlex.push(margin);

				flexSum += flex;
			}
		}, this);

		_.each( childrenWithFlex, function(child, idx){
			var margin = marginCacheWithFlex[idx];
			var flex = parseInt(ko.utils.unwrapObservable( child.flex ) || 1),
				ratio = flex / flexSum;
			child.height( Math.floor(remainderHeight*ratio)-margin.top-margin.bottom );	
		})

		var prevHeight = 0;
		_.each(this.children(), function(child, idx){
			var margin = marginCache[idx];
			child.$el.css({
				"position" : "absolute",
				"left" : '0px',	// still set left to zero, use margin to fix the layout
				"top" : prevHeight + "px"
			})
			prevHeight += child.height()+margin.top+margin.bottom;
		})
	}

})


Container.provideBinding("vbox", vBox);

return vBox;

});
//===============================================
// hbox layout
// 
// Items of hbox can have flex and prefer two extra properties
// About this tow properties, can reference to flexbox in css3
// http://www.w3.org/TR/css3-flexbox/
// https://github.com/doctyper/flexie/blob/master/src/flexie.js
//===============================================

define('components/container/hbox',['./container',
		'./box',
		'knockout'], function(Container, Box, ko){

var hBox = Box.derive(function(){

return {

}}, {

	type : 'HBOX',

	css : 'hbox',

	resizeChildren : function(){

		var flexSum = 0,
			remainderWidth = this.$el.width(),
			childrenWithFlex = [],

			marginCache = [],
			marginCacheWithFlex = [];

		_.each(this.children(), function(child, idx){
			var margin = this._getMargin(child.$el);
			marginCache.push(margin);
			// stretch the height
			// (when align is stretch)
			child.height( this.$el.height()-margin.top-margin.bottom );

			var prefer = ko.utils.unwrapObservable( child.prefer );

			// item has a prefer size;
			if( prefer ){
				// TODO : if the prefer size is lager than vbox size??
				prefer = Math.min(prefer, remainderWidth);
				child.width( prefer );

				remainderWidth -= prefer+margin.left+margin.right;
			}else{
				var flex = parseInt(ko.utils.unwrapObservable( child.flex ) || 1);
				// put it in the next step to compute
				// the height based on the flex property
				childrenWithFlex.push(child);
				marginCacheWithFlex.push(margin);

				flexSum += flex;
			}
		}, this);

		_.each( childrenWithFlex, function(child, idx){
			var margin = marginCacheWithFlex[idx];
			var flex = parseInt(ko.utils.unwrapObservable( child.flex ) || 1),
				ratio = flex / flexSum;
			child.width( Math.floor(remainderWidth*ratio)-margin.left-margin.right );	
		})

		var prevWidth = 0;
		_.each(this.children(), function(child, idx){
			var margin = marginCache[idx];
			child.$el.css({
				"position" : "absolute",
				"top" : '0px',
				"left" : prevWidth + "px"
			});
			prevWidth += child.width()+margin.left+margin.right;
		})
	}

})


Container.provideBinding("hbox", hBox);

return hBox;

});
//=============================================
// Inline Layout
//=============================================
define('components/container/inline',["./container",
		"knockout"], function(Container, ko){

var Inline = Container.derive({
}, {

	type : "INLINE",

	css : "inline",

	template : '<div data-bind="foreach:children" class="qpf-children">\
					<div data-bind="qpf_view:$data"></div>\
				</div>\
				<div style="clear:both"></div>'
})

Container.provideBinding("inline", Inline);

return Inline;

});
//=============================================================
// application.js
// 
// Container of the whole web app, mainly for monitor the resize
// event of Window and resize all the component in the app
//=============================================================

define('components/container/application',["./container",
		"knockout"], function(Container, ko){
	
	var Application = Container.derive(function(){

	}, {

		type : "APPLICATION",
		
		css : "application",

		initialize : function(){

			$(window).resize( this._resize.bind(this) );
			this._resize();
		},

		_resize : function(){
			this.width( $(window).width() );
			this.height( $(window).height() );
		}
	})

	Container.provideBinding("application", Application);

	return Application;
});
//====================================
// Base class of all widget component
// Widget is component mixed with meta 
// ,containers and other HTMLDOMElenents
//====================================
define('components/widget/widget',['../base',
		'../meta/meta',
		'../container/container',
		'knockout',
		'ko.mapping'], function(Base, Meta, Container, ko, koMapping){

var Widget = Base.derive(
{

}, {
	type : "WIDGET",

	css : 'widget'

})

//-------------------------------------------
// Handle bingings in the knockout template
Widget.provideBinding = Base.provideBinding;
Widget.provideBinding("widget", Widget);

return Widget;

});
//===================================
// Vector widget
// 
// @VMProp	items
// @VMProp	constrainProportion
// @VMProp	constrainType
// @VMProp	constrainRatio
//===================================
define('components/widget/vector',['./widget',
		'../base',
		'core/xmlparser',
		'knockout',
		'../meta/spinner',
		'../meta/range'], function(Widget, Base, XMLParser, ko){

var Vector = Widget.derive(function(){
return {

	// data source of item can be spinner type
	// or range type, distinguish with type field
	// @field type	spinner | range
	items : ko.observableArray(),

	// set true if you want to constrain the proportions
	constrainProportion : ko.observable(false),

	constrainType : ko.observable("diff"),	//diff | ratio

	_toggleConstrain : function(){
		this.constrainProportion( ! this.constrainProportion() );
	},
	
	// Constrain ratio is only used when constrain type is ratio
	_constrainRatio : [],
	// Constrain diff is only uese when constrain type is diff
	_constrainDiff : [],
	// cache all sub spinner or range components
	_sub : []
}}, {

	type : "VECTOR",

	css : 'vector',

	initialize : function(){
		this.$el.attr("data-bind", 'css:{"qpf-vector-constrain":constrainProportion}')
		// here has a problem that we cant be notified 
		// if the object in the array is updated
		this.items.subscribe(function(item){
			// make sure self has been rendered
			if( this._$list ){
				this._cacheSubComponents();
				this._updateConstraint();
			}
		}, this);

		this.constrainProportion.subscribe(function(constrain){
			if( constrain ){
				this._computeContraintInfo();
			}
		}, this);
	},

	eventsProvided : _.union(Widget.prototype.eventsProvided, "change"),

	template : '<div class="qpf-left">\
					<div class="qpf-vector-link" data-bind="click:_toggleConstrain"></div>\
				</div>\
				<div class="qpf-right" >\
					<ul class="qpf-list" data-bind="foreach:items">\
						<li data-bind="qpf:$data"></li>\
					</ul>\
				</div>',

	afterRender : function(){
		// cache the list element
		this._$list = this.$el.find(".qpf-list");

		this._cacheSubComponents();
		this._updateConstraint();
	},

	afterResize : function(){
		_.each( this._sub, function(item){
			item.afterResize();
		} )
		Widget.prototype.afterResize.call(this);
	},

	dispose : function(){
		_.each(this._sub, function(item){
			item.dispose();
		});
		Base.prototype.dispose.call( this );
	},

	_cacheSubComponents : function(){

		var self = this;
		self._sub = [];

		this._$list.children().each(function(){
			
			var component = Base.getByDom(this);
			self._sub.push( component );
		});

		this._computeContraintInfo();
	},

	_computeContraintInfo : function(){
		this._constrainDiff = [];
		this._constrainRatio = [];
		_.each(this._sub, function(sub, idx){
			var next = this._sub[idx+1];
			if( ! next){
				return;
			}
			var value = sub.value(),
				nextValue = next.value();
			this._constrainDiff.push( nextValue-value);

			this._constrainRatio.push(value == 0 ? 1 : nextValue/value);

		}, this);
	},

	_updateConstraint : function(){

		_.each(this._sub, function(sub){

			sub.on("change", this._constrainHandler, this);
		}, this)
	},

	_constrainHandler : function(newValue, prevValue, sub){

		if(this.constrainProportion()){

			var selfIdx = this._sub.indexOf(sub),
				constrainType = this.constrainType();

			for(var i = selfIdx; i > 0; i--){
				var current = this._sub[i].value,
					prev = this._sub[i-1].value;
				if( constrainType == "diff"){
					var diff = this._constrainDiff[i-1];
					prev( current() - diff );
				}else if( constrainType == "ratio"){
					var ratio = this._constrainRatio[i-1];
					prev( current() / ratio );
				}

			}
			for(var i = selfIdx; i < this._sub.length-1; i++){
				var current = this._sub[i].value,
					next = this._sub[i+1].value;

				if( constrainType == "diff"){
					var diff = this._constrainDiff[i];
					next( current() + diff );
				}else if( constrainType == "ratio"){
					var ratio = this._constrainRatio[i];
					next( current() * ratio );
				}
			}
		}
	}
})

Widget.provideBinding("vector", Vector);

XMLParser.provideParser("vector", function(xmlNode){
	var items = [];
	var children = XMLParser.util.getChildren(xmlNode);
	_.chain(children).filter(function(child){
		var tagName = child.tagName && child.tagName.toLowerCase();
		return tagName && (tagName === "spinner" ||
							tagName === "range");
	}).each(function(child){
		var attributes = XMLParser.util.convertAttributes(child.attributes);
		attributes.type = child.tagName.toLowerCase();
		items.push(attributes);
	})
	if(items.length){
		return {
			items : items
		}
	}
})

return Vector;

});
//============================
// view model for color
// supply hsv and rgb color space
// http://en.wikipedia.org/wiki/HSV_color_space.
//============================
define('components/widget/color_vm',['require','knockout','core/clazz'],function(require){

var	ko = require("knockout"),
	Clazz = require("core/clazz");


function rgbToHsv(r, g, b){
    r = r/255, g = g/255, b = b/255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h*360, s*100, v*100];
}

function hsvToRgb(h, s, v){

	h = h/360;
	s = s/100;
	v = v/100;

    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


function intToRgb(value){
	var r = (value >> 16) & 0xff,
		g = (value >> 8) & 0xff,
		b = value & 0xff;
	return [r, g, b];
}

function rgbToInt(r, g, b){
	return r << 16 | g << 8 | b;
}

function intToHsv(value){
	var rgb = intToRgb(value);
	return rgbToHsv(rgb[0], rgb[1], rgb[2]);
}

function hsvToInt(h, s, v){
	return rgbToInt(hsvToRgb(h, s, v));
}

// hsv to rgb is multiple to one
// dependency relationship
// h,s,v(w)------->rgb(r)----->r,g,b(w)
// r,g,b(w)------->hex(r)
// hex(w)------->hsv(w)
// hex(rw)<------->hexString(rw)
//
// so writing hsv will not result circular update
//
var Color = Clazz.derive({
	//--------------------rgb color space
	_r : ko.observable().extend({numeric:0}),
	_g : ko.observable().extend({numeric:0}),
	_b : ko.observable().extend({numeric:0}),
	//--------------------hsv color space
	_h : ko.observable().extend({clamp:{min:0,max:360}}),
	_s : ko.observable().extend({clamp:{min:0,max:100}}),
	_v : ko.observable().extend({clamp:{min:0,max:100}}),
	alpha : ko.observable(1).extend({numeric:2, clamp:{min:0, max:1}})
}, function(){

	this.hex = ko.computed({
		read : function(){
			return rgbToInt( this._r(), this._g(), this._b() );
		},
		write : function(value){
			var hsv = intToHsv(value);
			this._h(hsv[0]);
			this._s(hsv[1]);
			this._v(hsv[2]);
		}
	}, this);

	// bridge of hsv to rgb
	this.rgb = ko.computed({
		read : function(){
			var rgb = hsvToRgb(this._h(), this._s(), this._v());
			this._r(rgb[0]);
			this._g(rgb[1]);
			this._b(rgb[2]);

			return rgb;
		}
	}, this);

	this.hsv = ko.computed(function(){
		return [this._h(), this._s(), this._v()];
	}, this);

	// set rgb and hsv from hex manually
	this.set = function(hex){
		var hsv = intToHsv(hex);
		var rgb = intToRgb(hex);
		this._h(hsv[0]);
		this._s(hsv[1]);
		this._v(hsv[2]);
		this._r(rgb[0]);
		this._g(rgb[1]);
		this._b(rgb[2]);
	}
	//---------------string of hex
	this.hexString = ko.computed({
		read : function(){
			var string = this.hex().toString(16),
				fill = []
			for(var i = 0; i < 6-string.length; i++){
				fill.push('0');
			}
			return fill.join("")+string;
		},
		write : function(){}
	}, this);

	//-----------------rgb color of hue when value and saturation is 100%
	this.hueRGB = ko.computed(function(){
		return "rgb(" + hsvToRgb(this._h(), 100, 100).join(",") + ")";
	}, this);

	//---------------items data for vector(rgb and hsv)
	var vector = ['_r', '_g', '_b'];
	this.rgbVector = [];
	for(var i = 0; i < 3; i++){
		this.rgbVector.push({
			type : "spinner",
			min : 0,
			max : 255,
			step : 1,
			precision : 0,
			value : this[vector[i]]
		})
	}
	var vector = ['_h', '_s', '_v'];
	this.hsvVector = [];
	for(var i = 0; i < 3; i++){
		this.hsvVector.push({
			type : "spinner",
			min : 0,
			max : 100,
			step : 1,
			precision : 0,
			value : this[vector[i]]
		})
	}
	// modify the hue
	this.hsvVector[0].max = 360;

	// set default 0xffffff
	this.set(0xffffff);
});

Color.intToRgb = intToRgb;
Color.rgbToInt = rgbToInt;
Color.rgbToHsv = rgbToHsv;
Color.hsvToRgb = hsvToRgb;
Color.intToHsv = intToHsv;
Color.hsvToInt = hsvToInt;

return Color;
});
//=============================================
// Palette
//=============================================
define('components/widget/palette',['require','./widget','knockout','./color_vm','components/widget/vector','components/meta/textfield','components/meta/range'],function(require){

var Widget = require("./widget"),
	ko = require("knockout"),
	Color = require("./color_vm");

// component will be used in the widget
require("components/widget/vector");
require("components/meta/textfield");
require("components/meta/range");

var Palette = Widget.derive(function(){
	var ret = new Color;
	var self = this;

	_.extend(ret, {
		_recent : ko.observableArray(),
		_recentMax : 5	
	})
	return ret;
}, {

	type : 'PALETTE',

	css : 'palette',

	eventsProvided : _.union(Widget.prototype.eventsProvided, ['change', 'apply']),

	template : 	'<div class="qpf-palette-adjuster">\
					<div class="qpf-left">\
						<div class="qpf-palette-picksv" data-bind="style:{backgroundColor:hueRGB}">\
							<div class="qpf-palette-saturation">\
								<div class="qpf-palette-value"></div>\
							</div>\
							<div class="qpf-palette-picker"></div>\
						</div>\
						<div class="qpf-palette-pickh">\
							<div class="qpf-palette-picker"></div>\
						</div>\
						<div style="clear:both"></div>\
						<div class="qpf-palette-alpha">\
							<div data-bind="qpf:{type:\'range\', min:0, max:1, value:alpha, precision:2}"></div>\
						</div>\
					</div>\
					<div class="qpf-right">\
						<div class="qpf-palette-rgb">\
							<div data-bind="qpf:{type:\'label\', text:\'RGB\'}"></div>\
							<div data-bind="qpf:{type:\'vector\', items:rgbVector}"></div>\
						</div>\
						<div class="qpf-palette-hsv">\
							<div data-bind="qpf:{type:\'label\', text:\'HSV\'}"></div>\
							<div data-bind="qpf:{type:\'vector\', items:hsvVector}"></div>\
						</div>\
						<div class="qpf-palette-hex">\
							<div data-bind="qpf:{type:\'label\', text:\'#\'}"></div>\
							<div data-bind="qpf:{type:\'textfield\',text:hexString}"></div>\
						</div>\
					</div>\
				</div>\
				<div style="clear:both"></div>\
				<ul class="qpf-palette-recent" data-bind="foreach:_recent">\
					<li data-bind="style:{backgroundColor:rgbString},\
									attr:{title:hexString},\
									click:$parent.hex.bind($parent, hex)"></li>\
				</ul>\
				<div class="qpf-palette-buttons">\
					<div data-bind="qpf:{type:\'button\', text:\'Cancel\', class:\'small\', onclick:_cancel.bind($data)}"></div>\
					<div data-bind="qpf:{type:\'button\', text:\'Apply\', class:\'small\', onclick:_apply.bind($data)}"></div>\
				</div>',

	initialize : function(){
		this.hsv.subscribe(function(hsv){
			this._setPickerPosition();
			this.trigger("change", this.hex());
		}, this);
		// incase the saturation and value is both zero or one, and
		// the rgb value not change when hue is changed
		this._h.subscribe(this._setPickerPosition, this);
	},
	afterRender : function(){
		this._$svSpace = $('.qpf-palette-picksv');
		this._$hSpace = $('.qpf-palette-pickh');
		this._$svPicker = this._$svSpace.children('.qpf-palette-picker');
		this._$hPicker = this._$hSpace.children('.qpf-palette-picker');

		this._svSize = this._$svSpace.height();
		this._hSize = this._$hSpace.height();

		this._setPickerPosition();
		this._setupSvDragHandler();
		this._setupHDragHandler();
	},

	_setupSvDragHandler : function(){
		var self = this;

		var _getMousePos = function(e){
			var offset = self._$svSpace.offset(),
				left = e.pageX - offset.left,
				top = e.pageY - offset.top;
			return {
				left :left,
				top : top
			}
		};
		var _mouseMoveHandler = function(e){
			var pos = _getMousePos(e);
			self._computeSV(pos.left, pos.top);
		}
		var _mouseUpHandler = function(e){
			$(document.body).unbind("mousemove", _mouseMoveHandler)
							.unbind("mouseup", _mouseUpHandler)
							.unbind('mousedown', _disableSelect);
		}
		var _disableSelect = function(e){
			e.preventDefault();
		}
		this._$svSpace.mousedown(function(e){
			var pos = _getMousePos(e);
			self._computeSV(pos.left, pos.top);

			$(document.body).bind("mousemove", _mouseMoveHandler)
							.bind("mouseup", _mouseUpHandler)
							.bind("mousedown", _disableSelect);
		})
	},

	_setupHDragHandler : function(){
		var self = this;

		var _getMousePos = function(e){
			var offset = self._$hSpace.offset(),
				top = e.pageY - offset.top;
			return top;
		};
		var _mouseMoveHandler = function(e){
			self._computeH(_getMousePos(e));
		};
		var _disableSelect = function(e){
			e.preventDefault();
		}
		var _mouseUpHandler = function(e){
			$(document.body).unbind("mousemove", _mouseMoveHandler)
							.unbind("mouseup", _mouseUpHandler)
							.unbind('mousedown', _disableSelect);
		}

		this._$hSpace.mousedown(function(e){
			self._computeH(_getMousePos(e));

			$(document.body).bind("mousemove", _mouseMoveHandler)
							.bind("mouseup", _mouseUpHandler)
							.bind("mousedown", _disableSelect);
		})

	},

	_computeSV : function(left, top){
		var saturation = left / this._svSize,
			value = (this._svSize-top)/this._svSize;

		this._s(saturation*100);
		this._v(value*100);
	},

	_computeH : function(top){

		this._h( top/this._hSize * 360 );
	},

	_setPickerPosition : function(){
		if( this._$svPicker){
			var hsv = this.hsv(),
				hue = hsv[0],
				saturation = hsv[1],
				value = hsv[2];
			// set position relitave to space
			this._$svPicker.css({
				left : Math.round( saturation/100 * this._svSize ) + "px",
				top : Math.round( (100-value)/100 * this._svSize ) + "px"
			})
			this._$hPicker.css({
				top : Math.round( hue/360 * this._hSize) + "px"
			})
		}
	},

	_apply : function(){
		if( this._recent().length > this._recentMax){
			this._recent.shift();
		}
		this._recent.push( {
			rgbString : "rgb(" + this.rgb().join(",") + ")",
			hexString : this.hexString(),
			hex : this.hex()
		});
		
		this.trigger("apply", this.hex());
	},

	_cancel : function(){

	}
})

Widget.provideBinding("palette", Palette);

return Palette;
});
// portal for all the components
define('src/main',["core/xmlparser",
		"core/mixin/derive",
		"core/mixin/event",
		"components/base",
		"components/util",
		"components/meta/button",
		"components/meta/canvas",
		"components/meta/checkbox",
		"components/meta/combobox",
		"components/meta/label",
		"components/meta/meta",
		"components/meta/range",
		"components/meta/spinner",
		"components/meta/textfield",
		"components/container/container",
		"components/container/panel",
		"components/container/window",
		"components/container/tab",
		"components/container/vbox",
		"components/container/hbox",
		"components/container/inline",
		"components/container/application",
		"components/widget/vector",
		"components/widget/widget",
		"components/widget/palette"], function(){

	console.log("qpf is loaded");

	return {
		core : {
			xmlparser : require('core/xmlparser'),
			mixin : {
				derive : require('core/mixin/derive'),
				event : require('core/mixin/event')
			}
		},
		components : {
			base : require('components/base'),
			mixin : {
				draggable : require('components/mixin/draggable')
			},
			meta : {
				meta : require('components/meta/meta'),
				button : require('components/meta/button'),
				checkbox : require('components/meta/checkbox'),
				combobox : require('components/meta/combobox'),
				label : require('components/meta/label'),
				range : require('components/meta/range'),
				spinner : require('components/meta/spinner'),
				textfield : require('components/meta/textfield'),
				canvas : require("components/meta/canvas")
			},
			container : {
				container : require('components/container/container'),
				panel : require('components/container/panel'),
				window : require('components/container/window'),
				tab : require("components/container/tab"),
				vbox : require("components/container/vbox"),
				hbox : require("components/container/hbox"),
				inline : require("components/container/inline"),
				application : require("components/container/application")
			},
			widget : {
				widget : require("components/widget/widget"),
				vector : require("components/widget/vector"),
				palette : require("components/widget/palette")
			}
		}
	}
});
var qpf = require("src/main");

// only export the use method 
_exports.use = function(path){
	return require(path);
}

})