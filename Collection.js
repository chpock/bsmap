/*
 Collection.js - part of bsmap

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
/*globals App,L,$ */
"use strict";

App.Collection = function (opts){
  this.objects = [];
  this.deleted = [];
  this.options = {
    map: null,
    sidebar: null,
    save_id: null,
    objects: null
  };
  for (var k in this.options) {
    if (this.options.hasOwnProperty(k) && opts.hasOwnProperty(k)) this.options[k] = opts[k];
  }
};

App.extend(App.Collection, {
  item: function (i) {
    return this.objects[i];
  },
  new: function (opts, lockredraw) {
    return this.push(new this.options.objects(opts), lockredraw);
  },
  push: function (item, lockredraw) {
    item.removeFromMap();
    this.objects.push(item);
    this.deleted.push(false);
    item.collection = this;
    item.addToMap();
    if (!lockredraw) this.redrawSidebar();
    return item;
  },
  undelete: function (item, lockredraw) {
    this.deleted[this.indexOf(item)] = false;
    delete item.deleted;
//    item.collection = this;
    item.addToMap();
    if (!lockredraw) this.redrawSidebar();
    return item;
  },
  delete: function (item, lockredraw) {
    item.removeFromMap();
    item.deleted = true;
//    delete item.collection;
    this.deleted[this.indexOf(item)] = true;
//    this.objects.splice(this.indexOf(item),1);
    if (!lockredraw) this.redrawSidebar();
    return item;
  },
  indexOf: function (item) {
    for (var i = this.objects.length - 1; i >= 0; i--)
      if (this.objects[i] === item) return i;
    throw new Error('indexOf: item not in collection.');
  },
  emptify: function (lockredraw) {
//    console.log('emptify ' + this.options.save_id);
    for (var i = this.objects.length - 1; i >= 0; i--) {
      this.delete(this.objects[i], true);
    }
    this.deleted = [];
    this.objects = [];
    if (!lockredraw) this.redrawSidebar();
    return this;
  },
  loadFromStorage: function() {
//    console.log('loadFromStorage ' + this.options.save_id);
    if ($.localStorage.isSet(this.options.save_id) && !$.localStorage.isEmpty(this.options.save_id)) {
      this.loadFromObject($.localStorage.get(this.options.save_id));
    } else {
      this.emptify(true);
    }
    return this;
  },
  saveToStorage: function() {
//    console.log('saveToStorage ' + this.options.save_id);
    $.localStorage.set(this.options.save_id, this.saveToObject());
    return this;
  },
  loadFromObject: function (objs) {
//    console.log('loadFromObject ' + this.options.save_id);
    this.emptify(true);
    for (var i = 0; i < objs.length; i++)
      this.new(objs[i], true);
    this.redrawSidebar(true);
    return this;
  },
  saveToObject: function () {
//    console.log('saveToObject ' + this.options.save_id);
    var save_data = [];
    for (var i = 0; i < this.objects.length; i++) {
      if (!this.deleted[i]) save_data.push(this.objects[i].saveToObject());
    }
    return save_data;
  },
  redrawSidebar: function (locksave) {
    if (this.options.sidebar) {
      var el, i, line, icon, func;
      while(this.options.sidebar.lastChild) this.options.sidebar.removeChild(this.options.sidebar.lastChild);
      for (i = 0; i < this.objects.length; i++) {
        line = L.DomUtil.create('tr', this.deleted[i] ? 'panel-item deleted' : 'panel-item', this.options.sidebar);
        el = L.DomUtil.create('td','panel-column', line);
        el.style.width = '1.5em';
        el.innerHTML = i+1 + '.';
        this.objects[i].getPanelElement(line);
        el = L.DomUtil.create('td','panel-column', line);
        el.style.width = '13px';
        icon = L.DomUtil.create('div', 'panel-item-delete' + (this.deleted[i] ? ' panel-item-undo' : ''), el);
        if (this.deleted[i]) {
          L.DomEvent
            .addListener(icon, 'click', L.DomEvent.stopPropagation)
            .addListener(icon, 'click', L.DomEvent.preventDefault)
            .addListener(icon, 'click', function(ev) {
              this.collection.undelete(this);
            }, this.objects[i]);
        } else {
          L.DomEvent
            .addListener(icon, 'click', L.DomEvent.stopPropagation)
            .addListener(icon, 'click', L.DomEvent.preventDefault)
            .addListener(icon, 'click', function(ev) {
              this.collection.delete(this);
            }, this.objects[i]);
          L.DomEvent.addListener(line, 'click', this.objects[i].onClickSidebar, this.objects[i]);
          L.DomEvent.addListener(line, 'mouseover', (function(o, self){
            return function() {
              self.cancelExec('mouseout', o);
              self.delayExec('mouseover', function(){
                if (this.hasOwnProperty('__mouseOverMe')) return;
                this.__mouseOverMe = true;
                this.onMouseOverSidebar();
              }, 300, o);
            };
          })(this.objects[i], this));
          L.DomEvent.addListener(line, 'mouseout', (function(o, self){
            return function() {
              self.cancelExec('mouseover', o);
              self.delayExec('mouseout', function(){
                if (!this.hasOwnProperty('__mouseOverMe')) return;
                delete this.__mouseOverMe;
                this.onMouseOutSidebar();
              }, 300, o);
            };
          })(this.objects[i], this));
        }
      }
    }
    if (!locksave) this.saveToStorage();
    return this;
  }
});
