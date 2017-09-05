/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Colour input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldColour');

goog.require('Blockly.Field');
goog.require('Blockly.DropDownDiv');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.ui.ColorPicker');
goog.require('goog.ui.Slider');

/**
 * Class for a colour input field.
 * @param {string} colour The initial colour in '#rrggbb' format.
 * @param {Function=} opt_validator A function that is executed when a new
 *     colour is selected.  Its sole argument is the new colour value.  Its
 *     return value becomes the selected colour, unless it is undefined, in
 *     which case the new colour stands, or it is null, in which case the change
 *     is aborted.
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldColour = function(colour, opt_validator) {
  Blockly.FieldColour.superClass_.constructor.call(this, colour, opt_validator);
  this.addArgType('colour');
};
goog.inherits(Blockly.FieldColour, Blockly.Field);

/**
 * By default use the global constants for colours.
 * @type {Array.<string>}
 * @private
 */
Blockly.FieldColour.prototype.colours_ = null;

/**
 * By default use the global constants for columns.
 * @type {number}
 * @private
 */
Blockly.FieldColour.prototype.columns_ = 0;

/**
 * Function to be called if eyedropper can be activated.
 * If defined, an eyedropper button will be added to the color picker.
 * The button calls this function with a callback to update the field value.
 */
Blockly.FieldColour.activateEyedropper = null;

/**
 * Path to the eyedropper svg icon.
 */
Blockly.FieldColour.EYEDROPPER_PATH = 'eyedropper.svg';

/**
 * Install this field on a block.
 * @param {!Blockly.Block} block The block containing this field.
 */
Blockly.FieldColour.prototype.init = function(block) {
  Blockly.FieldColour.superClass_.init.call(this, block);
  this.setValue(this.getValue());
};

/**
 * Return the current colour.
 * @return {string} Current colour in '#rrggbb' format.
 */
Blockly.FieldColour.prototype.getValue = function() {
  return this.colour_;
};

/**
 * Set the colour.
 * @param {string} colour The new colour in '#rrggbb' format.
 */
Blockly.FieldColour.prototype.setValue = function(colour) {
  if (this.sourceBlock_ && Blockly.Events.isEnabled() &&
      this.colour_ != colour) {
    Blockly.Events.fire(new Blockly.Events.BlockChange(
        this.sourceBlock_, 'field', this.name, this.colour_, colour));
  }
  this.colour_ = colour;
  if (this.sourceBlock_) {
    // Set the primary, secondary and tertiary colour to this value.
    // The renderer expects to be able to use the secondary color as the fill for a shadow.
    this.sourceBlock_.setColour(colour, colour, this.sourceBlock_.getColourTertiary());
  }
  var makeHueGradient = function(colour, type) {
    var stops = [];
    var hsv = goog.color.hexToHsv(colour);
    for(var n = 0; n <= 360; n++) {
      switch (type) {
        case 'hue':
          stops.push(goog.color.hsvToHex(n, hsv[1], hsv[2]));
          break;
        case 'saturation':
          stops.push(goog.color.hsvToHex(hsv[0], n / 360, hsv[2]));
          break;
        case 'brightness':
          stops.push(goog.color.hsvToHex(hsv[0], hsv[1], 255 * n / 360));
          break;
      }
    }
    return '-webkit-linear-gradient(left, ' + stops.join(',') + ')';
  };

  if (this.hueSlider_) {
    goog.style.setStyle(this.hueSlider_.getElement(), 'background', makeHueGradient(colour, 'hue'));
    goog.style.setStyle(this.saturationSlider_.getElement(), 'background', makeHueGradient(colour, 'saturation'));
    goog.style.setStyle(this.brightnessSlider_.getElement(), 'background', makeHueGradient(colour, 'brightness'));

    var hsv = goog.color.hexToHsv(colour);
    this.hueReadout_.innerHTML = Math.floor(100 * hsv[0] / 360).toFixed(0);
    this.saturationReadout_.innerHTML = Math.floor(100 * hsv[1]).toFixed(0);
    this.brightnessReadout_.innerHTML = Math.floor(100 * hsv[2] / 255).toFixed(0);
  }

};

/**
 * Get the text from this field.  Used when the block is collapsed.
 * @return {string} Current text.
 */
