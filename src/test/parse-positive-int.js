'use strict';

import {expect} from 'mai-chai';

import {parsePositiveInt, isPositiveInt} from 'electrum-utils';

describe ('Utilities', () => {
  describe ('parsePositiveInt()', () => {
    it ('acceps positive numbers', () => {
      expect (parsePositiveInt (0)).to.equal (0);
      expect (parsePositiveInt (1)).to.equal (1);
      expect (parsePositiveInt (999999999)).to.equal (999999999);
      expect (parsePositiveInt ('0')).to.equal (0);
      expect (parsePositiveInt ('1')).to.equal (1);
      expect (parsePositiveInt ('999999999')).to.equal (999999999);
      expect (parsePositiveInt (Number (1))).to.equal (1);
    });

    it ('rejects negative numbers', () => {
      expect (parsePositiveInt (-1)).to.be.NaN ();
      expect (parsePositiveInt ('-1')).to.be.NaN ();
    });

    it ('rejects real numbers', () => {
      expect (parsePositiveInt (1.1)).to.be.NaN ();
      expect (parsePositiveInt ('1.1')).to.be.NaN ();
    });

    it ('rejects invalid values', () => {
      expect (parsePositiveInt ('abc')).to.be.NaN ();
      expect (parsePositiveInt ('0x1')).to.be.NaN ();
    });
  });

  describe ('isPositiveInt()', () => {
    it ('returns true for valid numbers', () => {
      expect (isPositiveInt (0)).to.be.true ();
      expect (isPositiveInt ('0')).to.be.true ();
      expect (isPositiveInt (123)).to.be.true ();
      expect (isPositiveInt ('123')).to.be.true ();
    });

    it ('returns false for invalid numbers', () => {
      expect (isPositiveInt (-1)).to.be.false ();
      expect (isPositiveInt (1.1)).to.be.false ();
      expect (isPositiveInt ('x')).to.be.false ();
      expect (isPositiveInt ('123x')).to.be.false ();
      expect (isPositiveInt ({})).to.be.false ();
    });
  });
});
