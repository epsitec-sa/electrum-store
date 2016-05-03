'use strict';

import {expect} from 'mai-chai';
import {Store} from 'electrum-store';

describe ('Store', () => {
  describe ('Store.applyCollection()', () => {
    it ('creates expected state nodes and values', () => {
      const store = Store.create ();
      const array = [
        {offset: 0, id: 'x', value: 'X'},
        {offset: 2, id: 'y', value: {date: '01.01.2016', name: 'foo', item: {bar: 'z'}}}
      ];

      store.applyCollection ('root', array);

      expect (store.find ('root.0').get ('offset')).to.equal (0);
      expect (store.find ('root.0').get ('id')).to.equal ('x');
      expect (store.find ('root.0').get ('value')).to.equal ('X');
      expect (store.find ('root.0.offset')).to.be.undefined ();
      expect (store.find ('root.0.id')).to.be.undefined ();
      expect (store.find ('root.0.value')).to.be.undefined ();

      expect (store.find ('root.2').get ('offset')).to.equal (2);
      expect (store.find ('root.2').get ('id')).to.equal ('y');
      expect (store.find ('root.2').get ('value')).to.deep.equal ({date: '01.01.2016', name: 'foo', item: {bar: 'z'}});

      expect (store.find ('root.2.date').get ()).to.equal ('01.01.2016');
      expect (store.find ('root.2.name').get ()).to.equal ('foo');
      expect (store.find ('root.2.item.bar').get ()).to.equal ('z');
    });

    it ('sets values using specified key', () => {
      const store = Store.create ();
      const array = [
        {offset: 0, id: 'x', value: 'X'},
        {offset: 2, id: 'y', value: {date: '01.01.2016', name: 'foo'}}
      ];

      store.applyCollection ('root', array, 'value'); // defaultKey is 'value'

      expect (store.find ('root.0').get ('value')).to.equal ('X');
      expect (store.find ('root.2').get ('value')).to.deep.equal ({date: '01.01.2016', name: 'foo'});
      expect (store.find ('root.2.date').get ('value')).to.equal ('01.01.2016');
      expect (store.find ('root.2.name').get ('value')).to.equal ('foo');
    });

    it ('treats value named with default key as an entry value', () => {
      const store = Store.create ();
      const data  = {a: {x: 'X'}, b: {value: 'Y'}};

      store.applyCollection ('root', data, 'value'); // defaultKey is 'value'

      expect (store.find ('root.a').get ('x')).to.be.undefined ();
      expect (store.find ('root.a.x').get ('value')).to.equal ('X');
      expect (store.find ('root.b').get ('value')).to.equal ('Y');
      expect (store.find ('root.b.value')).to.not.exist ();
    });

    it ('accepts empty values', () => {
      const store = Store.create ();
      const array = [
        {offset: 0, id: 'x', value: 'X'},
        {offset: 2, id: 'y', value: {date: '01.01.2016', name: 'foo'}},
        {offset: 3, id: 'z'} // no value here
      ];

      store.applyCollection ('root', array, 'value');

      expect (store.find ('root.0').get ('value')).to.equal ('X');
      expect (store.find ('root.2').get ('value')).to.deep.equal ({date: '01.01.2016', name: 'foo'});
      expect (store.find ('root.3').get ('value')).to.be.undefined ();
    });

    it ('throws when offset is missing', () => {
      const store = Store.create ();
      const array = [{id: 'x', value: 'X'}];

      expect (() => store.applyCollection ('root', array, 'value')).to.throw ('expects an array');
    });

    it ('example from README works', () => {
      const store = Store.create ();
      const array = [
        {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}}, // children year and name
        {offset: 12, id: 'y', value: {year: 1984, name: 'bar'}}, // children year and name
        {offset: 13, id: 'z', value: 'none'} // no children, plain value only
      ];

      store.applyCollection ('root', array);

      expect (store.select ('root.10.year').get ()).to.equal (2016);
      expect (store.select ('root.12.name').get ()).to.equal ('bar');
      expect (store.select ('root.10').get ('value')).to.deep.equal ({year: 2016, name: 'foo'});
      expect (store.select ('root.13').get ('value')).to.equal ('none');
    });

    it ('handle empty array collections', () => {
      const store = Store.create ();
      const emptyArray = [];
      store.applyCollection ('root', emptyArray, 'value');
      expect (store.find ('root')).to.not.exist ();
    });
  });
});
