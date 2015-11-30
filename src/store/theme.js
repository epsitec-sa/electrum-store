'use strict';

import {Colors, Spacing, Timing} from './themes/default';

import {
  paletteBuilder,
  shapesBuilder,
  transitionsBuilder,
  typoBuilder
} from './themes/default';

/******************************************************************************/

const secretKey = {};

/******************************************************************************/

class Theme {
  constructor (name, key, colors, palette, shapes, spacing, timing, transitions, typo) {
    if (key !== secretKey) {
      throw new Error ('Do not call Theme constructor directly; use Theme.create instead');
    }
    if (!typo.font) {
      throw new Error ('Typo has no default font');
    }
    this._name = name;
    this._colors = colors;
    this._palette = palette;
    this._shapes = shapes;
    this._spacing = spacing;
    this._timing = timing;
    this._transitions = transitions;
    this._typo = typo;
  }

  get name () {
    return this._name;
  }

  get colors () {
    return this._colors;
  }

  get palette () {
    return this._palette;
  }

  get shapes () {
    return this._shapes;
  }

  get spacing () {
    return this._spacing;
  }

  get timing () {
    return this._timing;
  }

  get transitions () {
    return this._transitions;
  }

  get typo () {
    return this._typo;
  }

  static create (name) {
    if ((typeof name !== 'string') ||
        (name.length === 0)) {
      throw new Error ('name must be a valid string');
    }
    const Palette     = paletteBuilder (Colors);
    const Shapes      = shapesBuilder (Spacing);
    const Transitions = transitionsBuilder (Timing);
    const Typo        = typoBuilder (Spacing);

    return new Theme (name, secretKey,
      Colors,
      Palette,
      Shapes,
      Spacing,
      Timing,
      Transitions,
      Typo);
  }
}

/******************************************************************************/

module.exports = Theme;
