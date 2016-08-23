/*
 tab-panel.js - part of bsmap

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

L.ColorPicker = L.Evented.extend({
  options: {
    colors: ['#777777', '#000000', '#ff00ff', '#ff0000', '#9000ff', '#ff6c00',
             '#ffff00', '#00ff00', '#00aa00', '#00ffdd', '#0000ff'],
    defaultColor: '#000000'
  },

  initialize: function (options) {
    var i, el;
    L.setOptions(this, options);
    this._container = L.DomUtil.create('div', '');
    this._container.style.display = 'inline-block';
    for (i = 0; i < this.options.colors.length; i += 1) {
      el = L.DomUtil.create('div', '', this._container);
      el.style.display = 'inline-block';
      el.style.backgroundColor = this.options.colors[i];
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.float = 'left';
      el.style.border = '1px solid #000000';
      el.style.margin = '2px 2px 2px 2px';
      L.DomEvent.addListener(el, 'click', this._colorSelected, this);
    }
  },

  addTo: function (el) {
     el.appendChild(this._container);
     return this;
  },

  setColor: function(color) {
    var el, i;
    // normalize color value
    el = L.DomUtil.create('div', '');
    el.style.backgroundColor = color;
    color = el.style.backgroundColor;
    el.remove();
    for (i = this._container.children.length - 1; i >= 0; i--)
      this._container.children[i].style.outline =
        this._container.children[i].style.backgroundColor === color ? '2px solid #000000' : '';
    return this;
  },

  getColor: function() {
    for (var i = this._container.children.length - 1; i >= 0; i--)
      if (this._container.children[i].style.outline !== '') return this._container.children[i].style.backgroundColor;
    return this.options.detaultColor;
  },

  _colorSelected: function (ev) {
    ev.selectedColor = this.options.defaultColor;
    for (var i = this._container.children.length - 1; i >= 0; i--) {
      if (ev.target === this._container.children[i]) {
        this._container.children[i].style.outline = '2px solid #000000';
        ev.selectedColor = this._container.children[i].style.backgroundColor;
      } else {
        this._container.children[i].style.outline = '';
      }
    }
    L.DomEvent.stop(ev);
    this.fire('selected', ev);
  }

});

L.colorPicker = function (options) {
  return new L.ColorPicker(options);
};


L.Control.Panel = L.Control.extend({
  options: {
    position: 'topleft',
    popups: true
  },

  initialize: function (options) {
    L.Util.setOptions(this, options);
  },

  onAdd: function () {
    var line, el, span, container;
    this.buttons = [];
    this.inputs = [];
    this.current_button = 0;

    container = this._container = L.DomUtil.create('div', 'tab-panel');

    el = L.DomUtil.create('div', 'tab-panel-min-button', container);
    el.innerHTML = 'X';
    L.DomEvent.addListener(el, 'click', function(ev){
      L.DomEvent.stop(ev);
      var button = $('.tab-panel .tab-panel-min-button')[0];
      if (this._body.style.display === 'none') {
        this._container.style.width = '';
        this._container.style.height = '';
        this._body.style.display = '';
        button.innerHTML = 'X';
      } else {
        this._body.style.display = 'none';
        this._container.style.width = button.offsetWidth + 'px';
        this._container.style.height = button.offsetHeight + 'px';
        button.innerHTML = '&rArr;';
      }
    }, this);

    container = this._body = L.DomUtil.create('div', '', container);

    var buttonbar = L.DomUtil.create('div', 'tab-panel-buttonbar', container);

    this.buttons[0] = L.DomUtil.create('span', 'tab-panel-button tab-panel-button-active', buttonbar);
    this.buttons[0].innerHTML = 'Поиск адреса';
    this.buttons[1] = L.DomUtil.create('span', 'tab-panel-button', buttonbar);
    this.buttons[1].innerHTML = 'Построить БС';
    this.buttons[2] = L.DomUtil.create('span', 'tab-panel-button', buttonbar);
    this.buttons[2].innerHTML = 'Область работы БС';
    L.DomEvent.addListener(this.buttons[0], 'click', function(ev){
      L.DomEvent.stop(ev);
      this._selectPanel(0);
      $('.leaflet-container').removeClass('map-cursor-pointer');
    }, this);
    L.DomEvent.addListener(this.buttons[1], 'click', function(ev){
      L.DomEvent.stop(ev);
      this._selectPanel(1);
      $('.leaflet-container').addClass('map-cursor-pointer');
    }, this);
    L.DomEvent.addListener(this.buttons[2], 'click', function(ev){
      L.DomEvent.stop(ev);
      this._selectPanel(2);
      $('.leaflet-container').removeClass('map-cursor-pointer');
    }, this);

    this.inputs[0] = L.DomUtil.create('div', 'tab-panel-inputbar-container', container);
    line = L.DomUtil.create('div', 'tab-panel-inputbar', this.inputs[0]);
    L.DomUtil.create('span', 'tab-panel-label', line).innerHTML = "Адрес:";
    this.input_address = L.DomUtil.create('input', 'tab-panel-input-address', line);
    L.DomEvent.addListener(this.input_address, 'keydown', function(ev){
      L.DomUtil.removeClass(ev.currentTarget, 'address-notfound');
    }, this);
    L.DomUtil.create('div', 'tab-panel-inputbar-separator', this.inputs[0]);
    line = L.DomUtil.create('div', 'tab-panel-inputbar-help', this.inputs[0]);
    line.innerHTML = 'Для того, что бы <b>построить</b> адрес - начинайте вводить адрес в строку ввода и выберите подходящий из выпадающего списка подсказок.';

    this.inputs[1] = L.DomUtil.create('div', 'tab-panel-inputbar-container');
    line = L.DomUtil.create('div', 'tab-panel-inputbar', this.inputs[1]);
    L.DomUtil.create('span', 'tab-panel-label', line).innerHTML = "Азимут:";
    el = L.DomUtil.create('input', 'tab-panel-input-azimut', line);
    L.DomEvent.addListener(el, 'input', function(ev){
      this.input_value_azimut = ev.target.value;
    }, this);
    el.value = this.input_value_azimut = '0';
    $(el).focus(function(){$(this).select();}).mouseup(function(e){e.preventDefault();});
    el = L.DomUtil.create('span', 'tab-panel-label', line);
    el.style.marginLeft = '10px';
    el.innerHTML = "Цвет сектора:";
    this.colorpicker_bs = L.colorPicker().setColor('#0000ff').addTo(line);
    L.DomUtil.create('div', 'tab-panel-inputbar-separator', this.inputs[1]);
    line = L.DomUtil.create('div', 'tab-panel-inputbar-help', this.inputs[1]);
    line.innerHTML = 'Для того, что бы <b>построить</b> БС - введите требуемый азимут, выберите цвет и кликните левой клавишей мышки на карте в месте ее расположения либо на маркер адреса. Для <b>перемещения</b> сектора БС - перетащите маркер.';

    this.inputs[2] = L.DomUtil.create('div', 'tab-panel-inputbar-container');
    line = L.DomUtil.create('div', 'tab-panel-inputbar', this.inputs[2]);
    L.DomUtil.create('span', 'tab-panel-label', line).innerHTML = "Оператор:";

    span = L.DomUtil.create('span', 'tab-panel-region-btn tab-panel-region-btn-active', line);
    el = L.DomUtil.create('input', 'tab-panel-region-oper', span);
    el.type = 'radio';
    el.name = 'network';
    el.value = '3';
    el.checked = 1;
    L.DomUtil.create('img', '', span).src = 'images/255-3.png';
    L.DomEvent.addListener(span, 'click', function(ev){
      L.DomEvent.stop(ev);
      $('span.tab-panel-region-btn').removeClass('tab-panel-region-btn-active');
      $('span.tab-panel-region-btn').eq(0).addClass('tab-panel-region-btn-active');
      $('input.tab-panel-region-oper').eq(0).prop("checked", true);
      $('.tab-panel-input-lac').focus();
    }, this);

    span = L.DomUtil.create('span', 'tab-panel-region-btn', line);
    el = L.DomUtil.create('input', 'tab-panel-region-oper', span);
    el.type = 'radio';
    el.name = 'network';
    el.value = '1';
    L.DomUtil.create('img', '', span).src = 'images/255-1.png';
    L.DomEvent.addListener(span, 'click', function(ev){
      L.DomEvent.stop(ev);
      $('span.tab-panel-region-btn').removeClass('tab-panel-region-btn-active');
      $('span.tab-panel-region-btn').eq(1).addClass('tab-panel-region-btn-active');
      $('input.tab-panel-region-oper').eq(1).prop("checked", true);
      $('.tab-panel-input-lac').focus();
    }, this);

    span = L.DomUtil.create('span', 'tab-panel-region-btn', line);
    el = L.DomUtil.create('input', 'tab-panel-region-oper', span);
    el.type = 'radio';
    el.name = 'network';
    el.value = '6';
    L.DomUtil.create('img', '', span).src = 'images/255-6.png';
    L.DomEvent.addListener(span, 'click', function(ev){
      L.DomEvent.stop(ev);
      $('span.tab-panel-region-btn').removeClass('tab-panel-region-btn-active');
      $('span.tab-panel-region-btn').eq(2).addClass('tab-panel-region-btn-active');
      $('input.tab-panel-region-oper').eq(2).prop("checked", true);
      $('.tab-panel-input-lac').focus();
    }, this);

    el = L.DomUtil.create('span', 'tab-panel-label', line);
    el.style.marginLeft = '10px';
    el.innerHTML = "LAC:";
    el = L.DomUtil.create('input', 'tab-panel-input-lac', line);
    el.value = '0';
    $(el)
      .focus(function(){$(this).select();})
      .mouseup(function(e){e.preventDefault();})
      .keyup(function(e){if (e.keyCode === 13) $('.tab-panel-button-lookup-region').click();});
    el = L.DomUtil.create('span', 'tab-panel-label', line);
    el.style.marginLeft = '5px';
    el.innerHTML = "CID:";
    el = L.DomUtil.create('input', 'tab-panel-input-cid', line);
    el.value = '0';
    $(el)
      .focus(function(){$(this).select();})
      .mouseup(function(e){e.preventDefault();})
      .keyup(function(e){if (e.keyCode === 13) $('.tab-panel-button-lookup-region').click();});
    el = L.DomUtil.create('span', 'tab-panel-button tab-panel-button-lookup-region', line);
    el.style.perspective =  '780px';
    el.style.margin = '0px 0px 0px 10px';
    el.style.fontSize = '11px';
    el.style.height = '15px';
    el.innerHTML = 'Начать поиск';
    L.DomEvent.addListener(el, 'click', function(ev){
      L.DomEvent.stop(ev);
      this._lookupRegion();
    }, this);

    line = L.DomUtil.create('div', 'tab-panel-inputbar', this.inputs[2]);
    line.style.margin = '4px 0px 0px 0px';
    L.DomUtil.create('span', 'tab-panel-label', line).innerHTML = "Цвет региона:";
    this.colorpicker_region = L.colorPicker().setColor('#ff0000').addTo(line);

    L.DomUtil.create('div', 'tab-panel-inputbar-separator', this.inputs[2]);
    line = L.DomUtil.create('div', 'tab-panel-inputbar-help', this.inputs[2]);
    line.innerHTML = 'Для того, что бы <b>построить</b> примерную область работы БС - выберите оператора, LAC и CellID базовой станции, цвет области и нажмите кнопку <b>\"Начать поиск\"</b>.';

    L.DomEvent.disableClickPropagation(this._container);

    return this._container;
  },

  _selectPanel: function(bid) {
    L.DomUtil.removeClass(this.buttons[this.current_button], 'tab-panel-button-active');
    this._body.removeChild(this.inputs[this.current_button]);
    L.DomUtil.addClass(this.buttons[bid], 'tab-panel-button-active');
    this._body.appendChild(this.inputs[bid]);
    this.current_button = bid;
  },

  _lookupRegion: function() {
    var ani;
    var el = $('.tab-panel-button-lookup-region')[0];
    var width = $(el).width();
    while(el.lastChild) el.removeChild(el.lastChild);
    el.appendChild(document.createTextNode('Поиск...'));
    ani = L.DomUtil.create('div', 'cssload-inner cssload-one', el);
    ani.style.width = '1em';
    ani.style.right = '10px';
    ani = L.DomUtil.create('div', 'cssload-inner cssload-two', el);
    ani.style.width = '1em';
    ani.style.right = '10px';
    ani = L.DomUtil.create('div', 'cssload-inner cssload-three', el);
    ani.style.width = '1em';
    ani.style.right = '10px';
    $(el).width(width);
    this.inlookupregion = true;
    App.core.lookupRegion();
  },

  _lookupRegionStop: function(focus) {
    delete this.inlookupregion;
    var el = $('.tab-panel-button-lookup-region')[0];
    el.innerHTML = 'Начать поиск';
    if (focus) focus.focus();
  }

});
