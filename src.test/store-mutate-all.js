/* global describe it */

import {expect} from 'mai-chai';
import {Store} from 'electrum-store';

describe ('Store', () => {
  describe ('Store.mutateAll()', () => {
    it ('mutates all nodes', () => {
      const store = Store.create ();
      const state1 = store.select ('a.b.c').set ('x', 1);
      const state2 = store.select ('a.b.d').set ('y', 2);
      expect (store.stateCount).to.equal (4);
      expect (store.generation).to.equal (4);
      expect (state1.generation).to.equal (2);
      expect (state2.generation).to.equal (4);
      expect (store.find ('a.b.c')).to.equal (state1);
      expect (store.find ('a.b.d')).to.equal (state2);
      // Act: this should produce new nodes for every registered state
      store.mutateAll ();
      expect (store.stateCount).to.equal (4);
      expect (store.generation).to.equal (5);
      expect (store.find ('a.b.c').generation).to.equal (5);
      expect (store.find ('a.b.d').generation).to.equal (5);
      expect (store.find ('a.b.c')).to.not.equal (state1);
      expect (store.find ('a.b.d')).to.not.equal (state2);
      expect (store.find ('a.b.c').get ('x')).to.equal (1);
      expect (store.find ('a.b.d').get ('y')).to.equal (2);
    });
  });
});
