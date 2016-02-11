'use strict';

import {expect} from 'mai-chai';
import {State} from '../index.js';

describe ('State', () => {
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

  describe ('State.join()', () => {
    it ('returns a joined path', () => {
      expect (State.join ('a', 'b', 'c')).to.equal ('a.b.c');
    });

    it ('throws if path elements are empty', () => {
      expect (() => State.join ('a', '', 'c')).to.throw (Error);
    });
  });

  describe ('State.getLeafId()', () => {
    it ('returns the leaf id', () => {
      expect (State.getLeafId ('a.b.c')).to.equal ('c');
      expect (State.getLeafId ('a.b')).to.equal ('b');
      expect (State.getLeafId ('a')).to.equal ('a');
      expect (State.getLeafId ('')).to.equal ('');
      expect (State.getLeafId ()).to.be.undefined ();
    });
  });

  describe ('State.getParentId()', () => {
    it ('returns the parent id', () => {
      expect (State.getParentId ('a.b.c')).to.equal ('a.b');
      expect (State.getParentId ('a.b')).to.equal ('a');
      expect (State.getParentId ('a')).to.equal ('');
      expect (State.getParentId ('')).to.be.undefined ();
    });

    it ('throws if the id is not valid', () => {
      expect (() => State.getParentId (123)).to.throw (Error);
    });
  });

  describe ('State.getAncestorId()', () => {
    it ('returns the ancestor id', () => {
      expect (State.getAncestorId ('a.b.c', 'c')).to.equal ('a.b.c');
      expect (State.getAncestorId ('a.b.c', 'b')).to.equal ('a.b');
      expect (State.getAncestorId ('a.b.c', 'a')).to.equal ('a');
      expect (State.getAncestorId ('a.b.c', '')).to.equal ('');
    });

    it ('accepts numeric part', () => {
      expect (State.getAncestorId ('a.1.c', 1)).to.equal ('a.1');
    });

    it ('returns undefined when there is no match', () => {
      expect (State.getAncestorId ('a.b.c', 'x')).to.be.undefined ();
    });

    it ('rejects part which contains "."', () => {
      expect (() => State.getAncestorId ('a.b.c', 'a.b')).to.throw ('cannot be a path specification');
    });
  });

  describe ('State.withValue()', () => {
    it ('mutates the state when the value changes', () => {
      const state1 = State.create ('a', {x: 1});
      const state2 = State.withValue (state1, 'x', 2);
      const state3 = State.withValue (state2, 'x', 2);
      expect (state1.get ('x')).to.equal (1);
      expect (state2.get ('x')).to.equal (2);
      expect (state1).to.not.equal (state2);
      expect (state2).to.equal (state3);
    });

    it ('throws if an invalid number of arguments is provided', () => {
      const state = State.create ('a');
      expect (() => State.withValue (state)).to.throw (Error);
      expect (() => State.withValue (state, 'x')).to.throw (Error);
      expect (() => State.withValue (state, 'x', 1, 'y', 2)).to.throw (Error);
    });
  });

  describe ('State.withValues()', () => {
    it ('mutates the state when the value changes', () => {
      const state1 = State.create ('a', {x: 1, y: 2});
      const state2 = State.withValues (state1, 'x', 2, 'y', 3);
      const state3 = State.withValues (state2, 'x', 2);
      const state4 = State.withValues (state3);
      expect (state1.get ('x')).to.equal (1);
      expect (state1.get ('y')).to.equal (2);
      expect (state2.get ('x')).to.equal (2);
      expect (state2.get ('y')).to.equal (3);
      expect (state1).to.not.equal (state2);
      expect (state2).to.equal (state3);
      expect (state3).to.equal (state4);
    });

    it ('throws if an invalid number of arguments is provided', () => {
      const state = State.create ('a');
      expect (() => State.withValues (state, 'x')).to.throw (Error);
    });
  });

  describe ('State.with()', () => {
    it ('mutates the state when the value changes', () => {
      const state1 = State.create ('a', {x: 1, y: 2});
      const state2 = State.with (state1, {values: {x: 2, y: 3}});
      expect (state1.get ('x')).to.equal (1);
      expect (state1.get ('y')).to.equal (2);
      expect (state2.get ('x')).to.equal (2);
      expect (state2.get ('y')).to.equal (3);
    });

    it ('mutates the state when the generation changes', () => {
      const values = {x: 1, y: 2};
      const state1 = State.create ('a', values);
      const state2 = State.with (state1, {values: values, generation: 1});
      const state3 = State.with (state2, {generation: 1});
      expect (state1).to.not.equal (state2);
      expect (state2).to.equal (state3);
    });

    it ('does not mutate the state when nothing changes', () => {
      const values = {x: 1, y: 2};
      const state1 = State.create ('a', values);
      const state2 = State.with (state1, {values: values});
      const state3 = State.with (state1, {});
      expect (state1.get ('x')).to.equal (1);
      expect (state1.get ('y')).to.equal (2);
      expect (state1).to.equal (state2);
      expect (state1).to.equal (state3);
    });

    it ('throws if an invalid mutation is provided', () => {
      const state = State.create ('a');
      expect (() => State.with (state)).to.throw (Error);
      expect (() => State.with (state, {foo: 'bar'})).to.throw (Error);
    });
  });
});
