'use strict';

import {expect} from 'mai-chai';
import {Store} from 'electrum-store';

describe ('Store', () => {
  describe ('Store.apply()', () => {
    it ('applies values and adds nodes', () => {
      const store = Store.create ();

      store
        .select ('a.b')
        .set ('x', 10, 'y', 20);

      expect (store.generation).to.equal (2);

      const pojo = {x: 15, name: 'foo', c: {value: 'bar'}};
      store.apply ('a.b', pojo);

      expect (store.generation).to.be.above (2);

      expect (store.select ('a.b').get ('x')).to.equal (15);
      expect (store.select ('a.b').get ('y')).to.equal (20);
      expect (store.select ('a.b').get ('name')).to.equal ('foo');
      expect (store.select ('a.b.c').get ('value')).to.equal ('bar');
    });

    it ('sets default value', () => {
      const store = Store.create ();

      store
        .select ('a.b')
        .set ('x', 10, 'y', 20);

      expect (store.generation).to.equal (2);

      const pojo = {c: {'': 'default'}};
      store.apply ('a.b', pojo);

      expect (store.generation).to.be.above (2);

      expect (store.select ('a.b.c').get ()).to.equal ('default');
    });

    it ('treats an array as an object: keys are set 0, 1, etc.', () => {
      const store = Store.create ();

      store
        .select ('a.b')
        .set ('x', 10, 'y', 20);

      expect (store.generation).to.equal (2);

      const pojo = {x: 15, items: ['a', {value: 'bar'}]};
      store.apply ('a.b', pojo);

      expect (store.generation).to.be.above (2);

      expect (store.select ('a.b').get ('x')).to.equal (15);
      expect (store.select ('a.b.items.0').get ()).to.equal ('a');
      expect (store.select ('a.b.items.1').get ('value')).to.equal ('bar');
    });

    it ('accepts a direct value', () => {
      const store = Store.create ();

      store
        .select ('a.b')
        .set ('x', 10, 'y', 20);

      expect (store.generation).to.equal (2);

      const pojo = 'default';
      store.apply ('a.b.c', pojo);

      expect (store.generation).to.be.above (2);

      expect (store.select ('a.b.c').get ()).to.equal ('default');
    });

    it ('accepts a direct array', () => {
      const store = Store.create ();
      const pojo = ['x', {value: 'bar'}];
      store.apply ('a.items', pojo);
      expect (store.select ('a.items.0').get ()).to.equal ('x');
      expect (store.select ('a.items.1').get ('value')).to.equal ('bar');
    });

    it ('accepts null values', () => {
      const store = Store.create ();
      const pojo = {x: 1, y: null};
      store.apply ('a', pojo);
      expect (store.select ('a').get ('x')).to.equal (1);
      expect (store.select ('a').get ('y')).to.be.null ();
    });

    it ('does not mutate store if nothing changes', () => {
      const store = Store.create ();

      store
        .select ('a.b')
        .set ('x', 10, 'y', 20);

      store
        .select ('a.b.c')
        .set ('value', 'bar');

      expect (store.generation).to.equal (4);

      const pojo = {x: 10, c: {value: 'bar'}};
      store.apply ('a.b', pojo);

      expect (store.generation).to.equal (4);
      expect (store.select ('a.b').get ('x')).to.equal (10);
      expect (store.select ('a.b').get ('y')).to.equal (20);
      expect (store.select ('a.b.c').get ('value')).to.equal ('bar');
    });
  });
});
