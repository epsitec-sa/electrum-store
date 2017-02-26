'use strict';

import 'babel-polyfill';
import {isPositiveInt} from 'electrum-utils';

/******************************************************************************/

const emptyValues = {};
const secretKey = {};

Object.freeze (emptyValues);
Object.freeze (secretKey);

function isPositiveInteger (value) {
  if (typeof value === 'number') {
    if (Math.floor (value) === value && value >= 0) {
      return true;
    }
  }
  return false;
}

function verifyMutationKeys (mutation) {
  if (typeof mutation !== 'object') {
    throw new Error ('Invalid mutation object');
  }
  for (let key of Object.getOwnPropertyNames (mutation)) {
    switch (key) {
      case 'generation':
      case 'store':
      case 'values':
        break;
      default:
        throw new Error ('Unexpected key ' + key + ' in mutation');
    }
  }
}

function isEmpty (obj) { /*jshint -W089 */
  for (let x in obj) { /* jshint unused:false */
    return false;
  }
  return true;
}

/******************************************************************************/

export default class State {
  constructor (key, id, store, generation, values) {
    if (key !== secretKey) {
      throw new Error ('Do not call State constructor directly; use State.create instead');
    }
    if (typeof generation !== 'number') {
      throw new Error ('State expects a valid generation');
    }
    if (typeof values !== 'object') {
      throw new Error ('State expects valid initial values');
    }
    if (isEmpty (values)) {
      values = emptyValues; // optimize for values set to {}
    } else {
      Object.freeze (values);
      for (let key of Object.getOwnPropertyNames (values)) {
        State.freezeTop (values[key]);
      }
    }

    this._id = id;
    this._store = store;
    this._generation = generation;
    this._values = values;
  }

  get id () {
    return this._id;
  }

  get key () {
    return State.getLeafId (this._id);
  }

  get parentId () {
    return State.getParentId (this._id);
  }

  get store () {
    return this._store;
  }

  get generation () {
    return this._generation;
  }

  get value () {
    return this.get ();
  }

  get keys () {
    return this.store.getKeys (this.id);
  }

  get indexKeys () {
    return this.store.getIndexKeys (this.id);
  }

  get arities () {
    return this.store.getArities (this.id);
  }

  contains (id) {
    return this.get (id) !== undefined;
  }

  get (id) {
    if (id === undefined) {
      id = '';
    }
    return this._values[id];
  }

  getPojo () {
    return this._values.pojo || {...this._values};
  }

  getInherited (id) {
    const value = this.get (id);
    if (value !== undefined) {
      return value;
    }
    const parent = this.parentId;
    if (parent !== undefined) {
      return this.store.find (parent).getInherited (id);
    }
  }

  set (...args) {
    if (args.length === 1) {
      return this.set ('', args[0]);
    }
    return State.withValues (this, ...args);
  }

  add () {
    const keys = this.indexKeys;
    const next = keys.length === 0 ? 0 : (keys[keys.length - 1] + 1);
    return this.select ('' + next);
  }

  remove (id) {
    if ((id === undefined) && (arguments.length === 0)) {
      return this.store.remove (this.id);
    }
    return this.selectOrFind (id, i => this._store.remove (i));
  }

  select (id) {
    if ((id === undefined) && (arguments.length === 0)) {
      return this;
    }
    return this.selectOrFind (id, i => this._store.select (i));
  }

  find (id) {
    if ((id === undefined) && (arguments.length === 0)) {
      return this;
    }
    return this.selectOrFind (id, i => this._store.find (i));
  }

  any (id) {
    if ((id === undefined) && (arguments.length === 0)) {
      return !isEmpty (this._values) || this.keys.length > 0;
    }
    return this.selectOrFind (id, i => {
      const state = this._store.find (i);
      return !!state && state.any ();
    });
  }

  exists (id) {
    return this.selectOrFind (id, i => {
      const state = this._store.find (i);
      return !!state;
    });
  }

  selectOrFind (id, access) {
    if (id === '') {
      return this;
    }
    if (isPositiveInteger (id)) {
      id = '' + id;
    }
    if (typeof id !== 'string') {
      throw new Error ('Invalid state id');
    }
    if (this._id.length === 0) {
      return access (id);
    } else {
      return access (State.join (this._id, id));
    }
  }

  shouldUpdate (generation) {
    return !generation || generation >= this.generation;
  }

