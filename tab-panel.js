L.Control.Panel = L.Control.extend({
  options: {
    position: 'topleft',
    popups: true
  },

  initialize: function (options) {
    L.Util.setOptions(this, options);
  },

  onAdd: function () {
    var line, el, span;
    this.buttons = [];
    this.inputs = [];
    this.current_button = 0;

    var container = this._container = L.DomUtil.create('div', 'tab-panel');

    var buttonbar = L.DomUtil.create('div', 'tab-panel-buttonbar', container);

    this.buttons[0] = L.DomUtil.create('span', 'tab-panel-button tab-panel-button-active', buttonbar);
    this.buttons[0].innerHTML = 'Поиск адреса';
    this.buttons[1] = L.DomUtil.create('span', 'tab-panel-button', buttonbar);
    this.buttons[1].innerHTML = 'Построить БС';
    this.buttons[2] = L.DomUtil.create('span', 'tab-panel-button', buttonbar);
    this.buttons[2].innerHTML = 'Область работы БС';
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
    L.DomEvent.addListener(this.buttons[2], 'click', function(ev){
      L.DomEvent.stopPropagation(ev);
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
    L.DomUtil.create('input', 'tab-panel-input-azimut', line).value = '0';
    el = L.DomUtil.create('span', 'tab-panel-label', line);
    el.style.marginLeft = '10px';
    el.innerHTML = "Цвет сектора:";
    this.colorpicker = this.colorPickerSet('#0000ff', this.colorPicker());
    line.appendChild(this.colorpicker);
    L.DomUtil.create('div', 'tab-panel-inputbar-separator', this.inputs[1]);
    line = L.DomUtil.create('div', 'tab-panel-inputbar-help', this.inputs[1]);
    line.innerHTML = 'Для того, что бы <b>построить</b> БС - введите требуемый азимут, выберите цвет и кликните левой клавишей мышки на карте в месте ее расположения. Для <b>перемещения</b> построенной БС - перетащите маркер.';

    this.inputs[2] = L.DomUtil.create('div', 'tab-panel-inputbar-container');
    line = L.DomUtil.create('div', 'tab-panel-inputbar', this.inputs[2]);
    L.DomUtil.create('span', 'tab-panel-label', line).innerHTML = "Оператор:";

    span = L.DomUtil.create('span', 'tab-panel-region-btn tab-panel-region-btn-active', line);
    el = L.DomUtil.create('input', 'tab-panel-region-oper', span);
    el.type = 'radio';
    el.name = 'network';
    el.value = '03';
    el.checked = 1;
    L.DomUtil.create('img', '', span).src = 'images/kyivstar.png';
    L.DomEvent.addListener(span, 'click', function(ev){
      L.DomEvent.stopPropagation(ev);
      $('span.tab-panel-region-btn').removeClass('tab-panel-region-btn-active');
      $('span.tab-panel-region-btn').eq(0).addClass('tab-panel-region-btn-active');
      $('input.tab-panel-region-oper').eq(0).prop("checked", true);
    }, this);

    span = L.DomUtil.create('span', 'tab-panel-region-btn', line);
    el = L.DomUtil.create('input', 'tab-panel-region-oper', span);
    el.type = 'radio';
    el.name = 'network';
    el.value = '01';
    L.DomUtil.create('img', '', span).src = 'images/mts.png';
    L.DomEvent.addListener(span, 'click', function(ev){
      L.DomEvent.stopPropagation(ev);
      $('span.tab-panel-region-btn').removeClass('tab-panel-region-btn-active');
      $('span.tab-panel-region-btn').eq(1).addClass('tab-panel-region-btn-active');
      $('input.tab-panel-region-oper').eq(1).prop("checked", true);
    }, this);

    span = L.DomUtil.create('span', 'tab-panel-region-btn', line);
    el = L.DomUtil.create('input', 'tab-panel-region-oper', span);
    el.type = 'radio';
    el.name = 'network';
    el.value = '06';
    L.DomUtil.create('img', '', span).src = 'images/life.png';
    L.DomEvent.addListener(span, 'click', function(ev){
      L.DomEvent.stopPropagation(ev);
      $('span.tab-panel-region-btn').removeClass('tab-panel-region-btn-active');
      $('span.tab-panel-region-btn').eq(2).addClass('tab-panel-region-btn-active');
      $('input.tab-panel-region-oper').eq(2).prop("checked", true);
    }, this);

    el = L.DomUtil.create('span', 'tab-panel-label', line);
    el.style.marginLeft = '10px';
    el.innerHTML = "LAC:";
    L.DomUtil.create('input', 'tab-panel-input-lac', line).value = '0';
    el = L.DomUtil.create('span', 'tab-panel-label', line);
    el.style.marginLeft = '5px';
    el.innerHTML = "CID:";
    L.DomUtil.create('input', 'tab-panel-input-cid', line).value = '0';
    el = L.DomUtil.create('span', 'tab-panel-button tab-panel-button-lookup-region', line);
    el.style.perspective =  '780px';
    el.style.marginLeft = '10px';
    el.innerHTML = 'Начать поиск';
    L.DomEvent.addListener(el, 'click', function(ev){
      L.DomEvent.stopPropagation(ev);
      this._lookupRegion();
    }, this);

    L.DomUtil.create('div', 'tab-panel-inputbar-separator', this.inputs[2]);
    line = L.DomUtil.create('div', 'tab-panel-inputbar-help', this.inputs[2]);
    line.innerHTML = 'No help. В процессе разработки.';

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
    app.lookupRegion();
  },

  _lookupRegionStop: function(focus) {
    delete this.inlookupregion;
    var el = $('.tab-panel-button-lookup-region')[0];
    el.innerHTML = 'Начать поиск';
    if (focus) focus.focus();
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
