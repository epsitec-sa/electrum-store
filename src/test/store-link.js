'use strict';

import {expect} from 'mai-chai';
import {State, Store, Theme} from '../index.js';

describe ('Store', () => {
  describe ('Store.link()', () => {
    it ('produces properties linked to child state', () => {
      const store = Store.create ('x');
      store.setState (State.create ('a.b.c'));
      const props1 = {state: store.find ('a')};
      const props2 = Store.link (props1, 'b');
      expect (props1.state).to.equal (store.find ('a'));
      expect (props2.state).to.equal (store.find ('a.b'));
    });

    it ('produces properties which propagate the theme', () => {
      const store = Store.create ('x');
      const theme = Theme.create ('default');
      store.setState (State.create ('a.b.c'));
      const props1 = {state: store.find ('a'), theme};
      const props2 = Store.link (props1, 'b');
      expect (props1.theme).to.equal (theme);
      expect (props2.theme).to.equal (theme);
    });
  });
});
