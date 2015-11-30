'use strict';

import {expect} from 'mai-chai';
import {Theme} from 'electrum-store';

describe ('Theme', () => {
  describe ('new Theme()', () => {
    it ('cannot be called directly', () => {
      expect (() => new Theme ('x')).to.throw (Error);
    });
  });

  describe ('create()', () => {
    it ('requires a valid name', () => {
      expect (() => Theme.create ()).to.throw (Error);
      expect (() => Theme.create (123)).to.throw (Error);
      expect (() => Theme.create ('')).to.throw (Error);
    });

    it ('creates a Theme with initialized properties', () => {
      const theme = Theme.create ('default');
      expect (theme.colors).to.have.property ('red50');
      expect (theme.palette).to.have.property ('primary1Color');
      expect (theme.shapes).to.have.property ('defaultBorderRadius');
      expect (theme.spacing).to.have.property ('iconSize');
      expect (theme.timing).to.have.property ('timeBase');
      expect (theme.transitions).to.have.property ('defaultTransition');
      expect (theme.typo).to.have.property ('font');
    });
  });
});
