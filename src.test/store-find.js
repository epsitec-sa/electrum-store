/* global describe it */

import {expect} from 'mai-chai';
import {Store} from 'electrum-store';

describe ('Store', () => {
  describe ('find()', () => {
    it ('does not create missing states', () => {
      const store = Store.create ('x');
      const state = store.find ('a.b.c');
      expect (store.stateCount).to.equal (0);
      expect (store.generation).to.equal (0);
      expect (state).to.be.undefined ();
    });

    it ('returns existing states', () => {
      const store = Store.create ('x');
      const state1 = store.setState ('a.b.c');
      const state2 = store.find ('a');
      const state3 = store.find ('a.b');
      const state4 = store.find ('a.b.c');
      expect (state1).to.equal (state4);
      expect (state1.generation).to.equal (1);
      expect (state2.generation).to.equal (1);
      expect (state3.generation).to.equal (1);
      expect (state4.generation).to.equal (1);
    });

    it ('throws for invalid ids', () => {
      const store = Store.create ();
      expect (() => store.find (1)).to.throw (Error);
      expect (() => store.find ({})).to.throw (Error);
    });

    it ('returns root node for id=""', () => {
      const store = Store.create ('x');
      const state = store.find ('');
      expect (state).to.equal (store.root);
      expect (state.generation).to.equal (0);
    });

    it ('returns root node without id', () => {
      const store = Store.create ('x');
      const state = store.find ();
      expect (state).to.equal (store.root);
      expect (state.generation).to.equal (0);
    });
  });
});
