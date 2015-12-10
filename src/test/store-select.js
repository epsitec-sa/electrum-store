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
      expect (store.root.generation).to.equal (1);
      expect (state.id).to.equal ('a.b.c');
    });

    it ('returns existing states', () => {
      const store = Store.create ('x');
      const state1 = store.setState ('a.b.c');
      const state2 = store.select ('a');
      const state3 = store.select ('a.b');
      const state4 = store.select ('a.b.c');
      expect (state1).to.equal (state4);
      expect (state1.generation).to.equal (1);
      expect (state2.generation).to.equal (1);
      expect (state3.generation).to.equal (1);
      expect (state4.generation).to.equal (1);
    });

    it ('throws for invalid ids', () => {
      const store = Store.create ();
      expect (() => store.select (1)).to.throw (Error);
      expect (() => store.select ({})).to.throw (Error);
    });

    it ('returns root node for id=""', () => {
      const store = Store.create ('x');
      const state = store.select ('');
      expect (state).to.equal (store.root);
      expect (state.generation).to.equal (0);
    });

    it ('returns root node without id', () => {
      const store = Store.create ('x');
      const state = store.select ();
      expect (state).to.equal (store.root);
      expect (state.generation).to.equal (0);
    });
  });
});
