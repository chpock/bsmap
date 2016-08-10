/*
 Saves.js - part of bsmap

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
/*globals App,noty,L,$ */

"use strict";

App.Saves = function (options){
  this.parent.call(this, {
    title: '',
    center: null,
    zoom: null,
    data: {},
    current: null
  }, options);
};

App.MapObject.extend(App.Saves, {

  getPanelElement: function (parent) {
    var el;
    el = L.DomUtil.create('td','panel-column', parent);
    el.style.width = '12px';
    if (this.options.current && !this.deleted) {
      L.DomUtil.create('img', 'panel-item-close', el).src = 'images/save-active.png';
    }
    el = L.DomUtil.create('td', 'panel-column', parent);
    el.innerHTML = this.escapeHTML(this.options.title);
    if (this.options.current && !this.deleted) {
      el.style.backgroundColor = '';
      L.DomUtil.addClass(el, 'save-active');
    }
  },

  getCurrentMapState: function() {
    this.options.data = {};
    for (var k in this.core.collection) {
      if (!this.core.collection.hasOwnProperty(k) || k === 'save') continue;
      this.options.data[k] = this.core.collection[k].saveToObject();
    }
    this.options.center = this.core.map.getCenter();
    this.options.zoom = this.core.map.getZoom();
    this.options.current = true;
    if (this.collection) this.collection.currentUpdate(this);
  },

  setCurrentMapState: function() {
    this.options.current = true;
    for (var k in this.core.collection) {
      if (!this.core.collection.hasOwnProperty(k) || k === 'save') continue;
      if (this.options.data[k]) {
        this.core.collection[k].loadFromObject(this.options.data[k]);
        this.core.collection[k].saveToStorage();
      }
    }
    if (this.options.center) this.core.map.flyTo(this.options.center, this.options.zoom);
    if (this.collection) {
      this.collection.currentUpdate(this);
      this.collection.redrawSidebar();
    }
    return this;
  },

  onClickSidebar: function() {
    noty({
      text: 'Вы действительно хотите загрузить карту с именем "' + this.escapeHTML(this.options.title) + '"?',
      type: 'confirm',
      timeout: false,
      layout: 'center',
      theme: 'bsmap',
      modal: true,
      buttons: [
        {
          addClass: 'btn btn-primary',
          text: 'Загрузить',
          onClick: (function(self){
            return function($noty) {
              $noty.close();
              self.setCurrentMapState();
              noty({
                text: 'Карта успешно загружена.',
                type: 'success',
                timeout: 2000,
                layout: 'center'
              });
            };
          })(this)
        },{
          addClass: 'btn btn-danger',
          text: 'Отмена',
          onClick: function($noty) {
            noty({
              text: 'Вы отказались от загрузки карты',
              type: 'warning',
              timeout: 2000,
              layout: 'center'
            });
            $noty.close();
          }
        }
      ]
    });
  }
});

App.CollectionSaves = function (options){
  this.parent.call(this, options);
};
App.Collection.extend(App.CollectionSaves, {
  currentUpdate: function(item) {
    if (item && item.options.current && !item.deleted) {
      for (var i = this.objects.length - 1; i >= 0; i--)
        if (this.objects[i] !== item) this.objects[i].options.current = false;
    }
    if (this.currentGet()) {
      L.DomUtil.removeClass($('#save-button')[0], 'save-button-disabled');
    } else {
      L.DomUtil.addClass($('#save-button')[0], 'save-button-disabled');
    }
    return this;
  },
  currentGet: function() {
    for (var i = this.objects.length - 1; i >= 0; i--)
      if (this.objects[i].options.current && !this.deleted[i]) return this.objects[i];
    return;
  },
  currentReset: function() {
    for (var i = this.objects.length - 1; i >= 0; i--)
      this.objects[i].options.current = false;
    this.currentUpdate();
    this.redrawSidebar();
  }
});


