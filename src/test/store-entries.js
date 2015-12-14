'use strict';

import 'babel-polyfill';

import {expect} from 'mai-chai';
import {Store} from '../index.js';

describe ('Store', () => {
  const store = Store.create ('x');
  store.select ('a.1');
  store.select ('a.z');
  store.select ('a.10');
  store.select ('a.2');
  store.select ('a.0');
  store.select ('a.z.w');

  describe ('getIds()', () => {
    it ('returns ids of children at specified id', () => {
      const arr = store.getIds ('a');
      expect (arr).to.have.length (5);
      expect (arr).to.deep.equal (['a.1', 'a.z', 'a.10', 'a.2', 'a.0']);
    });

    it ('returns root id when no id is specified', () => {
      const arr = store.getIds ();
      expect (arr).to.have.length (1);
      expect (arr).to.deep.equal (['']);
    });

    it ('returns top level ids when starting with root id', () => {
      const arr = store.getIds ('');
      expect (arr).to.have.length (1);
      expect (arr).to.deep.equal (['a']);
    });
  });

  describe ('getIndexKeys()', () => {
    it ('returns sorted index keys at specified id', () => {
      const arr = store.getIndexKeys ('a');
      expect (arr).to.have.length (4);
      expect (arr).to.deep.equal ([0, 1, 2, 10]);
    });
  });

  describe ('getIndexIds()', () => {
    it ('returns sorted index ids at specified id', () => {
      const arr = store.getIndexIds ('a');
      expect (arr).to.have.length (4);
      expect (arr).to.deep.equal (['a.0', 'a.1', 'a.2', 'a.10']);
    });
  });
});
