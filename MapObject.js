/*
 MapObject.js - part of bsmap

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
/* jslint node:true */
/*globals App */
"use strict";

App.MapObject = function (defopts, initopts){
  this.options = defopts;
  this.loadFromObject(initopts);
};

App.extend(App.MapObject, {
  saveToObject: function(){
    return this.options;
  },
  loadFromObject: function(obj){
    this.removeFromMap();
    if (typeof obj !== 'undefined') {
      for (var k in this.options) {
        if (obj.hasOwnProperty(k)) {
          this.options[k] = obj[k];
        }
      }
    }
    this.addToMap();
    return this;
  },
  map: function () {
     return this.collection ? this.collection.options.map : undefined;
  },
  redrawSidebar: function() {
    if (this.collection) this.collection.redrawSidebar();
  },
// child functions
  getTitle: function () {
     return this.escapeHTML(this.options.title);
  },
  removeFromMap: function () {
    return this;
  },
  addToMap: function () {
    return this;
  },
  getPanelElement: function () {
  },
  onClickSidebar: function() {
  },
  onMouseOverSidebar: function() {
  },
  onMouseOutSidebar: function() {
  }
});
