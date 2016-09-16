/*
 App.js - part of bsmap

 Copyright (c) 2016 by Konstantin Kushnir <chpock@gmail.com>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* jslint browser:true */
// disable error in "use strict"; function
/* jslint node:true,eqnull:true */
/*globals L,$ */
"use strict";

function AppClass(){
  var loadedModules = [];
  var eventModules = [];
  var delayexec = {};
  if (window.App) {
  	return window.App;
  } else if (!(this instanceof AppClass)) {
  	return new AppClass();
  }
  this.remoteProtocol = location.protocol === 'file:' ? 'https://' : '//';
  this.localGetScript = function(url, success, fail) {
    var doc = window.document,
        head = doc.head || doc.getElementsByTagName("head")[0],
        script = doc.createElement("script"),
        done = false,
        self = this;
    var _callback = function(callback) {
      script.onload = script.onerror = script.onreadystatechange = null;
      callback.call(self);
    };
    script.type = 'text/javascript';
    script.async = true;
    script.src = url + '?rnd=' + Math.random();
    script.onerror = _callback.bind(this, fail);
    script.onload = script.onreadystatechange = function(){
      var state = this.readyState;
      if (!done && (!state || state === 'complete' || state === 'loaded')) {
        done = true;
        _callback.call(self, success);
      }
    };
    head.appendChild(script);
  };
  this.moduleLoad = function (name, url, mods) {
  	var self = this;
    if (typeof url === 'undefined') {
      url = name;
      name = null;
    }
    this.moduleEvent(mods,function(){
      var done = function(){
        self.moduleLoaded(name);
      };
      var fail = function() {
         console.log('Fail to load module: ' + name);
      };
      if (location.protocol === 'file:') {
        if (url.substr(0,2) === '//') {
          $.getScript('https://' + url.substr(2)).done(done).fail(fail);
        } else if (url.substr(0,7) !== 'http://' && url.substr(0,8) !== 'https://') {
          self.localGetScript(url, done, fail);
        } else {
          $.getScript(url).done(done).fail(fail);
        }
      } else {
        $.getScript(url).done(done).fail(fail);
      }
    });
    return this;
  };
  this.moduleLoaded = function (name) {
//  	console.log('Module loaded:', name);
    if (name) {
  	  loadedModules.push(name);
  	  this.moduleFireEvents();
    }
	  return this;
  };
  this.moduleEvent = function (mods, func, context) {
  	mods = mods == null ? [] : Array.isArray(mods) ? mods : [mods];
//	  console.log('Quered event on mods: [' + mods.toString() + ']');
	  eventModules.push({mods: mods, func: func, context: context});
	  this.moduleFireEvents();
	  return this;
  };
  this.moduleFireEvents = function () {
//  	console.log('===loaded modules: ' + loadedModules.toString());
	 	var i, k, idx;
//	 	var n = [];
	  for (i = eventModules.length - 1; i >= 0; i--) {
	  	if (eventModules[i].deleted) continue;
	  	idx = null;
	    for (k = eventModules[i].mods.length - 1; k >= 0; k--)
	    	if ((idx = loadedModules.indexOf(eventModules[i].mods[k])) === -1) break;
	    if (idx === -1) {
//      	console.log('===failed: ' + idx + ' [' + eventModules[i].mods.toString() + '] on mod: ' + eventModules[i].mods[k]);
//	    	n.push(eventModules[i]);
	    } else {
//	    	console.log('Fire event on mods: [' + eventModules[i].mods.toString() + ']');
	    	eventModules[i].deleted = true;
	    	eventModules[i].func.call(eventModules[i].context);
	    }
	  }
//	  eventModules = n;
    return this;
  };

  this.delayExec = function(id, func, ms, context) {
    var k,
        args = Array.prototype.slice.call(arguments, 4);
    if (!delayexec.hasOwnProperty(id)) {
      delayexec[id] = {};
    } else {
      this.cancelExec(id, context);
    }
    k = setTimeout(function(){
      delete delayexec[id][k];
      func.apply(context, args);
    }, ms);
    delayexec[id][k] = context;
    return this;
  };

  this.cancelExec = function(id, context) {
    if (!delayexec.hasOwnProperty(id)) return this;
    for (var k in delayexec[id])
      if (delayexec[id].hasOwnProperty(k) && (typeof context === 'undefined' || delayexec[id][k] === context)) {
        clearTimeout(k);
        delete delayexec[id][k];
      }
    return this;
  };

  this.delayExecFunc = function(id, func, ms, context) {
    var self = this;
    var args_orig = Array.prototype.slice.call(arguments, 4);
    return function() {
      var args = Array.prototype.slice.call(arguments);
      self.delayExec.apply(self, [id, func, ms, context].concat(args_orig).concat(args));
    };
  };

  this.cancelExecFunc = function(id, context) {
    var self = this;
    return function() {
      self.cancelExec(id, context);
    };
  };

}
AppClass.prototype = {
  constructor: AppClass,
  escapeHTML: function(str) {
    if (typeof str === "string") str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
    return str;
  },
  stripAddress: function(str) {
    var tbl = {
      "улица ":"ул.",
      " улица":" ул.",
      "вулиця ":"вул.",
      " вулиця":" вул.",
      "провулок ":"пров.",
      " провулок":" пров.",
      "переулок ":"пер.",
      " переулок":" пер.",
      "район":"р-н",
      "проспект":"пр-т",
      "бульвар":"б-р"
    };
    var re = new RegExp(Object.keys(tbl).join("|"),"gi");
    return str.replace(re, function(matched){ return tbl[matched]; });
  },
  extend: function (child, proto) {
    child.prototype = Object.create(this === AppClass() ? AppClass() : this.prototype);
	  for (var k in proto) if (proto.hasOwnProperty(k)) child.prototype[k] = proto[k];
	  child.prototype.constructor = child;
	  child.prototype.App = AppClass();
	  child.extend = AppClass().extend;
    child.prototype.parent = this;
  }
};
/*AppClass.extend = function (child, proto) {
  child.prototype = Object.create(this.prototype === AppClass.prototype ? new AppClass() : this.prototype);
  for (var k in proto) if (proto.hasOwnProperty(k)) child.prototype[k] = proto[k];
  child.prototype.constructor = child;
  child.prototype.App = new AppClass();
  child.extend = AppClass.extend;
}; */

window.App = AppClass();