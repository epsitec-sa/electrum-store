'use strict';

import {expect} from 'mai-chai';
import {Store} from '../index.js';

describe ('Store', () => {
  describe ('select()', () => {
    it ('creates missing states', () => {
      const store = Store.create ('x');
      const state = store.select ('a.b.c');
      expect (store.stateCount).to.equal (3);
      expect (store.generation).to.equal (1);
      expect (state.id).to.equal ('a.b.c');
    });
  });
});
