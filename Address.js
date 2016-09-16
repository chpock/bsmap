/*
 Address.js - part of bsmap

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

App.Address = function(options){
  this.parent.call(this, {
    location: null,
    title: ''
  }, options);
  this.initial = options && options.initial;
};
App.MapObject.extend(App.Address, {
  addToMap: function () {
    if(this.map() && this.options.location) {
      this.marker = L.marker(this.options.location, {
        zIndexOffset: 1000,
        clickable: true,
        keyboard: false,
        title: this.getTitle()
      }).addTo(this.map());

      this.marker.bindTooltipCustom(this.getTooltipTitle());

      if (this.initial) {
        this.marker.bounce(1);
        delete this.initial;
      }

      this.marker.on('click', function(e){
        this.cancelExecFunc('buildbs');
        this.core.onClickAddress(this, e);
      }, this);

      this.marker.on('mouseover',function(){
        L.DomUtil.addClass($('#tbl_address .panel-item')[this.collection.indexOf(this)], 'panel-item-active');
      }, this);

      this.marker.on('mouseout',function(){
        $('#tbl_address .panel-item-active').each(function(){
          L.DomUtil.removeClass($(this)[0], 'panel-item-active');
        });
      }, this);
    }
    return this;
  },

  removeFromMap: function () {
    if (this.marker) {
      this.map().removeLayer(this.marker);
      delete this.marker;
    }
    return this;
  },

  getTooltipTitle: function () {
     return 'Адрес: ' + this.getTitle();
  },

  getPanelElement: function (parent) {
    var el = L.DomUtil.create('td', 'panel-column', parent);
    el.innerHTML = this.escapeHTML(this.getTitle());
  },

  onClickSidebar: function() {
    if (this.map() && this.options.location) this.map().flyTo(this.options.location);
  },

  onMouseOverSidebar: function() {
//    console.log('in mouse over');
    if (this.animate_sidebar || !this.marker || this.marker.isBouncing()) return;
/*    var self = this;
    var animate = function() {
      if (self.marker) self.marker.bounce({duration: 500, height: 50});
      self.animate_sidebar = setTimeout(function(){
        animate();
      }, 1000);
    };
    animate(); */
    this.marker.bounce();
  },

  onMouseOutSidebar: function() {
/*    if (this.animate_sidebar) {
      clearTimeout(this.animate_sidebar);
      delete this.animate_sidebar;
    } */
    if (this.marker) this.marker.stopBouncing();
  }

});
