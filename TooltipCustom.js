/*
TooltipCustom.js - part of bsmap

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
/*globals L */

L.TooltipCustom = L.Tooltip.extend({
	options: {
		interactive: true,
		permanent: true,
    opacity: 0.7
	},

	onAdd: function (map) {
		L.Tooltip.prototype.onAdd.call(this, map);
		this._initInteraction();
		console.log('Custom tooltip added.');
	},

	_initInteraction: function () {
		this.dragging = new L.Handler.TooltipCustomDrag(this);
		this.dragging.enable();
	}
});
L.tooltipCustom = function (options, source) {
	return new L.TooltipCustom(options, source);
};

L.Handler.TooltipCustomDrag = L.Handler.extend({
	initialize: function (tooltip) {
		this._tooltip = tooltip;
	},
	addHooks: function () {
		console.log('addHooks');
		var container = this._tooltip.getElement();
		if (!this._dragable){
			this._dragable = new L.Draggable(container, container, true);
		}
		this._dragable.on({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).enable();
	},
	removeHooks: function () {
		this._dragable.off({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).disable();
	},
	_onDragStart: function () {
		console.log('_onDragStart');
	},
	_onDrag: function (e) {
		console.log('_onDrag', 'e:', e);
	},
	_onDragEnd: function (e) {
		console.log('_onDragEnd', 'e:', e);
	}
});



L.Layer.include({
	bindTooltipCustom: function (content, options) {
		var tooltip = L.tooltipCustom(options, this);
		tooltip.setContent(content);
		this.bindTooltip(tooltip, options);
	}
});