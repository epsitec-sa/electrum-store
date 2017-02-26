/* global describe it */

import {expect} from 'mai-chai';
import {Store, State} from 'electrum-store';

describe ('Store', () => {
  describe ('Store.setState()', () => {
    it ('stores state and changes the generation', () => {
      const store = Store.create ();
      const state1 = State.create ('a');
      const state2 = store.setState (state1);
      expect (store.stateCount).to.equal (1);
      expect (store.generation).to.equal (1);
      expect (state2.store).to.equal (store);
      expect (state2.generation).to.equal (1);
    });

    it ('checks its argument', () =>  {
      const store = Store.create ();
      expect (() => store.setState ()).to.throw (Error);
      expect (() => store.setState (null)).to.throw (Error);
      expect (() => store.setState (123)).to.throw (Error);
      expect (() => store.setState ('')).to.throw (Error);
    });

    it ('converts state id to empty state', () => {
      const store = Store.create ();
      const state1 = store.setState ('a');
      const state2 = store.find ('a');
      expect (state1 === state2);
      expect (state1).to.have.property ('id', 'a');
    });

    it ('returns state as stored', () => {
      const store = Store.create ();
      const state1 = State.create ('a');
      const state2 = store.setState (state1);
      expect (state1 !== state2);
      expect (state1.generation).to.equal (0);
      expect (state2.generation).to.equal (1);
      expect (state2.id).to.equal ('a');
    });

    it ('returns deep state as stored', () => {
      const store = Store.create ();
      const state1 = State.create ('a.b.c');
      const state2 = store.setState (state1);
      expect (state1 !== state2);
      expect (state1.generation).to.equal (0);
      expect (state2.generation).to.equal (1);
      expect (state2.id).to.equal ('a.b.c');
    });

    it ('called twice with same state is idempotent', () => {
      const store = Store.create ();
      const state1 = State.create ('a');
      const state2 = store.setState (state1);
      expect (store.stateCount).to.equal (1);
      expect (store.generation).to.equal (1);
      expect (state1.generation).to.equal (0);
      expect (state2.generation).to.equal (1);
      store.setState (state2);
      expect (store.stateCount).to.equal (1);
      expect (store.generation).to.equal (1);
    });

    it ('creates missing states', () => {
      const store = Store.create ();
      const state  = State.create ('a.b.c');
      store.setState (state);
      expect (store.stateCount).to.equal (3);
    });

    it ('shares parent states', () => {
      const store = Store.create ();
      const state1 = State.create ('a.b.c');
      const state2 = State.create ('a.b.d');
      store.setState (state1);
      store.setState (state2);
      //  a, a.b, a.b.c, a.b.d --> 4 distinct states
      expect (store.stateCount).to.equal (4);
    });

    it ('updates generation of parent states', () => {
      const store = Store.create ();
      const state1 = State.create ('a');
      const state2 = State.create ('a.b');
      const state3 = State.create ('a.c');
      store.setState (state1);
      expect (store.find ('a').generation).to.equal (1);
      expect (store.find ('a.b')).to.not.exist ();
      store.setState (state2);
      expect (store.find ('a').generation).to.equal (2);
      expect (store.find ('a.b').generation).to.equal (2);
      store.setState (state3);
      expect (store.find ('a').generation).to.equal (3);
      expect (store.find ('a.b').generation).to.equal (2);
      expect (store.find ('a.c').generation).to.equal (3);
    });

    it ('produces new parent states: existing states are not mutated, they are replaced', () => {
      const store = Store.create ();
      const state1 = State.create ('a');
      const state2 = State.create ('a.b');
      const state3 = State.create ('a.c');

      const stateA1 = store.setState (state1);
      const stateA2 = store.find ('a');

      expect (stateA1 === stateA2);
      expect (stateA1 !== state1);
      expect (stateA2.generation).to.equal (1);

      store.setState (state2);

      const stateA3 = store.find ('a');

      expect (stateA1 === stateA2);
      expect (stateA1 !== stateA3);
      expect (stateA2.generation).to.equal (1);
      expect (stateA3.generation).to.equal (2);

      store.setState (state3);

      const stateA4 = store.find ('a');

      expect (stateA2.generation).to.equal (1);
      expect (stateA3.generation).to.equal (2);
      expect (stateA4.generation).to.equal (3);
    });
  });
});
