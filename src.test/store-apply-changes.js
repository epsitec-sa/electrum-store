'use strict';

import {expect} from 'mai-chai';
import {Store} from 'electrum-store';

describe ('Store', () => {
  describe ('Store.applyChanges()', () => {
    it ('creates expected state nodes and values', () => {
      const store = Store.create ();
      const array = [
        {offset: 0, id: 'x', value: 'X'},
        {offset: 2, id: 'y', value: {date: '01.01.2016', name: 'foo', item: {bar: 'z'}}},
        {offset: 3, id: 'z', value: {item: {$apply: 'props', v: 'V', w: 'W'}}},
        {offset: 4, id: 'q', value: {$apply: 'props', item: {v: 'V', w: 'W'}}}
      ];

      store.applyChanges ('root', array);

      // Assert: string value was set as a node property
      expect (store.find ('root.0').get ('offset')).to.equal (0);
      expect (store.find ('root.0').get ('id')).to.equal ('x');
      expect (store.find ('root.0').get ('value')).to.equal ('X');
      expect (store.find ('root.0.offset')).to.be.undefined ();
      expect (store.find ('root.0.id')).to.be.undefined ();
      expect (store.find ('root.0.value')).to.be.undefined ();

      // Assert: object value was used to create full-featured nodes
      expect (store.find ('root.2').get ('offset')).to.equal (2);
      expect (store.find ('root.2').get ('id')).to.equal ('y');
      expect (store.find ('root.2').get ('value')).to.be.undefined (); // no value
      expect (store.find ('root.2.date').get ()).to.equal ('01.01.2016');
      expect (store.find ('root.2.name').get ()).to.equal ('foo');
      expect (store.find ('root.2.item.bar').get ()).to.equal ('z');

      // Assert: object with $apply == 'props' gets handled as node properties
      expect (store.find ('root.3').get ('offset')).to.equal (3);
      expect (store.find ('root.3').get ('id')).to.equal ('z');
      expect (store.find ('root.3').get ('value')).to.be.undefined ();
      expect (store.find ('root.3.item').get ('v')).to.equal ('V');
      expect (store.find ('root.3.item').get ('w')).to.equal ('W');

      // Assert: object with $apply == 'props' gets handled as node properties
      expect (store.find ('root.4').get ('offset')).to.equal (4);
      expect (store.find ('root.4').get ('id')).to.equal ('q');
      expect (store.find ('root.4').get ('value')).to.be.undefined ();
      expect (store.find ('root.4').get ('item')).to.deep.equal ({v: 'V', w: 'W'});
      expect (store.find ('root.4.item')).to.not.exist ();
    });

    it ('sets values using specified key', () => {
      const store = Store.create ();
      const array = [
        {offset: 0, id: 'x', value: 'X'},
        {offset: 2, id: 'y', value: {date: '01.01.2016', name: 'foo'}}
      ];

      store.applyChanges ('root', array, 'VALUE'); // defaultKey is 'VALUE'

      expect (store.find ('root.0').get ('value')).to.equal ('X');
      expect (store.find ('root.2').get ('value')).to.be.undefined ();
      expect (store.find ('root.2.date').get ('VALUE')).to.equal ('01.01.2016');
      expect (store.find ('root.2.name').get ('VALUE')).to.equal ('foo');
    });

    it ('accepts empty values', () => {
      const store = Store.create ();
      const array = [
        {offset: 0, id: 'x', value: 'X'},
        {offset: 3, id: 'z', value: undefined} // no value here
      ];

      store.applyChanges ('root', array, 'value');

      expect (store.find ('root.0').get ('value')).to.equal ('X');
      expect (store.find ('root.3')).to.not.exist ();
    });

    it ('throws when offset is missing', () => {
      const store = Store.create ();
      const array = [{id: 'x', value: 'X'}];

      expect (() => store.applyChanges ('root', array, 'value')).to.throw ('expects an array');
    });

    it ('mutates existing entries in array', () => {
      const store = Store.create ();
      const array1 = [
        {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}}, // children year and name
        {offset: 12, id: 'y', value: {year: 1984, name: 'bar'}}, // children year and name
        {offset: 13, id: 'z', value: 'Z'} // no children, plain value only
      ];

      const array2 = [
        {offset: 10, id: 'x', value: {year: 2014}}, // replace year in child node
        {offset: 13, id: 'x', value: {year: 1999}}, // replace value with node
      ];

      store.applyChanges ('root', array1);
      expect (store.find ('root.13').get ('value')).to.equal ('Z');

      store.applyChanges ('root', array2);
      expect (store.find ('root.10.year').get ()).to.equal (2014);
      expect (store.find ('root.10.name').get ()).to.equal ('foo');
      expect (store.find ('root.13').get ('value')).to.be.undefined ();
      expect (store.find ('root.13.year').get ()).to.equal (1999);
    });

    it ('interprets array property', () => {
      const store = Store.create ();
      const info = {
        $apply: 'props',
        name: 'foo',
        array: [
          {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}},
          {offset: 12, id: 'y', value: {$apply: 'props', year: 1984, name: 'bar'}}
        ]
      };
      // Properties year/name will be set on node 12 directly
      store.applyChanges ('root', info);
      expect (store.find ('root').get ('name')).to.equal ('foo');
      expect (store.find ('root.10.year').get ()).to.equal (2016);
      expect (store.find ('root.10.name').get ()).to.equal ('foo');
      expect (store.find ('root.12.year')).to.not.exist ();
      expect (store.find ('root.12.name')).to.not.exist ();
      expect (store.find ('root.12').get ('year')).to.equal (1984);
      expect (store.find ('root.12').get ('name')).to.equal ('bar');
    });

    it ('removes entries in array', () => {
      const store = Store.create ();
      const array1 = [
        {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}}, // children year and name
        {offset: 12, id: 'y', value: {year: 1984, name: 'bar'}}, // children year and name
      ];

      const array2 = [
        {offset: 10}, // remove entry
      ];

      store.applyChanges ('root', array1);
      expect (store.find ('root.10')).to.exist ();
      expect (store.find ('root.12')).to.exist ();

      store.applyChanges ('root', array2);
      expect (store.find ('root.10')).to.not.exist ();
      expect (store.find ('root.12')).to.exist ();
    });

    it ('example (1) from README works', () => {
      const store = Store.create ();
      const array = [
        {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}}, // children year and name
        {offset: 12, id: 'y', value: {year: 1984, name: 'bar'}}, // children year and name
        {offset: 13, id: 'z', value: 'hello'} // no children, plain value only
      ];

      store.applyChanges ('root', array);

      expect (store.find ('root.10.year').get ()).to.equal (2016);
      expect (store.find ('root.12.name').get ()).to.equal ('bar');
      expect (store.find ('root.10').get ('value')).to.not.exist ();
      expect (store.find ('root.13').get ('value')).to.equal ('hello');

      store.applyChanges ('root', [{offset: 12, id: 'y', value: {year: 1986}}]);
      expect (store.find ('root.12.year').get ()).to.equal (1986);
      expect (store.find ('root.12.name').get ()).to.equal ('bar');

      store.applyChanges ('root', [{offset: 12}]);
      expect (store.find ('root.12')).to.not.exist ();
    });

    it ('example (2) from README works', () => {
      const store = Store.create ();
      const array = [
        {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}},
        {offset: 12, id: 'y', value: {$apply: 'props', year: 1984, name: 'bar'}}
      ];
      // Properties year/name will be set on node 12 directly
      store.applyChanges ('root', array);
      expect (store.find ('root.10.year').get ()).to.equal (2016);
      expect (store.find ('root.10.name').get ()).to.equal ('foo');
      expect (store.find ('root.12.year')).to.not.exist ();
      expect (store.find ('root.12.name')).to.not.exist ();
      expect (store.find ('root.12').get ('year')).to.equal (1984);
      expect (store.find ('root.12').get ('name')).to.equal ('bar');
    });

    it ('example (3) from README works', () => {
      const store = Store.create ();
      const changes = {
        $apply: 'props',
        name: 'John',
        age: 42,
        array: [
          {offset: 1, id: 'x', value: {x: 10}},
          {offset: 2, id: 'y', value: {y: 20}}
        ]
      };

      // Properties name/age will be set on root node directly, and
      // the array will be applied on root too.
      store.applyChanges ('root', changes);
      expect (store.find ('root').get ('name')).to.equal ('John');
      expect (store.find ('root').get ('age')).to.equal (42);
      expect (store.find ('root.1.x').get ()).to.equal (10);
      expect (store.find ('root.2.y').get ()).to.equal (20);
    });
  });
});
