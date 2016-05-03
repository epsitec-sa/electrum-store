'use strict';

import State from './state.js';
import {parsePositiveInt} from 'electrum-utils';

/******************************************************************************/

function patchState (store, state) {
  store._states[state.id] = state;
  return state;
}

function changeGeneration (store) {
  return ++store._generation;
}

function updateTree (store, state, mutation) {
  const parentId = State.getParentId (state.id);
  if (parentId !== undefined) {
    const parentState = store.find (parentId) || State.create (parentId);
    updateTree (store, parentState, mutation);
  }
  return patchState (store, State.with (state, mutation));
}

function deleteStates (store, state) {
  const id = state.id + '.';
  const tree = store._states;

  const mutation = {
    generation: store.generation + 1
  };

  State.with (state, mutation);

  delete tree[state.id];

  for (let key in tree) {
    if (tree.hasOwnProperty (key)) {
      if (key.startsWith (id)) {
        delete tree[key];
      }
    }
  }
}

const secretKey = {};

/******************************************************************************/

class Store {
  constructor (id, key, values) {
    if (key !== secretKey) {
      throw new Error ('Do not call Store constructor directly; use Store.create instead');
    }
    this._states = {};
    this._generation = 0;
    this._states[''] = State.createRootState (this, values);
    this._id = id;
  }

  select (id) {
    if (arguments.length === 0) {
      return this.root;
    }
    return this.find (id) ||
           this.setState (State.create (id));
  }

  remove (id) {
    if (arguments.length === 0) {
      this._states = {};
      this._states[''] = State.createRootState (this, null, changeGeneration (this));
      return true;
    } else {
      const state = this.find (id);
      if (state) {
        deleteStates (this, state);
        return true;
      }
    }
    return false;
  }

  getIds (startId) {
    if (arguments.length === 0) {
      return [''];
    }
    const ids = Object.getOwnPropertyNames (this._states);
    if (startId === '') {
      // Special case: return all top level nodes
      return ids.filter (id => id.length && id.indexOf ('.') < 0);
    }
    const prefix = startId + '.';
    const length = prefix.length;
    return ids.filter (id => id.startsWith (prefix) && id.indexOf ('.', length) < 0);
  }

  getKeys (startId) {
    return this.getIds (startId).map (id => State.getLeafId (id));
  }

  getIndexIds (startId) {
    return this.getIndexKeys (startId).map (key => `${startId}.${key}`);
  }

  getIndexKeys (startId) {
    const nums = this.getIds (startId)
                     .map (id => parsePositiveInt (State.getLeafId (id)))
                     .filter (num => !isNaN (num));
    // Numeric sort required here
    nums.sort ((a, b) => a - b);
    return nums;
  }

  setState (state) {
    if (typeof state === 'string') {
      state = State.create (state);
    }
    if (!state || !(state instanceof State)) {
      throw new Error ('Invalid state');
    }

    if (state === this.find (state.id)) { // No mutation
      return state;
    } else {
      const mutation = {
        store: this,
        generation: changeGeneration (this)
      };
      return updateTree (this, state, mutation);
    }
  }

  merge (id, obj) {
    // Merges changes described as an object.
    // - A value (number, string, boolean) will be set directly.
    // - An object will be applied as a child node (recursively).
    // - An array will be treated like an object; indexes => keys.

    if (Array.isArray (obj)) {
      for (let i = 0; i < obj.length; i++) {
        this.merge (State.join (id, i), obj[i]);
      }
    } else if (typeof obj === 'object') {
      const keys = Object.keys (obj);
      keys.forEach (key => {
        const value = obj[key];
        if (value === null) {
          this
            .select (id)
            .set (key, null);
        } else if (typeof value === 'object') {
          this.merge (State.join (id, key), value);
        } else {
          this
            .select (id)
            .set (key, value);
        }
      });
    } else {
      this
        .select (id)
        .set (obj);
    }
  }

  applyChanges (id, obj, defaultKey = '') {
    if (typeof obj === 'undefined') {
      return;
    }

    // [ {offset: ..., id: ..., value: ...} ...]
    if (Array.isArray (obj)) {
      if (obj.some (x => x.offset === undefined)) {
        throw new Error ('applyChanges expects an array of {offset: ...}');
      }
      obj.forEach (obj => {
        const childId = State.join (id, obj.offset);
        if (obj.value === undefined) {
          // The item does not specify a value: this means that the caller
          // wants to remove the subtree defined by the child node.
          this.remove (childId);
        } else {
          // The item contains a value (either an object or a simple value)
          // and we will recursively apply it on the subtree starting at the
          // child node.
          const value = typeof obj.value === 'object'
                        ? undefined
                        : obj.value;

          // Create offset/id/value props on child node:
          this
            .select (childId)
            .set ('offset', obj.offset, 'id', obj.id, 'value', value);
          
          this.applyChanges (childId, obj.value, defaultKey);
        }
      });
      
      return;
    }
    
    // {x: ..., y: ...} or {$apply: ..., x: ..., y: ...}
    if (typeof obj === 'object') {
      const keys = Object.keys (obj);
      const type = obj.$apply;
      if (type === 'props') {
        // Special case: treat the object properties as values to set on
        // the state node, as simple properties.
        keys.forEach (key => {
          this
            .select (id)
            .set (key, obj[key]);
        });
        
        return;
      }

      // Normal case: every object property creates a new node in the
      // state tree.
      keys.forEach (key => {
        const value = obj[key];
        const childId = State.join (id, key);
        if (value === undefined) {
          this.remove (childId);
        } else {
          this.applyChanges (childId, value, defaultKey);
        }
      });
      
      return;
    }
    
    // plain value
    this
      .select (id)
      .set (defaultKey, obj);
  }

  find (id) {
    if (arguments.length === 0) {
      return this.root;
    }
    if (typeof id !== 'string') {
      throw new Error ('Invalid state id');
    }
    if (id.length === 0) {
      return this.root;
    } else {
      return this._states[id];
    }
  }

  get id () {
    return this._id;
  }

  get generation () {
    return this._generation;
  }

  get root () {
    return this._states[''];
  }

  get stateCount () {
    return Object.keys (this._states).length - 1;
  }

/* static methods */

  static create (id, values) {
    return new Store (id, secretKey, values);
  }

  static link (props, id, override) {
    const {state} = props;
    let theme = props.theme;
    if (override) {
      if (override.theme) {
        theme = override.theme;
      }
    }
    return {
      state: state.select (id),
      theme
    };
  }

  static read (props, id) {
    const {state} = props;
    return state.get (id);
  }
}

module.exports = Store;
