/* jslint browser:true */
/* jslint sub:true */

// disable error in "use strict"; function
/* jslint node:true */
// disable error in global leaflet object 'L'
/*global L */
/*global $ */
/*global google */
/*global noty */
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
  }
};

function ObjectBS (options) {
  ObjectMapBS.call(this, {
    location: null,
    title: '',
    color: null,
    size: null,
    azimut: null
  }, options);
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
        if (this.collection) this.collection.redrawSidebar();
//        this.tbl_bs[i].location = ev.target.getLatLng();
//        this.map.removeLayer(app.tbl_bs[i].polygon);
//        this.tbl_bs[i].polygon = this.add_bs_polygon(this.tbl_bs[i].location, this.tbl_bs[i].azimut, this.tbl_bs[i].size, this.tbl_bs[i].color);
//        this.save_current_state('tbl_bs');
//        this.updateBSTitle(this.tbl_bs[i]);
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

  getPanelElement: function () {
    var el = L.DomUtil.create('td', 'panel-column', null);
    el.innerHTML = UtilsMapBS.escapeHTML(this.options.title);
    return el;
  },

  onClickSidebar: function() {
    if (this.map() && this.options.location) this.map().panTo(this.options.location);
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

  getPanelElement: function () {
    var el = L.DomUtil.create('td', 'panel-column', null);
    el.innerHTML = UtilsMapBS.escapeHTML(this.options.title);
    return el;
  },

  onClickSidebar: function() {
    if (this.map() && this.options.location) this.map().panTo(this.options.location);
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
    this.push(new this.options.objects(opts), lockredraw);
  },
  push: function (item, lockredraw) {
    item.removeFromMap();
    this.objects.push(item);
    item.collection = this;
    item.addToMap();
    if (!lockredraw) this.redrawSidebar();
    return this;
  },
  delete: function (item, lockredraw) {
    item.removeFromMap();
    delete item.collection;
    this.objects.splice(this.indexOf(item),1);
    if (!lockredraw) this.redrawSidebar();
    return this;
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
        line.appendChild(this.objects[i].getPanelElement());
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
      }
    }
    if (!locksave) this.saveToStorage();
    return this;
  }
};

