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
  });
});
