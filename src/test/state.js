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
});
