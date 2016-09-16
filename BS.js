/*
 BS.js - part of bsmap

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
/*globals App,google,L,$ */
"use strict";

App.BS = function (options) {
  this.parent.call(this, {
    location: null,
    title: null,
    color: null,
    size: null,
    azimut: null
  }, options);
  if (this.options.title === null) {
    this.updateBSTitle();
    this.options.title = '';
  }
  this.initial = options && options.initial;
};

App.MapObject.extend(App.BS, {
  addToMap: function () {
    if(this.map() && this.options.location) {
      this.marker = L.marker(this.options.location, {
        zIndexOffset: 750,
        clickable: true,
        keyboard: false,
        draggable: true,
        title: this.getTitle()
      }).addTo(this.map());

      this.marker.bindTooltipCustom(this.getTooltipTitle());

      if (this.initial) {
        this.marker.bounce(1);
        delete this.initial;
      }

      this.marker.on('mouseover',function(){
        L.DomUtil.addClass($('#tbl_bs .panel-item')[this.collection.indexOf(this)], 'panel-item-active');
      }, this);

      this.marker.on('mouseout',function(){
        $('#tbl_bs .panel-item-active').each(function(){
          L.DomUtil.removeClass($(this)[0], 'panel-item-active');
        });
      }, this);

      this.marker.on('dragend', function(ev){
        this.options.location = ev.target.getLatLng();
        this.removeFromMapPolygon();
        this.addToMapPolygon();
        this.redrawSidebar();
        this.updateBSTitle();
      }, this);

      this.addToMapPolygon();
    }
    return this;
  },

  addToMapPolygon: function () {
    if(this.map() && this.options.location) {
      var points = [];
      points.push(this.options.location);
      var lat = (this.options.location.lat * Math.PI) / 180;
      var lon = (this.options.location.lng * Math.PI) / 180;
      var d = (parseFloat(this.options.size) || 50.0) / 6378100;
      var azm_start = this.options.azimut - 60;
      var azm_end = this.options.azimut + 60;
      if (azm_start < 0) {
        azm_start = 360 + azm_start;
        azm_end = 360 + azm_end;
      }
      for (var x = azm_start; x <= azm_end; x++) {
        var brng = (x % 360) * Math.PI / 180;
        var destLat = Math.asin(Math.sin(lat)*Math.cos(d) + Math.cos(lat)*Math.sin(d)*Math.cos(brng));
        var destLng = ((lon + Math.atan2(Math.sin(brng)*Math.sin(d)*Math.cos(lat), Math.cos(d)-Math.sin(lat)*Math.sin(destLat))) * 180) / Math.PI;
        destLat = (destLat * 180) / Math.PI;
        points.push(new L.LatLng(destLat, destLng));
      }

  //  var pcolor = jQuery.Color(color).lightness(jQuery.Color(color).lightness()*1.2).toRgbaString();
      this.polygon = L.polygon(points, {
        stroke: true,
        weight: 1,
        color: this.options.color,
        opacity: 0.7,
        fillColor: this.options.color,
        fillOpacity: 0.27,
        clickable: true
      }).addTo(this.map());

      this.polygon.on('mouseover',function(){
        L.DomUtil.addClass($('#tbl_bs .panel-item')[this.collection.indexOf(this)], 'panel-item-active');
      },this);

      this.polygon.on('mouseout',function(){
        $('#tbl_bs .panel-item-active').each(function(){
          L.DomUtil.removeClass($(this)[0], 'panel-item-active');
        });
      },this);

    }
    return this;
  },

  removeFromMap: function () {
    if (this.marker) {
      this.map().removeLayer(this.marker);
      delete this.marker;
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

  updateBSTitle: function() {
    if (!this.core.geocoder) return;
    this.core.geocoder.geocode({
      'latLng': new google.maps.LatLng(this.options.location.lat, this.options.location.lng)
    }, function(self){
      return function(results, status){
        if (status != google.maps.GeocoderStatus.OK) {
          console.log('geocode wrong status: \'' + status);
          return;
        }
        var address_components = [];
        for (var j = 0; j < results[0].address_components.length; j++) {
          if (results[0].address_components[j].types[0] == 'street_number' || results[0].address_components[j].types[0] == 'route')
            address_components.push(self.stripAddress(results[0].address_components[j].short_name));
        }
        if (address_components.length) {
          self.options.title = address_components.join(", ");
          self.marker.setTooltipContent(self.getTooltipTitle());
          self.marker._icon.title = self.getTitle();
          self.redrawSidebar();
        }
      };
    }(this));
  },

  getPanelElement: function (parent) {
    var el;
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
    el.innerHTML = this.getTitle();
    el = L.DomUtil.create('td','panel-column', parent);
    el.style.width = '1.9em';
    el.style.textAlign = 'right';
    el.innerHTML = this.escapeHTML(this.options.azimut);
  },

  getTitle: function () {
    return this.escapeHTML(this.options.title === '' ?
      this.options.location.lat + ', ' + this.options.location.lng : this.options.title);
  },

  getTooltipTitle: function () {
     return 'Адрес: ' + this.getTitle() + '<br>Азимут: ' + this.escapeHTML(this.options.azimut);
  },

  onClickSidebar: function() {
    if (this.map() && this.options.location) this.map().flyTo(this.options.location);
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
