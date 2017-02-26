/* global describe it */

import {expect} from 'mai-chai';
import {State, Store} from 'electrum-store';

describe ('Store', () => {
  describe ('remove()', () => {
    it ('without argument clears the store', () => {
      const store = Store.create ();
      store.select ('a.b.c');
      store.select ('a.b.d');
      expect (store.generation).to.equal (2);
      expect (store.remove ()).to.be.true ();
      expect (store.generation).to.equal (3);
      expect (store.root.generation).to.equal (3);
    });

    it ('does nothing if the state does not exist', () => {
      const store = Store.create ();
      store.select ('a.b.c');
      store.select ('a.b.d');
      expect (store.remove ('a.x')).to.be.false ();
      expect (store.generation).to.equal (2);
      expect (store.find ('a.b.c')).to.exist ();
      expect (store.find ('a.b')).to.exist ();
      expect (store.find ('a')).to.exist ();
    });

    it ('removes the state and its children', () => {
      const store = Store.create ();
      store.select ('a.b.c');
      store.select ('a.b.d');
      expect (store.generation).to.equal (2);
      expect (store.remove ('a.b')).to.be.true ();
      expect (store.generation).to.equal (3);
      expect (store.find ('a.b.c')).to.not.exist ();
      expect (store.find ('a.b')).to.not.exist ();
      expect (store.find ('a')).to.exist ();
    });
  });
});
