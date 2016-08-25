/*
 Region.js - part of bsmap

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

App.Region = function(options) {
  this.parent.call(this, {
    size: 650,
    color: 0,
    lac: 0,
    cid: 0,
    mnc: 0,
    mcc: 0,
    location_g: null,
    location_y: null,
    location_m: null
  }, options);
  this.initial = options && options.initial;
};

App.MapObject.extend(App.Region, {
  addToMap: function() {
    var icon;
    if(this.map()) {
      var locs = [
        {
          location: this.options.location_g,
          icon_src: 'marker-icon-google',
          marker_var: 'marker_g'
        },{
          location: this.options.location_y,
          icon_src: 'marker-icon-yandex',
          marker_var: 'marker_y'
        },{
          location: this.options.location_m,
          icon_src: 'marker-icon-mozilla',
          marker_var: 'marker_m'
        }
      ];
      var func_mouseover = function(){
        L.DomUtil.addClass($('#tbl_region .panel-item')[this.collection.indexOf(this)], 'panel-item-active');
      };
      var func_mouseout = function(){
        $('#tbl_region .panel-item-active').each(function(){
          L.DomUtil.removeClass($(this)[0], 'panel-item-active');
        });
      };
      for (var i = 0; i < locs.length; i++) {
        if (!locs[i].location) continue;
//            iconRetinaUrl: 'my-icon@2x.png',
//            shadowRetinaUrl: 'my-icon-shadow@2x.png',
        icon = L.icon({
            iconUrl: 'images/' + locs[i].icon_src + '.png',
            shadowUrl: 'images/marker-shadow.png',
            iconSize:    [25, 41],
            iconAnchor:  [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize:  [41, 41]
        });
        this[locs[i].marker_var] = L.marker(locs[i].location, {
          zIndexOffset: 500,
          clickable: true,
          keyboard: false,
          title: '',
          icon: icon
        }).addTo(this.map());
        if (this.initial) {
          this[locs[i].marker_var].bounce(1);
        }
        this[locs[i].marker_var].on('mouseover', func_mouseover, this);
        this[locs[i].marker_var].on('mouseout', func_mouseout, this);
      }
      delete this.initial;
      this.addToMapPolygon();
    }
    return this;
  },

  addToMapPolygon: function () {
    var polys = [];
    var drawCircle = function (point) {
      if (!point) return [];
      var d2r = Math.PI / 180;
      var r2d = 180 / Math.PI;
      var points = 32;
      var rlat = ((parseFloat(this.options.size) || 50.0) / 6378100) * r2d;
      var rlng = rlat / Math.cos(point.lat * d2r);
      var extp = [];
      var start = 0, end = points + 1, ex, ey, theta;
      for (var i = start; i < end; i += 1) {
        theta = Math.PI * (i / (points / 2));
        ey = point.lng + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
        ex = point.lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
        extp.push(new L.LatLng(ex, ey));
      }
      return extp;
    };
    if(this.map()) {
      var points = [];
      if (this.options.location_g) points.push(drawCircle.call(this, this.options.location_g));
      if (this.options.location_y) points.push(drawCircle.call(this, this.options.location_y));
      if (this.options.location_m) points.push(drawCircle.call(this, this.options.location_m));
      if (points.length) {
        this.polygon = L.polygon(points, {
          stroke: true,
          weight: 1,
          color: this.options.color,
          opacity: 0.7,
          fillColor: this.options.color,
          fillOpacity: 0.27,
          clickable: true,
          fillRule: 'nonzero'
        }).addTo(this.map());

        this.polygon.on('mouseover',function(){
          L.DomUtil.addClass($('#tbl_region .panel-item')[this.collection.indexOf(this)], 'panel-item-active');
        },this);

        this.polygon.on('mouseout',function(){
          $('#tbl_region .panel-item-active').each(function(){
            L.DomUtil.removeClass($(this)[0], 'panel-item-active');
          });
        },this);

      }
    }
    return this;
  },

  removeFromMap: function () {
    if (this.marker_g) {
      this.map().removeLayer(this.marker_g);
      delete this.marker_g;
    }
    if (this.marker_y) {
      this.map().removeLayer(this.marker_y);
      delete this.marger_y;
    }
    if (this.marker_m) {
      this.map().removeLayer(this.marker_m);
      delete this.marker_m;
    }
    this.removeFromMapPolygon();
    return this;
  },

  removeFromMapPolygon: function () {
    if (this.polygon) {
      this.map().removeLayer(this.polygon);
      delete this.polygon;
    }
    return this;
  },

  getPanelElement: function (parent) {
    var el, img;
    el = L.DomUtil.create('td','panel-column', parent);
    el.style.width = '17px';
    if (!this.deleted) {
      var dec = L.DomUtil.create('img', 'panel-item-close', el);
      dec.src = 'images/left.png';
      dec.style.padding = '0px 1px 0px 0px';
      var inc = L.DomUtil.create('img', 'panel-item-close', el);
      inc.src = 'images/right.png';
      L.DomEvent
        .addListener(dec, 'click', L.DomEvent.stopPropagation)
        .addListener(dec, 'click', L.DomEvent.preventDefault)
        .addListener(dec, 'click', function(ev) {
          if ((this.options.size -= 50) < 50) this.options.size = 50;
          this.removeFromMapPolygon();
          this.addToMapPolygon();
          this.redrawSidebar();
        }, this);
      L.DomEvent
        .addListener(inc, 'click', L.DomEvent.stopPropagation)
        .addListener(inc, 'click', L.DomEvent.preventDefault)
        .addListener(inc, 'click', function(ev) {
          if ((this.options.size += 50) > 5000) this.options.size = 5000;
          this.removeFromMapPolygon();
          this.addToMapPolygon();
          this.redrawSidebar();
        }, this);
    }
    el = L.DomUtil.create('td', 'panel-column', parent);
    el.style.width = '12px';
    el.style.paddingRight = '5px';
    img = L.DomUtil.create('img', '', el);
    img.src = 'images/' + this.options.mcc + '-' + this.options.mnc + '.png';
    img.style.width = '12px';
    img.style.height = '12px';
    el = L.DomUtil.create('td', 'panel-column', parent);
    el.innerHTML = this.getTitle();
    el = L.DomUtil.create('td', '', parent);
    el.style.width = '12px';
    el = L.DomUtil.create('div', 'panel-region-source ' + (this.options.location_g ? 'panel-region-source-ok' : 'panel-region-source-error'), el);
    el.innerHTML = 'G';
    el = L.DomUtil.create('td', '', parent);
    el.style.width = '12px';
    el = L.DomUtil.create('div', 'panel-region-source ' + (this.options.location_y ? 'panel-region-source-ok' : 'panel-region-source-error'), el);
    el.innerHTML = 'Y';
    el = L.DomUtil.create('td', '', parent);
    el.style.width = '12px';
    el = L.DomUtil.create('div', 'panel-region-source ' + (this.options.location_m ? 'panel-region-source-ok' : 'panel-region-source-error'), el);
    el.innerHTML = 'M';
  },

  getTitle: function () {
    return 'Lac: ' + this.escapeHTML(this.options.lac) + ' / Cellid: ' + this.escapeHTML(this.options.cid);
  },

  setLocation: function (key, val) {
    this.removeFromMap();
    this.options[key] = val;
    this.initial = true;
    this.addToMap();
    this.redrawSidebar();
  },

  onClickSidebar: function() {
    if (this.map()) {
      if (this.options.location_g) {
        this.map().flyTo(this.options.location_g);
      } else if (this.options.location_y) {
        this.map().flyTo(this.options.location_y);
      } else if (this.options.location_m) {
        this.map().flyTo(this.options.location_m);
      }
    }
  },

  onMouseOverSidebar: function() {
    if (this.animate_sidebar || !this.polygon) return;
    var self = this;
    var animate = function(direction) {
      if (self.polygon) {
        self.polygon.setStyle({fillOpacity: self.polygon.options.fillOpacity*(1.0+0.18*direction)});
        direction = self.polygon.options.fillOpacity < 0.27*0.3 ? 1 : self.polygon.options.fillOpacity > 0.27*1.9 ? -1 : direction;
      }
      self.animate_sidebar = setTimeout(function(){
        animate(direction);
      }, 40);
    };
    animate(1);
  },

  onMouseOutSidebar: function() {
    if (this.animate_sidebar) {
      clearTimeout(this.animate_sidebar);
      if (this.polygon) {
        this.polygon.setStyle({fillOpacity: 0.27});
      }
      delete this.animate_sidebar;
    }
  }

});