Blockly.FieldColour.prototype.getText = function() {
  var colour = this.colour_;
  // Try to use #rgb format if possible, rather than #rrggbb.
  var m = colour.match(/^#(.)\1(.)\2(.)\3$/);
  if (m) {
    colour = '#' + m[1] + m[2] + m[3];
  }
  return colour;
};

/**
 * Activate the eyedropper, passing in a callback for setting the field value.
 * @private
 */
Blockly.FieldColour.prototype.activateEyedropperInternal_ = function() {
  var thisField = this;
  Blockly.FieldColour.activateEyedropper(function(value) {
    thisField.setValue(value);
  });
};

/**
 * Create label and readout DOM elements, returning the readout
 * @param {string} labelText - Text for the label
 * @return {Array} The container node and the readout node.
 * @private
 */
Blockly.FieldColour.prototype.createLabelDom_ = function (labelText) {
    var labelContainer = document.createElement('div');
    labelContainer.setAttribute('class', 'scratchColorPickerLabel');
    var readout = document.createElement('span');
    readout.setAttribute('class', 'scratchColorPickerReadout');
    var label = document.createElement('span');
    label.setAttribute('class', 'scratchColorPickerLabelText');
    label.innerHTML = labelText;
    labelContainer.appendChild(label);
    labelContainer.appendChild(readout);
    return [labelContainer, readout];
};

/**
 * Create a palette under the colour field.
 * @private
 */
Blockly.FieldColour.prototype.showEditor_ = function() {
  Blockly.DropDownDiv.hideWithoutAnimation();
  Blockly.DropDownDiv.clearContent();
  var div = Blockly.DropDownDiv.getContentDiv();

  var hueElements = this.createLabelDom_('Hue');
  div.appendChild(hueElements[0]);
  this.hueReadout_ = hueElements[1];

  var hueSlider = new goog.ui.Slider();
  hueSlider.setUnitIncrement(5);
  hueSlider.setMinimum(0);
  hueSlider.setMaximum(359);
  hueSlider.render(div);
  hueSlider.animatedSetValue(goog.color.hexToHsv(this.getValue())[0]); // @todo not working?

  var saturationElements = this.createLabelDom_('Saturation');
  div.appendChild(saturationElements[0]);
  this.saturationReadout_ = saturationElements[1];

  var saturationSlider = new goog.ui.Slider();
  saturationSlider.setUnitIncrement(0.01);
  saturationSlider.setStep(0.001);
  saturationSlider.setMinimum(0.01);
  saturationSlider.setMaximum(0.99);
  saturationSlider.render(div);

  var brightnessElements = this.createLabelDom_('Brightness');
  div.appendChild(brightnessElements[0]);
  this.brightnessReadout_ = brightnessElements[1];

  var brightnessSlider = new goog.ui.Slider();
  brightnessSlider.setUnitIncrement(2);
  brightnessSlider.setMinimum(5);
  brightnessSlider.setMaximum(255);
  brightnessSlider.render(div);

  this.hueSlider_ = hueSlider;
  this.saturationSlider_ = saturationSlider;
  this.brightnessSlider_ = brightnessSlider;

  // Configure event handler.
  var thisField = this;
  Blockly.FieldColour.hueChangeEventKey_ = goog.events.listen(hueSlider,
        goog.ui.Component.EventType.CHANGE,
        function(event) {
          var hue = event.target.getValue();
          var hsv = goog.color.hexToHsv(thisField.getValue());
          var colour = goog.color.hsvToHex(hue, hsv[1], hsv[2]);


          if (thisField.sourceBlock_) {
            // Call any validation function, and allow it to override.
            colour = thisField.callValidator(colour);
          }
          if (colour !== null) {
            thisField.setValue(colour);
          }
        });

    // Configure event handler.
  var thisField = this;
  Blockly.FieldColour.saturationChangeEventKey_ = goog.events.listen(saturationSlider,
          goog.ui.Component.EventType.CHANGE,
          function(event) {
            var saturation = event.target.getValue();
            var hsv = goog.color.hexToHsv(thisField.getValue());
            var colour = goog.color.hsvToHex(hsv[0], saturation, hsv[2]);


            if (thisField.sourceBlock_) {
              // Call any validation function, and allow it to override.
              colour = thisField.callValidator(colour);
            }
            if (colour !== null) {
              thisField.setValue(colour);
            }
          });

  if (Blockly.FieldColour.activateEyedropper) {
    var button = document.createElement('button');
    var image = document.createElement('img');
    image.src = Blockly.mainWorkspace.options.pathToMedia + Blockly.FieldColour.EYEDROPPER_PATH;
    button.appendChild(image);
    button.setAttribute('class', 'scratchEyedropper');
    div.appendChild(button);
    Blockly.FieldColour.eyedropperEventData_ = Blockly.bindEventWithChecks_(button,
      'mousedown',
      this,
      this.activateEyedropperInternal_
    );
  }

  // Configure event handler.
  var thisField = this;
  Blockly.FieldColour.brightnessChangeEventKey_ = goog.events.listen(brightnessSlider,
        goog.ui.Component.EventType.CHANGE,
        function(event) {
          var brightness = event.target.getValue();
          var hsv = goog.color.hexToHsv(thisField.getValue());
          var colour = goog.color.hsvToHex(hsv[0], hsv[1], brightness);


          if (thisField.sourceBlock_) {
            // Call any validation function, and allow it to override.
            colour = thisField.callValidator(colour);
          }
          if (colour !== null) {
            thisField.setValue(colour);
          }
        });

  Blockly.DropDownDiv.setColour('#ffffff', '#dddddd');
  Blockly.DropDownDiv.setCategory(this.sourceBlock_.parentBlock_.getCategory());
  Blockly.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_);

  brightnessSlider.animatedSetValue(goog.color.hexToHsv(this.getValue())[2]);
  saturationSlider.animatedSetValue(goog.color.hexToHsv(this.getValue())[1]);
  hueSlider.animatedSetValue(goog.color.hexToHsv(this.getValue())[0]);

  this.setValue(this.getValue());
};

/**
 * Hide the colour palette.
 * @private
 */
Blockly.FieldColour.widgetDispose_ = function() {
  if (Blockly.FieldColour.hueChangeEventKey_) {
    goog.events.unlistenByKey(Blockly.FieldColour.hueChangeEventKey_);
  }
  if (Blockly.FieldColour.saturationChangeEventKey_) {
    goog.events.unlistenByKey(Blockly.FieldColour.saturationChangeEventKey_);
  }
  if (Blockly.FieldColour.brightnessChangeEventKey_) {
    goog.events.unlistenByKey(Blockly.FieldColour.brightnessChangeEventKey_);
  }
  if (Blockly.FieldColour.eyedropperEventData_) {
    Blockly.unbindEvent_(Blockly.FieldColour.eyedropperEventData_);
  }
  Blockly.Events.setGroup(false);
};
