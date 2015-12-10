'use strict';

import {expect} from 'mai-chai';
import {State, Store} from '../index.js';

describe ('Store', () => {
  describe ('constructor()', () => {
    it ('cannot be called directly', () => {
      expect (() => new Store ()).to.throw (Error);
      expect (() => new Store ('x')).to.throw (Error);
      expect (() => new Store ('x', {})).to.throw (Error);
    });
  });

  describe ('Store.create()', () => {
    it ('creates an empty store', () => {
      const store = Store.create ('x');
      expect (store).to.exist ();
      expect (store.stateCount).to.equal (0);
      expect (store.generation).to.equal (0);
      expect (store.id).to.equal ('x');
    });

    it ('creates a store with an empty root state', () => {
      const store = Store.create ();
      expect (store.root).to.exist ();
      expect (store.root.store).to.equal (store);
      expect (store.root.id).to.equal ('');
      expect (store.root).to.equal (store.select (''));
      expect (store.root).to.equal (store.find (''));
      expect (store.root).to.equal (store.find ());
    });

    it ('creates a store with a mutable root state', () => {
      const store = Store.create ();
      const root1 = store.root;
      const root2 = State.withValue (root1, 'x', 10);
      expect (root1).to.not.equal (root2);
      expect (root1.get ('x')).to.be.undefined ();
      expect (root2.get ('x')).to.equal (10);
      expect (store.root).to.equal (root2);
    });
  });
});
