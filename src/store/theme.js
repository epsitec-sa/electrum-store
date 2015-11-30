'use strict';

class Theme {
  constructor (name, typo, palette, colors, transitions, spacing, shapes) {
    this._name = name;
    this._typo = typo;
    this._palette = palette;
    this._colors = colors;
    this._transitions = transitions;
    this._spacing = spacing;
    this._shapes = shapes;
  }

  get name () {
    return this._name;
  }

  get typo () {
    return this._typo;
  }

  get palette () {
    return this._palette;
  }

  get colors () {
    return this._colors;
  }

  get transitions () {
    return this._transitions;
  }

  get spacing () {
    return this._spacing;
  }

  get shapes () {
    return this._shapes;
  }

  static create(name) {
    return new Theme (name, {}, {}, {}, {}, {}, {});
  }
}

module.exports = Theme;
