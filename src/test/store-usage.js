'use strict';

import {expect} from 'mai-chai';
import {State, Store, Theme} from '../index.js';

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
        expect (store.stateCount).to.equal (0);
        expect (store.generation).to.equal (0);
        expect (store.id).to.equal ('x');
      });

      it ('creates a store with an empty root state', () => {
        const store = Store.create ();
        expect (store.root).to.exist ();
        expect (store.root.store).to.equal (store);
        expect (store.root.id).to.equal ('');
        expect (store.root).to.equal (store.getState (''));
        expect (store.root).to.equal (store.findState (''));
      });

      it ('creates a store with an immutable root state', () => {
        const store = Store.create ();
        expect (() => State.withValue (store.root, 'x', 1)).to.throw (Error);
      });
    });

    describe ('Store.link()', () => {
      it ('produces properties linked to child state', () => {
        const store = Store.create ('x');
        store.setState (State.create ('a.b.c'));
        const props1 = {state: store.findState ('a')};
        const props2 = Store.link (props1, 'b');
        expect (props1.state).to.equal (store.findState ('a'));
        expect (props2.state).to.equal (store.findState ('a.b'));
      });

      it ('produces properties which propagate the theme', () => {
        const store = Store.create ('x');
        const theme = Theme.create ('default');
        store.setState (State.create ('a.b.c'));
        const props1 = {state: store.findState ('a'), theme};
        const props2 = Store.link (props1, 'b');
        expect (props1.theme).to.equal (theme);
        expect (props2.theme).to.equal (theme);
      });
    });
  });
});
