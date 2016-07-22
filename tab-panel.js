L.Control.Panel = L.Control.extend({
  options: {
    position: 'topleft',
    popups: true
  },

  initialize: function (options) {
    L.Util.setOptions(this, options);
  },

  onAdd: function () {
    this.buttons = [];
    this.inputs = [];
    this.current_button = 0;

    var container = this._container = L.DomUtil.create('div', 'tab-panel');

    var buttonbar = L.DomUtil.create('div', 'tab-panel-buttonbar', container);

    this.buttons[0] = L.DomUtil.create('span', 'tab-panel-button tab-panel-button-active', buttonbar);
    this.buttons[0].innerHTML = 'Поиск адреса';
    this.buttons[1] = L.DomUtil.create('span', 'tab-panel-button', buttonbar);
    this.buttons[1].innerHTML = 'Построить БС';
    L.DomEvent.addListener(this.buttons[0], 'click', function(ev){ 
      L.DomEvent.stopPropagation(ev);
      this._selectPanel(0);
      $('.leaflet-container').removeClass('map-cursor-pointer');
    }, this);
    L.DomEvent.addListener(this.buttons[1], 'click', function(ev){ 
      L.DomEvent.stopPropagation(ev);
      this._selectPanel(1);
      $('.leaflet-container').addClass('map-cursor-pointer');
    }, this);

    var inputbar = this.inputs[0] = L.DomUtil.create('div', 'tab-panel-inputbar', container);
    L.DomUtil.create('span', 'tab-panel-label', inputbar).innerText = "Адрес:";
    this.input_address = L.DomUtil.create('input', 'tab-panel-input-address', inputbar);
    L.DomEvent.addListener(this.input_address, 'keydown', function(ev){
      L.DomUtil.removeClass(ev.currentTarget, 'address-notfound');
    }, this);

    var inputbar = this.inputs[1] = L.DomUtil.create('div', 'tab-panel-inputbar', container);
    L.DomUtil.create('span', 'tab-panel-label', inputbar).innerHTML = "Азимут:";
    L.DomUtil.create('input', 'tab-panel-input-azimut', inputbar).value = '0';
    var label = L.DomUtil.create('span', 'tab-panel-label', inputbar);
    label.style.marginLeft = '10px';
    label.innerHTML = "Цвет сектора:"
    this.colorpicker = this.colorPickerSet('#0000ff', this.colorPicker());
    inputbar.appendChild(this.colorpicker);
    container.removeChild(inputbar);

    L.DomEvent.disableClickPropagation(container);

    return container;
  },

  _selectPanel: function(bid) {
    L.DomUtil.removeClass(this.buttons[this.current_button], 'tab-panel-button-active');
    this._container.removeChild(this.inputs[this.current_button]);
    L.DomUtil.addClass(this.buttons[bid], 'tab-panel-button-active');
    this._container.appendChild(this.inputs[bid]);
    this.current_button = bid;
  },

  colorPicker: function(callback) {
    var self = this;
    if (!callback) callback = function(){};
    var colors = ['#777777','#000000','#ff00ff', '#ff0000','#9000ff','#ff6c00','#ffff00','#00ff00','#00aa00','#00ffdd','#0000ff'];
    var container = document.createElement('div');
    container.style.display = 'inline-block';
    colors.forEach(function(color){
      var el = document.createElement('div');
      el.style.display = 'inline-block';
      el.style.backgroundColor = color;
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.float = 'left';
      el.style.border = '1px solid #000000';
      el.style.margin = '2px 2px 2px 2px';
      $(el).click(function(){
        for (var i = 0; i < container.children.length; i++) container.children[i].style.outline = '';
        el.style.outline = '2px solid #000000';
        callback.call(self,color);
      });
      container.appendChild(el);
    });
    return container;
  },

  colorPickerSet: function(color, cp) {
    if (!cp) cp = this.colorpicker;
    var el = document.createElement('div');
    el.style.backgroundColor = color;
    color = el.style.backgroundColor;
    el.remove();
    for (var i = 0; i < cp.children.length; i++) if (cp.children[i].style.backgroundColor === color) break;
    if (i === cp.children.length) return cp;
    for (var j = 0; j < cp.children.length; j++) cp.children[j].style.outline = i === j ? '2px solid #000000' : '';
    return cp;
  },

  colorPickerGet: function(cp) {
    if (!cp) cp = this.colorpicker;
    for (var i = 0; i < cp.children.length; i++) if (cp.children[i].style.outline !== '') return cp.children[i].style.backgroundColor;
    return '#000000';
  }
});
