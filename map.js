/* jslint browser:true */
/* jslint sub:true */

// disable error in "use strict"; function
/* jslint node:true */

// disable error in global leaflet object 'L'
/*global L */
/*global $ */
/*global google */
/*global noty */
/*global jcE */
"use strict";

var UtilsMapBS = {
  extend: function (parent, child, proto) {
     child.prototype = Object.create(parent.prototype);
     child.prototype.constructor = child;
     for (var k in proto) if (proto.hasOwnProperty(k)) child.prototype[k] = proto[k];
  },

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

  delayExecution: function(id, func, ms, context) {
    var k, args, self = this;
    if (!this.delayexec) this.delayexec = {};
    if (!this.delayexec.hasOwnProperty(id)) {
      this.delayexec[id] = {};
    } else {
      for (k in this.delayexec[id])
        if (this.delayexec[id][k] == context) {
          clearTimeout(k);
          delete this.delayexec[id][k];
        }
    }
    args = Array.prototype.slice.call(arguments, 4);
    k = setTimeout(function(){
      delete self.delayexec[id][k];
      func.apply(context, args);
    }, ms);
    this.delayexec[id][k] = context;
  },

  cancelExecution: function(id, context) {
    var k;
    if (this.delayexec && this.delayexec.hasOwnProperty(id)) {
      for (k in this.delayexec[id])
        if (typeof context === 'undefined' || this.delayexec[id][k] == context) {
          clearTimeout(k);
          delete this.delayexec[id][k];
        }
    }
  },

  delayExecutionFunc: function(id, func, ms, context) {
    var self = this;
    return function() {
      var args = Array.prototype.slice.call(arguments);
      self.delayExecution.apply(self, [id, func, ms, context].concat(args));
    };
  },

  cancelExecutionFunc: function(id, context) {
    var self = this;
    return function() {
      self.cancelExecution(id, context);
    };
  }

};