  static create (...args) {
    if (args.length === 0) {
      throw new Error ('No id was provided to State.create()');
    }
    if (args.length > 2) {
      throw new Error ('Too many arguments provided to State.create()');
    }

    const id = args[0];
    const values = args[1];

    if ((typeof id !== 'string') ||
        (id.length === 0)) {
      throw new Error ('State expects a valid id');
    }
    return new State (secretKey, id, null, 0, values || emptyValues);
  }

  static createRootState (store, values, initialGeneration = 0) {
    return new State (secretKey, '', store, initialGeneration, values || emptyValues);
  }

  static join (...args) {
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      if ((typeof arg !== 'string') || arg.length === 0) {
        if (typeof arg === 'number' && isPositiveInt (arg)) {
          continue;
        }
        throw new Error ('State.join expects non-empty string ids');
      }
    }

    return args.join ('.');
  }

  static getLeafId (id) {
    if (!id) {
      return id;
    }
    const pos = id.lastIndexOf ('.') + 1;
    return pos === 0 ? id : id.substring (pos);
  }

  static getParentId (id) {
    if (typeof id !== 'string') {
      throw new Error ('State.getParentId expects a string id');
    }
    const pos = id.lastIndexOf ('.');
    if (pos < 0) {
      return id !== '' ? '' : undefined;
    } else {
      return id.substring (0, pos);
    }
  }

  static getArityIndex (id) {
    const pos = id.indexOf ('$', id.indexOf ('.') + 1);
    if (pos < 0) {
      return undefined;
    } else {
      return Number (id.substring (pos + 1));
    }
  }

  static getAncestorId (id, part) {
    if (typeof id !== 'string') {
      throw new Error ('State.getAncestorId expects a string id');
    }
    if (isPositiveInteger (part)) {
      part = '' + part;
    }
    if (typeof part !== 'string') {
      throw new Error ('State.getAncestorId expects a string part');
    }
    if (part.indexOf ('.') >= 0) {
      throw new Error ('State.getAncestorId part cannot be a path specification');
    }
    if (part === '') {
      return '';
    }
    const parts = id.split ('.');
    for (let i = parts.length; i > 0; --i) {
      if (parts[i - 1] === part) {
        return parts.slice (0, i).join ('.');
      }
    }
  }

  static withValue (state, id, value) {
    if (arguments.length !== 3) {
      throw new Error ('Invalid number of arguments');
    }
    if (state._values[id] === value) {
      return state;
    } else {
      return State._withValues (state, [id, value]);
    }
  }

  static withValues (state, ...args) {
    if (args.length === 0) {
      return state;
    }
    if (args.length % 2 !== 0) {
      throw new Error ('Invalid number of arguments');
    }

    return State._withValues (state, args);
  }

  static _withValues (state, args) {
    var values;

    for (let i = 0; i < args.length; i += 2) {
      const id = args[i + 0];
      const value = args[i + 1];
      if (state._values[id] !== value) {
        if (!values) {
          values = {};
          Object.assign (values, state._values);
        }
        values[id] = value;
      }
    }

    if (!values) {
      return state;
    } else {
      return State.with (state, {values: values});
    }
  }

  static with (state, mutation) {
    verifyMutationKeys (mutation);
    const generation = mutation.generation || state._generation;
    const store = mutation.store || state._store;
    const values = mutation.values || state._values;
    if ((state._generation === generation) &&
        (state._store === store) &&
        (state._values === values)) {
      return state;
    } else {
      state = new State (secretKey, state._id, store, generation, values);
      // If the state was already attached to a store, we have to update the
      // store so that the new state will be used from now on...
      if (state._store) {
        // ...however, if the mutation includes a store specification, then
        // this means that the store is actually calling us, because it is
        // already updating this very state. If so, don't notify the store.
        if (!mutation.store) {
          return state._store.setState (state);
        }
      }
      return state;
    }
  }

  static freeze (obj) {
    if (Array.isArray (obj)) {
      obj.forEach (x => State.freeze (x));
    }
    if (obj && typeof obj === 'object') {
      Object.freeze (obj);
      for (let key of Object.getOwnPropertyNames (obj)) {
        State.freeze (obj[key]);
      }
    }
  }

  static freezeTop (obj) {
    if (Array.isArray (obj)) {
      obj.forEach (x => State.freezeTop (x));
    }
    if (obj && typeof obj === 'object') {
      Object.freeze (obj);
    }
  }
}

/******************************************************************************/
