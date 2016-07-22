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
		}, this);
		L.DomEvent.addListener(this.buttons[1], 'click', function(ev){ 
		  L.DomEvent.stopPropagation(ev);
		  this._selectPanel(1);
		}, this);

		var inputbar = this.inputs[0] = L.DomUtil.create('div', 'tab-panel-inputbar', container);
		L.DomUtil.create('span', 'tab-panel-label', inputbar).innerText = "Адрес:";
		this.input_address = L.DomUtil.create('input', 'tab-panel-input-address', inputbar);
		L.DomEvent.addListener(this.input_address, 'keydown', function(ev){
			L.DomUtil.removeClass(ev.currentTarget, 'address-notfound');
		}, this);

		var inputbar = this.inputs[1] = L.DomUtil.create('div', 'tab-panel-inputbar', container);
		L.DomUtil.create('span', 'tab-panel-label', inputbar).innerText = "Азимут:";
		L.DomUtil.create('input', 'tab-panel-input-azimut', inputbar).value = '0';
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
	}
});
