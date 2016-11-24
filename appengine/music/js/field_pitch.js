/**
 * @license
 * Blockly Games: Music
 *
 * Copyright 2016 Google Inc.
 * https://github.com/google/blockly-games
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
 * @fileoverview Music pitch input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldPitch');

goog.require('Blockly.FieldTextInput');
goog.require('goog.math');
goog.require('goog.userAgent');


/**
 * Class for an editable pitch field.
 * @param {string} text The initial content of the field.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
Blockly.FieldPitch = function(text) {
  Blockly.FieldPitch.superClass_.constructor.call(this, text);
};
goog.inherits(Blockly.FieldPitch, Blockly.FieldTextInput);

/**
 * All notes available for the picker.
 * First element is human-readable scale, second element is MIDI number.
 */
Blockly.FieldPitch.NOTES = [
  ['C3', '48'],
  ['D3', '50'],
  ['E3', '52'],
  ['F3', '53'],
  ['G3', '55'],
  ['A3', '57'],
  ['B3', '59'],
  ['C4', '60'],
  ['D4', '62'],
  ['E4', '64'],
  ['F4', '65'],
  ['G4', '67'],
  ['A4', '69']
];

/**
 * Language-neutral currently selected value (MIDI number).
 * @type {string}
 * @private
 */
Blockly.FieldPitch.prototype.value_ = '';

/**
 * Clean up this FieldPitch, as well as the inherited FieldTextInput.
 * @return {!Function} Closure to call on destruction of the WidgetDiv.
 * @private
 */
Blockly.FieldPitch.prototype.dispose_ = function() {
  var thisField = this;
  return function() {
    Blockly.FieldPitch.superClass_.dispose_.call(thisField)();
    thisField.imageElement_ = null;
    if (thisField.clickWrapper_) {
      Blockly.unbindEvent_(thisField.clickWrapper_);
    }
    if (thisField.moveWrapper_) {
      Blockly.unbindEvent_(thisField.moveWrapper_);
    }
  };
};

/**
 * Show the inline free-text editor on top of the text and the note picker.
 * @private
 */
Blockly.FieldPitch.prototype.showEditor_ = function() {
  var noFocus =
      goog.userAgent.MOBILE || goog.userAgent.ANDROID || goog.userAgent.IPAD;
  // Mobile browsers have issues with in-line textareas (focus & keyboards).
  Blockly.FieldPitch.superClass_.showEditor_.call(this, noFocus);
  var div = Blockly.WidgetDiv.DIV;
  if (!div.firstChild) {
    // Mobile interface uses Blockly.prompt.
    return;
  }
  // Build the DOM.
  this.imageElement_ = document.createElement('div');
  this.imageElement_.id = 'notePicker';
  div.appendChild(this.imageElement_);

  // The note picker is different from other fields in that it updates on
  // mousemove even if it's not in the middle of a drag.  In future we may
  // change this behaviour.  For now, using bindEvent_ instead of
  // bindEventWithChecks_ allows it to work without a mousedown/touchstart.
  this.clickWrapper_ =
      Blockly.bindEvent_(this.imageElement_, 'click', this,
      Blockly.WidgetDiv.hide);
  this.moveWrapper_ =
      Blockly.bindEvent_(this.imageElement_, 'mousemove', this,
      this.onMouseMove);
  this.updateGraph_();
};

/**
 * Set the note to match the mouse's position.
 * @param {!Event} e Mouse move event.
 */
Blockly.FieldPitch.prototype.onMouseMove = function(e) {
  var bBox = this.imageElement_.getBoundingClientRect();
  var dy = e.clientY - bBox.top;
  var note = goog.math.clamp(Math.round(13.5 - dy / 7.5), 0, 12);
  this.imageElement_.style.backgroundPosition = (-note * 37) + 'px 0';
  Blockly.FieldTextInput.htmlInput_.value = Blockly.FieldPitch.NOTES[note][0];
  this.setValue(Blockly.FieldPitch.NOTES[note][1]);
  this.validate_();
  this.resizeEditor_();
};

/**
 * Set a new note, also set the corresponding MIDI value, and update the picker.
 * @param {?string} newText New text.
 */
Blockly.FieldPitch.prototype.setText = function(newText) {
  newText = this.callValidator(newText) || newText;
  Blockly.FieldPitch.superClass_.setText.call(this, newText);
  if (!this.textElement_) {
    // Not rendered yet.
    return;
  }
  var options = Blockly.FieldPitch.NOTES;
  for (var i = 0; i < options.length; i++) {
    // Options are tuples of human-readable text and language-neutral values.
    if (options[i][0] == newText) {
      this.value_ = options[i][1];
      break;
    }
  }
  this.updateGraph_();
};

/**
 * Get the language-neutral value from this note picker.
 * @return {string} Current text.
 */
Blockly.FieldPitch.prototype.getValue = function() {
  return this.value_;
};

/**
 * Set the language-neutral value for this note picker.
 * @param {string} newValue New value to set.
 */
Blockly.FieldPitch.prototype.setValue = function(newValue) {
  if (newValue === null || newValue === this.value_) {
    return;  // No change if null.
  }
  this.value_ = newValue;
  // Look up and display the human-readable text.
  var options = Blockly.FieldPitch.NOTES;
  for (var i = 0; i < options.length; i++) {
    // Options are tuples of human-readable text and language-neutral values.
    if (options[i][1] == newValue) {
      this.setText(options[i][0]);
      return;
    }
  }
  throw 'Invalid note value: ' + newValue;
};

/**
 * Redraw the note picker with the current note.
 * @private
 */
Blockly.FieldPitch.prototype.updateGraph_ = function() {
  if (!this.imageElement_) {
    return;
  }
  var value = this.getValue();
  var options = Blockly.FieldPitch.NOTES;
  for (var i = 0; i < options.length; i++) {
    if (options[i][1] == value) {
      this.imageElement_.style.backgroundPosition = (-i * 37) + 'px 0';
      return;
    }
  }
};

/**
 * Ensure that only a valid note may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid note, or null if invalid.
 */
Blockly.FieldPitch.prototype.classValidator = function(text) {
  if (text === null) {
    return null;
  }
  text = text.trim().toUpperCase();
  for (var i = 0, tuple; tuple = Blockly.FieldPitch.NOTES[i]; i++){
    if (text == tuple[0]) {
      return text;
    }
  }
  return null;
};
