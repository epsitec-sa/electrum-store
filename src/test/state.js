'use strict';

import {expect} from 'mai-chai';
import {State, Store} from '../index.js';

describe ('State', () => {
  describe ('constructor()', () => {
    it ('cannot be called directly', () => {
      expect (() => new State ('a')).to.throw (Error);
    });
  });

  describe ('create()', () => {
    it ('requires a valid id of type string', () => {
      expect (() => State.create ()).to.throw (Error);
      expect (() => State.create (123)).to.throw (Error);
      expect (() => State.create ('')).to.throw (Error);
    });

    it ('accepts at most two arguments', () => {
      expect (() => State.create ('a', {}, 123)).to.throw (Error);
    });

    it ('creates an empty state', () => {
      const state = State.create ('a');
      expect (state).to.exist ();
      expect (state).to.have.property ('id', 'a');
      expect (state.get ()).to.equal (undefined);
    });

    it ('creates an empty state with initial values', () => {
      const state = State.create ('a', {'': 123, foo: 'bar'});
      expect (state).to.exist ();
      expect (state).to.have.property ('id', 'a');
      expect (state).to.have.property ('value', 123);
      expect (state.get ()).to.equal (123);
      expect (state.get ('foo')).to.equal ('bar');
    });
  });

  describe ('get()', () => {
    it ('accepts any type of id', () => {
      const state = State.create ('a', {123: 'X', y: 'Y'});
      expect (state.get (123)).to.equal ('X');
      expect (state.get ('y')).to.equal ('Y');
    });

    it ('returns undefined for unknown id', () => {
      const state = State.create ('a', {123: 'X', y: 'Y'});
      expect (state.get ('z')).to.be.undefined ();
    });
  });

  describe ('contains()', () => {
    it ('returns true for existing id', () => {
      const state = State.create ('a', {123: 'X', y: 'Y'});
      expect (state.contains (123)).to.equal (true);
      expect (state.contains ('y')).to.equal (true);
    });

    it ('returns false for unknown id', () => {
      const state = State.create ('a', {123: 'X', y: 'Y'});
      expect (state.contains ('z')).to.equal (false);
    });
  });

  describe ('set()', () => {
    it ('produces new instance of state', () => {
      const state1 = State.create ('a', {a: 1});
      const state2 = state1.set ('b', 2);
      expect (state1.get ('a')).to.equal (1);
      expect (state2.get ('a')).to.equal (1);
      expect (state2.get ('b')).to.equal (2);
    });

    it ('produces new instance of state', () => {
      const state1 = State.create ('a', {'': 'x'});
      const state2 = state1.set ('y');
      expect (state1.get ()).to.equal ('x');
      expect (state2.get ()).to.equal ('y');
    });
  });

  describe ('select()', () => {
    it ('selects child state', () => {
      const store = Store.create ();
      const state3 = store.select ('a.b.c');
      const state1 = store.select ('a');
      const state2 = store.select ('a.b');
      const root = store.root;
      expect (root).to.have.property ('id', '');
      expect (root.select ()).to.equal (root);
      expect (root.select ('a')).to.equal (state1);
      expect (root.select ('a.b')).to.equal (state2);
      expect (root.select ('a.b.c')).to.equal (state3);
      expect (root.select ('a.x')).to.exist ();
      expect (state1.select ('b')).to.equal (state2);
      expect (state1.select ('b.c')).to.equal (state3);
      expect (state1.select ()).to.equal (state1);
      expect (state1.select ('')).to.equal (state1);
    });

    it ('without arguments selects self', () => {
      const store = Store.create ();
      const state1 = store.select ('a');
      const state2 = state1.select ();
      expect (state2).to.equal (state1);
    });

    it ('throws for invalid ids', () => {
      const store = Store.create ();
      expect (() => store.root.select (1)).to.throw (Error);
      expect (() => store.root.select ({})).to.throw (Error);
    });
  });

  describe ('find()', () => {
    it ('selects child state', () => {
      const store = Store.create ();
      const state3 = store.select ('a.b.c');
      const state1 = store.select ('a');
      const state2 = store.select ('a.b');
      const root = store.root;
      expect (root).to.have.property ('id', '');
      expect (root.find ()).to.equal (root);
      expect (root.find ('a')).to.equal (state1);
      expect (root.find ('a.b')).to.equal (state2);
      expect (root.find ('a.b.c')).to.equal (state3);
      expect (root.find ('a.x')).to.not.exist ();
      expect (state1.find ('b')).to.equal (state2);
      expect (state1.find ('b.c')).to.equal (state3);
      expect (state1.find ()).to.equal (state1);
      expect (state1.find ('')).to.equal (state1);
    });

    it ('without arguments finds self', () => {
      const store = Store.create ();
      const state1 = store.select ('a');
      const state2 = state1.find ();
      expect (state2).to.equal (state1);
    });

    it ('throws for invalid ids', () => {
      const store = Store.create ();
      expect (() => store.root.find (1)).to.throw (Error);
      expect (() => store.root.find ({})).to.throw (Error);
    });
  });

  describe ('any()', () => {
    it ('returns true if state contains children', () => {
      const store = Store.create ();
      store.select ('a.b.c');
      const root = store.root;
      expect (root.any ()).to.be.true ();
      expect (root.any ('a')).to.be.true ();
      expect (root.any ('a.b')).to.be.true ();
    });
    it ('returns false if state contains no children', () => {
      const store = Store.create ();
      store.select ('a.b.c');
      const root = store.root;
      expect (root.any ('a.b.c')).to.be.false (); // exists, but is empty
    });
    it ('returns false if state does not exist', () => {
      const store = Store.create ();
      store.select ('a.b.c');
      const root = store.root;
      expect (root.any ('a.b.d')).to.be.false (); // does not exist
    });
    it ('returns true if state contains nodes', () => {
      const store = Store.create ();
      expect (store.root.any ('a.b.c')).to.be.false ();
      store.select ('a.b.c').set ('x', 'X');
      expect (store.root.any ('a.b.c')).to.be.true ();
    });
  });

  describe ('keys', () => {
    it ('returns keys of children', () => {
      const store = Store.create ();
      store.select ('a.1');
      store.select ('a.b.c');
      store.select ('a.b.d');
      store.select ('a.10');
      store.select ('a.2');
      const state = store.find ('a');
      const arr = state.keys;
      expect (arr).to.deep.equal (['1', 'b', '10', '2']);
    });
  });

  describe ('indexKeys', () => {
    it ('returns sorted index keys', () => {
      const store = Store.create ();
      store.select ('a.1');
      store.select ('a.10');
      store.select ('a.2');
      store.select ('a.b.c');
      const state = store.find ('a');
      const arr = state.indexKeys;
      expect (arr).to.deep.equal ([1, 2, 10]);
    });
  });

  describe ('parentId', () => {
    it ('returns the parent id', () => {
      const store = Store.create ();
      const state = store.select ('a.b.c');
      expect (state.parentId).to.equal ('a.b');
      expect (store.find ('a').parentId).to.equal ('');
    });

    it ('returns undefined for the root', () => {
      const store = Store.create ();
      store.select ('a.b.c');
      expect (store.root.parentId).to.not.exist ();
    });
  });

  describe ('getInherited', () => {
    const store = Store.create ();
    store.select ('a.b.c');
    store.select ('a').set ('x', 1);
    store.select ('a.b').set ('x', 2);
    store.root.set ('y', 3);
    store.select ('a').set ('z', 4);

    it ('returns the first value found in the tree', () => {
      expect (store.find ('a.b.c').getInherited ('x')).to.equal (2);
      expect (store.find ('a.b').getInherited ('x')).to.equal (2);
      expect (store.find ('a').getInherited ('x')).to.equal (1);
      expect (store.root.getInherited ('x')).to.not.exist ();
      expect (store.root.getInherited ('y')).to.equal (3);
      expect (store.find ('a.b.c').getInherited ('z')).to.equal (4);
      expect (store.find ('a.b.c').getInherited ('y')).to.equal (3);
    });
  });
});