function ObjectMapBS(defopts, initopts){
  this.options = defopts;
  this.loadFromObject(initopts);
}
ObjectMapBS.prototype = {
  constructor: ObjectMapBS,
  saveToObject: function(){
    return this.options;
  },
  loadFromObject: function(obj){
    this.removeFromMap();
    if (typeof obj !== 'undefined') {
      for (var k in this.options) {
        if (obj.hasOwnProperty(k)) {
          this.options[k] = obj[k];
        } else {
          this.options[k] = null;
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
};

function ObjectBS (options) {
  ObjectMapBS.call(this, {
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
}
UtilsMapBS.extend(ObjectMapBS, ObjectBS, {
  addToMap: function () {
    if(this.map() && this.options.location) {
      this.marker = L.marker(this.options.location, {
        clickable: true,
        keyboard: false,
        draggable: true,
        title: this.options.title
      }).addTo(this.map());

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
      var d = parseFloat(this.options.size) / 6378100;
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
    if (this.marker) this.map().removeLayer(this.marker);
    this.removeFromMapPolygon();
    return this;
  },

  removeFromMapPolygon: function () {
    if (this.polygon) this.map().removeLayer(this.polygon);
    return this;
  },

  updateBSTitle: function() {
    if (!UtilsMapBS.geocoder) return;
    var self = this;
    UtilsMapBS.geocoder.geocode({'latLng': new google.maps.LatLng(this.options.location.lat, this.options.location.lng)}, function(self){
      return function(results, status){
        if (status != google.maps.GeocoderStatus.OK) {
          console.log('geocode wrong status: \'' + status);
          return;
        }
        var address_components = [];
        for (var j = 0; j < results[0].address_components.length; j++) {
          if (results[0].address_components[j].types[0] == 'street_number' || results[0].address_components[j].types[0] == 'route')
            address_components.push(UtilsMapBS.stripAddress(results[0].address_components[j].short_name));
        }
        if (address_components.length) {
          self.options.title = address_components.join(", ");
          self.redrawSidebar();
        }
      };
    }(this));
  },

  getPanelElement: function (parent) {
    var el;
    el = L.DomUtil.create('td','panel-column', parent);
    el.style.width = '17px';
    var dec = L.DomUtil.create('img', 'panel-item-close', el);
    dec.src = 'images/left.png';
    dec.style.padding = '0px 1px 0px 0px';
    var inc = L.DomUtil.create('img', 'panel-item-close', el);
    inc.src = 'images/right.png';
    el = L.DomUtil.create('td', 'panel-column', parent);
    if (this.options.title === '') {
      el.innerHTML = UtilsMapBS.escapeHTML(this.options.location.lat + ', ' + this.options.location.lng);
    } else {
      el.innerHTML = UtilsMapBS.escapeHTML(this.options.title);
    }
    el = L.DomUtil.create('td','panel-column', parent);
    el.style.width = '1.9em';
    el.style.textAlign = 'right';
    el.innerHTML = UtilsMapBS.escapeHTML(this.options.azimut);
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
    return el;
  },

  onClickSidebar: function() {
    if (this.map() && this.options.location) this.map().flyTo(this.options.location);
  },
  onMouseOverSidebar: function() {
    if (this.animate_sidebar || !this.polygon) return;
    var self = this;
    var animate = function ani(direction) {
      self.polygon.setStyle({fillOpacity: self.polygon.options.fillOpacity*(1.0+0.18*direction)});
      direction = self.polygon.options.fillOpacity < 0.27*0.3 ? 1 : self.polygon.options.fillOpacity > 0.27*1.9 ? -1 : direction;
      self.animate_sidebar = setTimeout(function(){
        ani(direction);
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

function ObjectRegion(options) {
  ObjectMapBS.call(this, {
    lac: 0,
    cid: 0,
    mnc: 0,
    mcc: 0,
    location_g: null,
    location_y: null,
    location_m: null
  }, options);
}
UtilsMapBS.extend(ObjectMapBS, ObjectRegion, {
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
          clickable: true,
          keyboard: false,
          title: '',
          icon: icon
        }).addTo(this.map());
        this[locs[i].marker_var].on('mouseover', func_mouseover, this);
        this[locs[i].marker_var].on('mouseout', func_mouseout, this);
      }
    }
    return this;
  },

  removeFromMap: function () {
    if (this.marker_g) this.map().removeLayer(this.marker_g);
    if (this.marker_y) this.map().removeLayer(this.marker_y);
    if (this.marker_m) this.map().removeLayer(this.marker_m);
    return this;
  },

  getPanelElement: function (parent) {
    var el, img;
    el = L.DomUtil.create('td', 'panel-column', parent);
    el.style.width = '12px';
    el.style.paddingRight = '5px';
    img = L.DomUtil.create('img', '', el);
    img.src = 'images/' + this.options.mcc + '-' + this.options.mnc + '.png';
    img.style.width = '12px';
    img.style.height = '12px';
    el = L.DomUtil.create('td', 'panel-column', parent);
    el.innerHTML = 'Lac: ' + UtilsMapBS.escapeHTML(this.options.lac) + ' / Cellid: ' + UtilsMapBS.escapeHTML(this.options.cid);
    el = L.DomUtil.create('td', '', parent);
    el.style.width = '12px';
    el = L.DomUtil.create('div', 'panel-region-source ' + (this.options.location_g ? 'panel-region-source-ok' : 'panel-region-source-error'), el)
    el.innerHTML = 'G';
    el = L.DomUtil.create('td', '', parent);
    el.style.width = '12px';
    el = L.DomUtil.create('div', 'panel-region-source ' + (this.options.location_y ? 'panel-region-source-ok' : 'panel-region-source-error'), el)
    el.innerHTML = 'Y';
    el = L.DomUtil.create('td', '', parent);
    el.style.width = '12px';
    el = L.DomUtil.create('div', 'panel-region-source ' + (this.options.location_m ? 'panel-region-source-ok' : 'panel-region-source-error'), el)
    el.innerHTML = 'M';
    return el;
  },

  setLocation: function (key, val) {
    this.removeFromMap();
    this.options[key] = val;
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
  }

});

function ObjectAddress(options){
  ObjectMapBS.call(this, {
    location: null,
    title: ''
  }, options);
}
UtilsMapBS.extend(ObjectMapBS, ObjectAddress, {
  addToMap: function () {
    if(this.map() && this.options.location) {
      this.marker = L.marker(this.options.location, {
        clickable: true,
        keyboard: false,
        title: this.options.title
      }).addTo(this.map());

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
    if (this.marker) this.map().removeLayer(this.marker);
    return this;
  },

  getPanelElement: function (parent) {
    var el = L.DomUtil.create('td', 'panel-column', parent);
    el.innerHTML = UtilsMapBS.escapeHTML(this.options.title);
    return el;
  },

  onClickSidebar: function() {
    if (this.map() && this.options.location) this.map().flyTo(this.options.location);
  }

});

function ObjectBSMapCollection(opts){
  this.objects = [];
  this.options = {
    map: null,
    sidebar: null,
    save_id: null,
    objects: null
  };
  for (var k in this.options) {
    if (this.options.hasOwnProperty(k) && opts.hasOwnProperty(k)) this.options[k] = opts[k];
  }
}
ObjectBSMapCollection.prototype = {
  constructor: ObjectBSMapCollection,
  item: function (i) {
    return this.objects[i];
  },
  new: function (opts, lockredraw) {
    return this.push(new this.options.objects(opts), lockredraw);
  },
  push: function (item, lockredraw) {
    item.removeFromMap();
    this.objects.push(item);
    item.collection = this;
    item.addToMap();
    if (!lockredraw) this.redrawSidebar();
    return item;
  },
  delete: function (item, lockredraw) {
    item.removeFromMap();
    delete item.collection;
    this.objects.splice(this.indexOf(item),1);
    if (!lockredraw) this.redrawSidebar();
    return item;
  },
  indexOf: function (item) {
    for (var i = this.objects.length - 1; i >= 0; i--)
      if (this.objects[i] === item) return i;
    throw new Error('indexOf: item not in collection.');
  },
  loadFromStorage: function() {
    if ($.localStorage.isSet(this.options.save_id) && !$.localStorage.isEmpty(this.options.save_id)) {
      var objs = $.localStorage.get(this.options.save_id);
      for (var i = 0; i < objs.length; i++)
        this.new(objs[i], true);
      this.redrawSidebar(true);
    }
    return this;
  },
  saveToStorage: function() {
    var save_data = [];
    for (var i = 0; i < this.objects.length; i++) {
      save_data.push(this.objects[i].saveToObject());
    }
    $.localStorage.set(this.options.save_id, save_data);
    return this;
  },
  redrawSidebar: function (locksave) {
    if (this.options.sidebar) {
      var el, i, line, icon, func;
      while(this.options.sidebar.lastChild) this.options.sidebar.removeChild(this.options.sidebar.lastChild);
      for (i = 0; i < this.objects.length; i++) {
        line = L.DomUtil.create('tr', 'panel-item', this.options.sidebar);
        el = L.DomUtil.create('td','panel-column', line);
        el.style.width = '1.5em';
        el.innerHTML = i+1 + '.';
        this.objects[i].getPanelElement(line);
        el = L.DomUtil.create('td','panel-column', line);
        el.style.width = '12px';
        icon = L.DomUtil.create('img', 'panel-item-close', el);
        icon.src = 'images/close.png';
        L.DomEvent.addListener(icon, 'mouseover', function(ev) {
          ev.currentTarget.src = 'images/close-hover.png';
        }, this);
        L.DomEvent.addListener(icon, 'mouseout', function(ev) {
          ev.currentTarget.src = 'images/close.png';
        }, this);
        L.DomEvent
          .addListener(icon, 'click', L.DomEvent.stopPropagation)
          .addListener(icon, 'click', L.DomEvent.preventDefault)
          .addListener(icon, 'click', function(ev) {
            this.collection.delete(this);
          }, this.objects[i]);
        L.DomEvent.addListener(line, 'click', this.objects[i].onClickSidebar, this.objects[i]);
        L.DomEvent.addListener(line, 'mouseover', this.objects[i].onMouseOverSidebar, this.objects[i]);
        L.DomEvent.addListener(line, 'mouseout', this.objects[i].onMouseOutSidebar, this.objects[i]);
      }
    }
    if (!locksave) this.saveToStorage();
    return this;
  }
};

function App(){
  var center, zoom;
  $('#map')[0].removeChild($('.cssload-loader')[0]);
  $('#map')[0].style['background-image'] = 'url(images/background.png)';

  this.layers = {
    'Яндекс': new L.Yandex(),
    'Visicom': new L.TileLayer('//tms{s}.visicom.ua/2.0.0/planet3/base_ru/{z}/{x}/{y}.png',{
      maxZoom: 19,
      tms: true,
      subdomains: '123'
    })
  };

  if ($.localStorage.isSet('map') && !$.localStorage.isEmpty('map')) {
    try {
      center = $.localStorage.get('map')['center'];
      zoom = $.localStorage.get('map')['zoom'];
    } catch (err) {
      console.log('error while setting map view:');
      console.log(err);
      center = null;
      zoom = null;
    }
  }

  if (!center) {
    $.getJSON("http://ip-api.com/json/?callback=?", (function(self){
      return function(data) {
        if (data && data.lat && data.lon && self.map) self.map.flyTo([data.lat, data.lon]);
      };
    })(this));
    center = new L.LatLng(50.4501, 30.5234);
  }
  zoom = zoom || 11;


  this.map = new L.Map('map', {
    center: center,
    zoom: zoom,
    zoomControl: false
  })
    .on({
      load: this.autocompleteBound,
      viewreset: this.autocompleteBound,
      dragend: this.autocompleteBound,
      zoomend: this.autocompleteBound,
      zoomlevelschange: this.autocompleteBound,
      resize: this.autocompleteBound,
      click: UtilsMapBS.delayExecutionFunc('buildbs', function(ev){
        this.buildBS(ev);
      }, 250, this),
      dblclick: UtilsMapBS.cancelExecutionFunc('buildbs')
    }, this)
    .addLayer(this.layers['Visicom'])
    .addControl(new L.Control.Zoom({ position: "bottomleft" }));

  this.map_control_layers = new L.Control.Layers(this.layers);
  this.map.addControl(this.map_control_layers);

  this.panel = new L.Control.Panel();
  this.map.addControl(this.panel);

  this.collection_address = new ObjectBSMapCollection({
    map: this.map,
    sidebar: $('#tbl_address')[0],
    save_id: 'tbl_address',
    objects: ObjectAddress
  }).loadFromStorage();
  this.collection_bs = new ObjectBSMapCollection({
    map: this.map,
    sidebar: $('#tbl_bs')[0],
    save_id: 'tbl_bs',
    objects: ObjectBS
  }).loadFromStorage();
  this.collection_region = new ObjectBSMapCollection({
    map: this.map,
    sidebar: $('#tbl_region')[0],
    save_id: 'tbl_region',
    objects: ObjectRegion
  }).loadFromStorage();
}

App.prototype = {
  constructor: App,
  initGoogle: function(){
    var self = this;
    console.log('initGoogle in map...');
    this.autocomplete = new google.maps.places.Autocomplete(this.panel.input_address, {
      types: ['geocode'],
      componentRestrictions: {country: 'ua'}
    });
    google.maps.event.addListener(this.autocomplete, 'place_changed', function(){ self.autocompleteChange.call(self); });
    this.autocompleteBound();

    UtilsMapBS.geocoder = new google.maps.Geocoder();

    $.getScript("libs/leaflet/plugins/layer/tile/Google.js", function(){
      self.map_control_layers.addBaseLayer(new L.Google('ROADMAP'), 'Google');
    });
  },
  autocompleteBound: function(){
    if (this.map) {
      $.localStorage.set('map', {
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      });
    }
    if (!this.autocomplete) return;
    var bounds = this.map.getBounds();
    this.autocomplete.setBounds(new google.maps.LatLngBounds(
      new google.maps.LatLng(bounds['_southWest']['lat'],bounds['_southWest']['lng']),
      new google.maps.LatLng(bounds['_northEast']['lat'],bounds['_northEast']['lng'])
    ));
  },
  resizeBS: function(bs, inc) {
    bs.size = bs.size + inc;
    this.map.removeLayer(bs.polygon);
    bs.polygon = this.add_bs_polygon(bs.location, bs.azimut, bs.size, bs.color);
  },
  buildBS: function(ev) {
    if (this.panel.current_button !== 1) return;
    var azimut = parseInt($('.tab-panel-input-azimut').val(),10);
    if (isNaN(azimut) || azimut < 0 || azimut > 360) {
      noty({
        text: 'Невозможно построить БС: некорректное значение азимута. Значение азимута должно быть от 0° до 360°.',
        type: 'error',
        timeout: 5000,
        layout: 'bottom',
        theme: 'bsmap'
      });
      $('.tab-panel-input-azimut').focus();
      return;
    }
    this.collection_bs.new({
      location: ev.latlng,
      azimut: azimut,
      title: null,
      color: this.panel.colorPickerGet(),
      size: 500
    });
  },
  autocompleteChange: function(){
    var place = this.autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      L.DomUtil.addClass(this.panel.input_address, 'address-notfound');
      return;
    }

    this.map.panTo([place.geometry.location.lat(),place.geometry.location.lng()]);
    this.autocompleteBound();

    var address = '';
    if (place.address_components) {
      address = UtilsMapBS.stripAddress([
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(', '));
    }

    this.collection_address.new({
      location: L.latLng([place.geometry.location.lat(),place.geometry.location.lng()]),
      title: address
    });

    setTimeout(function(){
      app.panel.input_address.value = '';
      app.panel.input_address.focus();
    }, 100);

//    this.map.fitBounds([
//      [place.geometry.viewport.getSouthWest().lat(),place.geometry.viewport.getSouthWest().lng()],
//      [place.geometry.viewport.getNorthEast().lat(),place.geometry.viewport.getNorthEast().lng()]
//    ]);
  },
  lookupRegion: function () {
    var lac = parseInt($('.tab-panel-input-lac').val(),10);
    if (isNaN(lac) || lac < 1 || lac > 65535) {
      noty({
        text: 'Невозможно найти местоположение БС: некорректное значение LAT. Значение LAT должно быть от 1 до 65535.',
        type: 'error',
        timeout: 5000,
        layout: 'bottom',
        theme: 'bsmap'
      });
      this.panel._lookupRegionStop($('.tab-panel-input-lac')[0]);
      return;
    }
    var cid = parseInt($('.tab-panel-input-cid').val(),10);
    if (isNaN(cid) || cid < 1 || cid > 65535) {
      noty({
        text: 'Невозможно найти местоположение БС: некорректное значение CID. Значение CID должно быть от 1 до 65535.',
        type: 'error',
        timeout: 5000,
        layout: 'bottom',
        theme: 'bsmap'
      });
     this.panel._lookupRegionStop($('.tab-panel-input-cid')[0]);
     return;
    }
    var mcc = 255;
    var mnc = parseInt($('.tab-panel-region-oper:checked').val(),10);
    var req = {
      done_g: true,
      done_y: false,
      done_m: true
    };
    var onComplete = function() {
      console.log('on complite');
      if (!req.obj) {
        if (req.g || req.y || req.m) {
          req.obj = this.collection_region.new({
            lac: lac,
            cid: cid,
            mnc: mnc,
            mcc: mcc,
            location_g: req.g,
            location_y: req.y,
            location_m: req.m
          });
          req.obj.onClickSidebar();
        }
      } else {
        if (req.g) req.obj.setLocation('location_g', req.g);
        if (req.y) req.obj.setLocation('location_y', req.y);
        if (req.m) req.obj.setLocation('location_m', req.m);
      }
      delete req.g;
      delete req.y;
      delete req.m;
      if (req.done_g && req.done_y && req.done_m) this.panel._lookupRegionStop();
    };
    var onError = function(source, jqXHR, status, error, custommsg) {
      var msg;
      console.log('on error...');
      console.log(source);
      console.log(jqXHR);
      console.log(status);
      console.log(error);
      msg = 'Ошибка получения данных от источника "' + source + '" про работу БС с LAC: ' + lac + ' / Cellid: ' + cid +' оператора "' + mnc + '".';
      if (jqXHR && jqXHR.status !== 0) {
        msg += ' Статус ответа: "' + jqXHR.status + '".';
      }
      if (custommsg) {
        msg += ' ' + custommsg + '.';
      }
      noty({
        text: msg,
        type: 'error',
        timeout: 50000,
        layout: 'bottom',
        theme: 'bsmap'
      });
    };
    $.ajax({
      data: JSON.stringify({
        radioType: "gsm",
        homeMobileCountryCode: mcc,
        homeMobileNetworkCode: mnc,
        considerIp: false,
        cellTowers: [{
          cellId: cid,
          locationAreaCode: lac,
          mobileCountryCode: mcc,
          mobileNetworkCode: mnc,
          age: 0,
          signalStrength: -65
        }]
      }),
      url: "https://www.googleapis.com/geolocation/v1/geolocate?key="+jcE("IAazySyCiHFmOc10DC7SCKfNeOyTLrQT7V8M02Q"),
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: 'json',
      context: this,
      cache: false,
      success: function(response, status){
        if (status !== 'success') {
          onError.call(this, "Google", null, null, null, 'Статус запроса: "' + status + '"');
          console.log(response);console.log(status);
        } else if (!response || !response.location || !response.location.lat || !response.location.lng) {
          onError.call(this, "Google", null, null, null, 'Не найдена информация про lat/lng в ответе');
          console.log(response);console.log(status);
        } else {
          req.g = L.latLng([response.location.lat,response.location.lng]);
        }
      },
      error: function(jqXHR, status, error){
        onError.call(this, "Google", jqXHR, status, error);
      },
      complete: function(){
        req.done_g = true;
        onComplete.call(this);
      }
    });
/*    $.ajax({
      data: "json="+JSON.stringify({
        common: {
          version: "1.0",
          api_key: jcE('DAEMVmBcAAAAg5yiAYAM-bYmfr0MYQQCVOT2QHBluxl1A2AUAAAAAAAAAAGA0cPJAoaXa8WPBhb13MV-pRM8ww==')
        },
        gsm_cells: [{
          countrycode: mcc,
          operatorid: mnc,
          cellid: cid,
          lac: lac,
          signal_strength: -65,
          age: 0
        }]
      }),
      url: "http://api.lbs.yandex.net/geolocation",
      type: "POST",
      contentType: "application/x-www-form-urlencoded; charset=utf-8",
      dataType: 'json',
      context: this,
      cache: false,
      success: function(response, status){
        if (status !== 'success') {
          onError.call(this, "Yandex", null, null, null, 'Статус запроса: "' + status + '"');
          console.log(response);console.log(status);
        } else if (!response || !response.location || !response.location.lat || !response.location.lng) {
          onError.call(this, "Yandex", null, null, null, 'Не найдена информация про lat/lng в ответе');
          console.log(response);console.log(status);
        } else {
          req.y = L.latLng([response.location.lat,response.location.lng]);
        }
      },
      error: function(jqXHR, status, error){
        onError.call(this, "Yandex", jqXHR, status, error);
      },
      complete: function(){
        req.done_y = true;
        onComplete.call(this);
      }
    }); */
    $.ajax({
      data: 'cellid=' + cid + "&lac=" + lac + "&countrycode=" + mcc + "&operatorid=" + mnc,
      url: "https://crossorigin.me/http://mobile.maps.yandex.net/cellid_location",
      type: "GET",
      context: this,
      dataType: 'xml',
      cache: false,
      success: function(response, status){
        var coord = $(response).find('location[source="FoundByCellid"]:eq(0) coordinates');
        if (status !== 'success') {
          onError.call(this, "Yandex", null, null, null, 'Статус запроса: "' + status + '"');
          console.log(response);console.log(status);
        } else if (!coord.length || !coord.attr('latitude') || !coord.attr('longitude')) {
          onError.call(this, "Yandex", null, null, null, 'Не найдена информация про lat/lng в ответе');
          console.log(response);console.log(status);
        } else {
          req.y = L.latLng([coord.attr('latitude'),coord.attr('longitude')]);
        }
      },
      error: function(jqXHR, status, error){
        onError.call(this, "Yandex", jqXHR, status, error);
      },
      complete: function(){
        req.done_y = true;
        onComplete.call(this);
      }
    });

  }
};

var app = new App();