function App(){
  $('#map')[0].removeChild($('.cssload-loader')[0]);
  $('#map')[0].style['background-image'] = 'url(images/background.png)';

  this.layers = {
    'Google': new L.Google('ROADMAP'),
    'Яндекс': new L.Yandex(),
    'Visicom': new L.TileLayer('//tms{s}.visicom.ua/2.0.0/planet3/base_ru/{z}/{x}/{y}.png',{
      maxZoom: 19,
      tms: true,
      subdomains: '123'
    })
  };

  this.map = new L.Map('map', {
    center: new L.LatLng(48.502275,34.62719),
    zoom: 11,
    zoomControl: false
  })
    .on({
      load: this.autocompleteBound,
      viewreset: this.autocompleteBound,
      dragend: this.autocompleteBound,
      zoomend: this.autocompleteBound,
      zoomlevelschange: this.autocompleteBound,
      resize: this.autocompleteBound,
      click: function(ev){
        var self = this;
        if (this.panel.current_button !== 1) return;
        if (this.build_timer) return;
        this.build_timer = setTimeout(function(){
          delete self.build_timer;
          self.buildBS.call(self,ev);
        }, 250);
      },
      dblclick: function(){
        if (!this.build_timer) return;
        clearTimeout(this.build_timer);
        delete this.build_timer;
      }
    }, this)
    .addLayer(this.layers['Visicom'])
    .addControl(new L.Control.Layers(this.layers))
    .addControl(new L.Control.Zoom({ position: "bottomleft" }));

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

  if ($.localStorage.isSet('map') && !$.localStorage.isEmpty('map')) {
    try {
      this.map.setView($.localStorage.get('map')['center'], $.localStorage.get('map')['zoom']);
    } catch (err) {
      console.log('error while setting map view:');
      console.log(err);
    }
  }
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

    this.geocoder = new google.maps.Geocoder();
  },
  autocompleteBound: function(){
    this.save_current_state('map');
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

    var bs = {
      location: ev.latlng,
      azimut: azimut,
      title: ev.latlng.lat + ', ' + ev.latlng.lng,
      color: this.panel.colorPickerGet(),
      size: 500
    };
    bs.polygon = this.add_bs_polygon(bs.location, bs.azimut, bs.size, bs.color);
    bs.marker = this.add_bs_marker(bs.location, '');

    this.tbl_bs.push(bs);

    this.save_current_state('tbl_bs');
    this.redraw_bs();
    this.updateBSTitle(bs);
  },
  updateBSTitle: function(bs) {
    if (!this.geocoder) return;
    var self = this;
    this.geocoder.geocode({'latLng': new google.maps.LatLng(bs.location.lat, bs.location.lng)}, function(results, status){
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
        bs.title = address_components.join(", ");
        self.save_current_state('tbl_bs');
        self.redraw_bs();
      }
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
      address = this.stripAddress([
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(', '));
    }

    this.collection_address.new({
      location: L.latLng([place.geometry.location.lat(),place.geometry.location.lng()]),
      title: address
    });

//    this.save_current_state('tbl_address');
//    this.redraw_address();

    setTimeout(function(){
      app.panel.input_address.value = '';
      app.panel.input_address.focus();
    }, 100);

//    this.map.fitBounds([
//      [place.geometry.viewport.getSouthWest().lat(),place.geometry.viewport.getSouthWest().lng()],
//      [place.geometry.viewport.getNorthEast().lat(),place.geometry.viewport.getNorthEast().lng()]
//    ]);
  },
  add_bs_polygon: function(location, azimut, size, color) {
    var points = [];
    points.push(location);
    var lat = (location.lat * Math.PI) / 180;
    var lon = (location.lng * Math.PI) / 180;
    var d = parseFloat(size) / 6378100;
    var azm_start = azimut - 60;
    var azm_end = azimut + 60;
    if ( azm_start < 0 ) {
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
//    var pcolor = jQuery.Color(color).lightness(jQuery.Color(color).lightness()*1.2).toRgbaString();
    var polygon = L.polygon(points,{
      stroke: true,
      weight: 1,
      color: color,
      opacity: 0.7,
      fillColor: color,
      fillOpacity: 0.27,
      clickable: true
    }).addTo(this.map);
    polygon.on('mouseover',function(){
      for (var i = 0; i < this.tbl_bs.length; i++)
        if (this.tbl_bs[i].polygon == polygon)
          break;
      L.DomUtil.addClass($('#tbl_bs .panel-item')[i], 'panel-item-active');
    },this);
    polygon.on('mouseout',function(){
      $('#tbl_bs .panel-item-active').each(function(){
        L.DomUtil.removeClass($(this)[0], 'panel-item-active');
      });
    },this);
    return polygon;
  },
  add_bs_marker: function(location, title) {
    var marker = L.marker(location, {
      clickable: true,
      draggable: true,
      keyboard: false,
      title: title
    }).addTo(this.map);
    marker.on('mouseover',function(){
      for (var i = 0; i < this.tbl_bs.length; i++)
        if (this.tbl_bs[i].marker == marker)
          break;
      L.DomUtil.addClass($('#tbl_bs .panel-item')[i], 'panel-item-active');
    },this);
    marker.on('mouseout',function(){
      $('#tbl_bs .panel-item-active').each(function(){
        L.DomUtil.removeClass($(this)[0], 'panel-item-active');
      });
    },this);
    marker.on('dragend', function(ev){
      for (var i = 0; i < this.tbl_bs.length; i++)
        if (this.tbl_bs[i].marker == marker)
          break;
      this.tbl_bs[i].location = ev.target.getLatLng();
      this.map.removeLayer(app.tbl_bs[i].polygon);
      this.tbl_bs[i].polygon = this.add_bs_polygon(this.tbl_bs[i].location, this.tbl_bs[i].azimut, this.tbl_bs[i].size, this.tbl_bs[i].color);
      this.save_current_state('tbl_bs');
      this.updateBSTitle(this.tbl_bs[i]);
    },this);
    return marker;
  },
  add_address: function(location, title){
    var marker = L.marker(location, {
      clickable: true,
      keyboard: false,
      title: title
    }).addTo(this.map);
    marker.on('mouseover',function(){
      for (var i = 0; i < this.tbl_address.length; i++)
        if (this.tbl_address[i].marker == marker)
          break;
      L.DomUtil.addClass($('#tbl_address .panel-item')[i], 'panel-item-active');
    },this);
    marker.on('mouseout',function(){
      $('#tbl_address .panel-item-active').each(function(){
        L.DomUtil.removeClass($(this)[0], 'panel-item-active');
      });
    },this);
    return marker;
  },
  redraw_bs: function(){
    var self = this;
    var section = $('#tbl_bs')[0];
    while(section.firstChild) section.removeChild(section.firstChild);
    this.tbl_bs.forEach(function(o,i){
      var line = L.DomUtil.create('tr', 'panel-item', section);
      var c0 = L.DomUtil.create('td','panel-column',line);
      var c1 = L.DomUtil.create('td','panel-column',line);
      var c2 = L.DomUtil.create('td','panel-column',line);
      var c3 = L.DomUtil.create('td','panel-column',line);
      var c4 = L.DomUtil.create('td','panel-column',line);
      c0.style.width = '17px';
      c1.style.width = '1.5em';
      c3.style.width = '1.9em';
      c3.style.textAlign = 'right';
      c4.style.width = '12px';
      c1.innerHTML = i+1 + '.';
      c2.innerHTML = UtilsMapBS.escapeHTML(o.title);
      c3.innerHTML = UtilsMapBS.escapeHTML(o.azimut);
      var icon = L.DomUtil.create('img', 'panel-item-close', c4);
      icon.src = 'images/close.png';
      var dec = L.DomUtil.create('img', 'panel-item-close', c0);
      dec.src = 'images/left.png';
      dec.style.padding = '0px 1px 0px 0px';
      var inc = L.DomUtil.create('img', 'panel-item-close', c0);
      inc.src = 'images/right.png';
      L.DomEvent.addListener(line, 'click', function(ev) {
        this.map.panTo(o.location);
      }, self);
      L.DomEvent
        .addListener(dec, 'click', L.DomEvent.stopPropagation)
        .addListener(dec, 'click', L.DomEvent.preventDefault)
        .addListener(dec, 'click', function(ev) {
          this.resizeBS(o,-50);
        }, self);
      L.DomEvent
        .addListener(inc, 'click', L.DomEvent.stopPropagation)
        .addListener(inc, 'click', L.DomEvent.preventDefault)
        .addListener(inc, 'click', function(ev) {
          this.resizeBS(o,50);
        }, self);
      L.DomEvent.addListener(icon, 'mouseover', function(ev) {
        ev.currentTarget.src = 'images/close-hover.png';
      }, self);
      L.DomEvent.addListener(icon, 'mouseout', function(ev) {
        ev.currentTarget.src = 'images/close.png';
      }, self);
      L.DomEvent
        .addListener(icon, 'click', L.DomEvent.stopPropagation)
        .addListener(icon, 'click', L.DomEvent.preventDefault)
        .addListener(icon, 'click', function(ev) {
          this.map.removeLayer(o.marker);
          this.map.removeLayer(o.polygon);
          this.tbl_bs.splice(i,1);
          this.save_current_state('tbl_bs');
          this.redraw_bs();
        }, self);
    });
  },
  redraw_address: function(){
    var self = this;
    var section = $('#tbl_address')[0];
    while(section.firstChild) section.removeChild(section.firstChild);
    this.tbl_address.forEach(function(o,i){
      var line = L.DomUtil.create('tr', 'panel-item', section);
      var c1 = L.DomUtil.create('td','panel-column',line);
      var c2 = L.DomUtil.create('td','panel-column',line);
      var c3 = L.DomUtil.create('td','panel-column',line);
      c1.style.width = '1.5em';
      c3.style.width = '12px';
      c1.innerHTML = i+1 + '.';
      c2.innerHTML = self.escapeHTML(o.title);
      var icon = L.DomUtil.create('img', 'panel-item-close', c3);
      icon.src = 'images/close.png';
      L.DomEvent.addListener(line, 'click', function(ev) {
        this.map.panTo(o.location);
      }, self);
      L.DomEvent.addListener(icon, 'mouseover', function(ev) {
        ev.currentTarget.src = 'images/close-hover.png';
      }, self);
      L.DomEvent.addListener(icon, 'mouseout', function(ev) {
        ev.currentTarget.src = 'images/close.png';
      }, self);
      L.DomEvent
        .addListener(icon, 'click', L.DomEvent.stopPropagation)
        .addListener(icon, 'click', L.DomEvent.preventDefault)
        .addListener(icon, 'click', function(ev) {
          this.map.removeLayer(o.marker);
          this.tbl_address.splice(i,1);
          this.save_current_state('tbl_address');
          this.redraw_address();
        }, self);
    });
  },
  save_current_state: function(save_type){
    if (this.map && (!save_type || save_type === 'map')) {
      var save_map = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      };
      $.localStorage.set('map', save_map);
    }
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
  }
};

var app = new App();