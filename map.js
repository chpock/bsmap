function App(){

  $('#map')[0].removeChild($('.cssload-loader')[0]);
  $('#map')[0].style['background-image'] = 'url(images/background.png)';

  this.layers = {
    'Google': new L.Google('ROADMAP'),
    'Яндекс': new L.Yandex(),
    'Visicom': new L.TileLayer('http://tms{s}.visicom.ua/2.0.0/planet3/base_ru/{z}/{x}/{y}.png',{
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
      click: this.buildBS
    }, this)
    .addLayer(this.layers['Visicom'])
    .addControl(new L.Control.Layers(this.layers))
    .addControl(new L.Control.Zoom({ position: "bottomleft" }));

  this.panel = new L.Control.Panel()
  this.map.addControl(this.panel);

  this.tbl_address = [];
  this.tbl_bs = [];

  var self = this;
  if ($.localStorage.isSet('tbl_address') && !$.localStorage.isEmpty('tbl_address')) {
    try {
      $.localStorage.get('tbl_address').forEach(function(o){
        o['marker'] = self.add_address(o.location, o.address);
        self.tbl_address.push(o);
      });
    } catch (err) {
      console.log('error while loading tbl_address:');
      console.log(err);
      this.tbl_address = [];
    };
    this.redraw_address();
  };
  if ($.localStorage.isSet('tbl_bs') && !$.localStorage.isEmpty('tbl_bs')) {
    try {
      $.localStorage.get('tbl_bs').forEach(function(o){
        o['polygon'] = self.add_bs_polygon(o.location, o.azimut, o.size);
        o['marker'] = self.add_bs_marker(o.location, o.title);
        self.tbl_bs.push(o);
      });
    } catch (err) {
      console.log('error while loading tbl_bs:');
      console.log(err);
      this.tbl_bs = [];
    };
    this.redraw_bs();
  };
  if ($.localStorage.isSet('map') && !$.localStorage.isEmpty('map')) {
    try {
      this.map.setView($.localStorage.get('map')['center'], $.localStorage.get('map')['zoom']);
    } catch (err) {
      console.log('error while setting map view:');
      console.log(err);
    };
  };
};

App.prototype = {
  constructor: App,
  initGoogle: function(){
    var self = this;
    console.log('initGoogle in map...');
    this.autocomplete = new google.maps.places.Autocomplete(this.panel.input_address, {
      types: ['geocode'],
      componentRestrictions: {country: 'ua'}
    });
    google.maps.event.addListener(this.autocomplete, 'place_changed', function(){ self.autocompleteChange.call(self) });
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
    bs.polygon = this.add_bs_polygon(bs.location, bs.azimut, bs.size);  
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
    };

    var bs = {
      location: ev.latlng,
      azimut: azimut,
      title: ev.latlng.lat + ', ' + ev.latlng.lng,
      size: 500
    };
    bs.polygon = this.add_bs_polygon(bs.location, bs.azimut, bs.size);
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
      };
      var address_components = [];
      for (var j = 0; j < results[0].address_components.length; j++) {
        if (results[0].address_components[j].types[0] == 'street_number' || results[0].address_components[j].types[0] == 'route')
          address_components.push(self.stripAddress(results[0].address_components[j].short_name));
      };
      if (address_components.length) {     
        bs.title = address_components.join(", ");
        self.save_current_state('tbl_bs');
        self.redraw_bs();
      };
    });    
  },
  autocompleteChange: function(){
    var place = this.autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      L.DomUtil.addClass(this.panel.input_address, 'address-notfound');
      return;
    };

    this.map.panTo([place.geometry.location.lat(),place.geometry.location.lng()]);
    this.autocompleteBound();

    if (place.address_components) {
      var address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(',');
    } else {
      var address = '';
    };

    var location = L.latLng([place.geometry.location.lat(),place.geometry.location.lng()]);

    this.tbl_address.push({
      marker: this.add_address(location,place.name),
      title: address,
      location: location
    });

    this.save_current_state('tbl_address');
    this.redraw_address();

    setTimeout(function(){
      app.panel.input_address.value = '';
      app.panel.input_address.focus();
    }, 100);

//    this.map.fitBounds([
//      [place.geometry.viewport.getSouthWest().lat(),place.geometry.viewport.getSouthWest().lng()],
//      [place.geometry.viewport.getNorthEast().lat(),place.geometry.viewport.getNorthEast().lng()]
//    ]);
  },
  add_bs_polygon: function(location, azimut, size) {
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
    };
    for (var x = azm_start; x <= azm_end; x++) { 
      var brng = (x % 360) * Math.PI / 180;
      var destLat = Math.asin(Math.sin(lat)*Math.cos(d) + Math.cos(lat)*Math.sin(d)*Math.cos(brng));
      var destLng = ((lon + Math.atan2(Math.sin(brng)*Math.sin(d)*Math.cos(lat), Math.cos(d)-Math.sin(lat)*Math.sin(destLat))) * 180) / Math.PI;
      destLat = (destLat * 180) / Math.PI;
      points.push(new L.LatLng(destLat, destLng));
    };
    var polygon = L.polygon(points,{
      stroke: true,
      weight: 1,
      color: '#004de8',
      opacity: 0.62,
      fillColor: '#004de8',
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
      this.tbl_bs[i].polygon = this.add_bs_polygon(this.tbl_bs[i].location, this.tbl_bs[i].azimut, this.tbl_bs[i].size);
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
      c1.innerHTML = i+1 + '.'
      c2.innerHTML = o.title;
      c3.innerHTML = o.azimut;
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
      c1.innerHTML = i+1 + '.'
      c2.innerHTML = o.title;
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
    if (this.tbl_address && (!save_type || save_type === 'tbl_address')) {
      var save_tbl_address = [];
      this.tbl_address.forEach(function(o){
        var tmp = {};
        for (var k in o) if (k !== 'marker') tmp[k] = o[k];
        save_tbl_address.push(tmp);
      });
      $.localStorage.set('tbl_address', save_tbl_address);
    };
    if (this.tbl_bs && (!save_type || save_type === 'tbl_bs')) {
      var save_tbl_bs = [];
      this.tbl_bs.forEach(function(o){
        var tmp = {};
        for (var k in o) if (k !== 'marker' && k !== 'polygon') tmp[k] = o[k];
        save_tbl_bs.push(tmp);
      });
      $.localStorage.set('tbl_bs', save_tbl_bs);
    };
    if (this.map && (!save_type || save_type === 'map')) {
      var save_map = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      };
      $.localStorage.set('map', save_map);
    };
  },
  stripAddress: function(str) {
    var tbl = {
      " улица":" ул.",
      "улица ":"ул.",
      "проспект":"пр-т",
      "бульвар":"б-р",
      "переулок ":"пер.",
      " переулок":" пер.",
    };
    var re = new RegExp(Object.keys(tbl).join("|"),"gi");
    return str.replace(re, function(matched){ return tbl[matched]; });
  }
};

var app = new App();