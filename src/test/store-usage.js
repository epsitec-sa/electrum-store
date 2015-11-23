'use strict';

import {expect} from 'mai-chai';

import Node from '../store/node.js';
import Store from '../store/store.js';

describe ('Store', () => {
  describe ('basic operations', () => {
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
        expect (store.nodeCount).to.equal (0);
        expect (store.generation).to.equal (0);
        expect (store.id).to.equal ('x');
      });

      it ('creates a store with an empty root node', () => {
        const store = Store.create ();
        expect (store.root).to.exist ();
        expect (store.root.store).to.equal (store);
        expect (store.root.id).to.equal ('');
        expect (store.root).to.equal (store.getNode (''));
        expect (store.root).to.equal (store.findNode (''));
      });

      it ('creates a store with an immutable root node', () => {
        const store = Store.create ();
        expect (() => Node.withValue (store.root, 'x', 1)).to.throw (Error);
      });
    });
  });
});
