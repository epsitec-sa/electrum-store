# Electrum Store

[![NPM version](https://img.shields.io/npm/v/electrum-store.svg)](https://www.npmjs.com/package/electrum-store)
[![Build Status](https://travis-ci.org/epsitec-sa/electrum-store.svg?branch=master)](https://travis-ci.org/epsitec-sa/electrum-store)
[![Build status](https://ci.appveyor.com/api/projects/status/21n8c0j8aexkwg8e?svg=true)](https://ci.appveyor.com/project/epsitec/electrum-store)

Electrum Store (`electrum-store`) provides a store implementation tailored
for use with `electrum-arc`, the Electrum Agnostic Reactive Components.

The **store** maintains **state** organized as a tree. State is
**immutable**. When the store is updated, new state is produced and
nodes get replaced in the tree.

Neither the store nor its states will emit notifications when things
change, since `electrum` does not need the feature.

Thanks to immutability, whole trees can be compared for equality
with `===`. Whenever a (sub-)tree changes, the store guarantees that
the `state` objects change too, from the node in the tree where the
change happened up to the root of the tree (_change percolation_).

# Store
## Create a store

To create a store, call `Store.create()`. The constructor is not available
for public consumption and should not be called.

```javascript
const store = Store.create ();
```

## Access state in the store

The store maintains its state as a tree. Selecting state located at `a.b.c`
will automatically create `a`, `a.b` and `a.b.c` if they did not yet exist
in the tree. You can call `select()` on a `state` object, which can be used
to navigate down the tree.

`select()` creates missing nodes whereas `find()` returns `undefined` if
it does not find the specified nodes.

```javascript
const store = Store.create ();
const state1 = store.select ('a.b.c');
const state2 = store.select ('a').select ('b.c');
const state3 = store.find ('a.b.c');
const state4 = store.find ('x.y');
expect (state1).to.equal (state2);
expect (state1).to.equal (state3);
expect (state4).to.equal (undefined);
```

## Mutate the store

Whenever new state needs to be recorded in the store, the tree will be
updated and new _generation_ tags will be applied to the parts of the
tree which changed as a result of this.

Setting `a.b.c` first will produce nodes `a`, `b` and `c` in generation 1.
Adding `a.b.d` will mutate `a.b` (it contains a new child `d`) and
also mutate `a` (it contains an updated `a.b`); all this will happen
inside generation 2. Nodes `a`, `b` and `d` will have `generation:2`
whereas node `c` will remain at `generation:1`.

```javascript
const store = Store.create ();
store.select ('a.b.c'); // generation 1
store.select ('a.b.d'); // generation 2
expect (store.find ('a').generation).to.equal (2);
expect (store.find ('a.b').generation).to.equal (2);
expect (store.find ('a.b.c').generation).to.equal (1);
expect (store.find ('a.b.d').generation).to.equal (2);
```

A state (with all its children) can also be removed from the store:

```javascript
const store = Store.create ();
store.select ('a.b.c'); // generation 1
store.select ('a.b.d'); // generation 2
store.remove ('a.b'); // generation 3
expect (store.find ('a').generation).to.equal (3);
expect (store.find ('a.b')).to.not.exist ();
expect (store.find ('a.b.c')).to.not.exist ();
expect (store.find ('a.b.d')).to.not.exist ();
```

## Explicitly set state

State is usually updated using `with()`, `withValue()` and `withValues()`
or created implicitly by `select()`. It is also possible to set state
explicitly:

```javascript
const store = Store.create ();
const state1 = State.create ('x.y');
const state2 = store.setState (state1);
expect (state1.generation).to.equal (0);
expect (state1).to.not.equal (state2);
expect (state2.generation).to.equal (1);
```

# State

State holds following information:

* `id` &rarr; the absolute path of the node (e.g. `'a.b.c'`).
* `key` &rarr; the local path of the node (e.g. `'c'` if the `id` is `'a.b.c'`).
* `store` &rarr; a reference to the containing store.
* `generation` &rarr; the generation number of last update.
* `values` &rarr; a collection of values - this is never accessed directly.

The default value is accessed with `state.value`. Named values can be
accessed using `state.get(name)`.

## Read back values from the state

* `get (name)` or `get ()` &rarr; the value for `name` (or the default value if
  no name is specified), if it exists; otherwise `undefined`.
* `getInherited (name)` &rarr; the value for `name` if it can be found on the
  state or any of its parent nodes, otherwise `undefined`.
* `contains (name)` &rarr; `true` if a value exists for `name`, otherwise `false`.

## States as arrays

When a state (a node of the tree) contains multiple child nodes, and when these
nodes have an integer `key` (zero or positive), this can be considered as a poor
men's array. The keys are then equivalent to the indexes into the array. They
can have gaps and need not be consecutive: `[23, 24, 37]` would be valid index
keys.

## Explore the tree from the state

* `any (id)` or `any ()` &rarr; `true` if the state specified by `id` exists
  and if it is non-empty.
* `exists (id)` &rarr; `true` if the state specified by `id` exists.
* `keys` &rarr; an array of all the `key`s found for the state's child nodes.  
  Example: `['a', '0', '12', 'b']`
* `indexKeys` &rarr; an array of all the indexes of the state's child nodes;
  nodes will only be reported if their `key` is **zero** or a positive
  integer. The values will always be sorted.  
  Example: `[0, 1, 34]`

The state can also be used as a starting point for `find()` and `select()`.
Without any argument, they return the state itself.

* `select()` creates missing nodes.
* `find()` returns `undefined` if it does not find the specified child.
* `remove()` removes the node (if called without arguments) or the specified
  child, if an `id` is provided.

`select()`, `find()`, `remove()` and `any()` accept a child `id` or an index,
which will be converted to a key and used to look up the child.

## Adding items to an array

Arrays can be built using `state.add()`:

* `add ()` &rarr; a new child state, where the `key` is equal to the current
  highest index, plus one.

This is an easy way to add new states to an array of states.

```javascript
const store = Store.create ();
store.select ('a.1');
store.select ('a.2');
store.select ('a.5');

expect (store.select ('a').add ().key).to.equal ('6');
expect (store.select ('a').indexKeys).to.deep.equal ([1, 2, 5, 6]);
```

## Create state

To create state with an initial value, use `State.create()`.

```javascript
const state1 = State.create ('empty');
expect (state1.value).to.equal (undefined);

const state2 = State.create ('message', {'': 'Hello'});
expect (state2.value).to.equal ('Hello');

const state3 = State.create ('person', {name: 'Joe', age: 78});
expect (state3.get ('name')).to.equal ('Joe');
expect (state3.get ('age')).to.equal (78);
```

## Mutate state

State objects are immutable. Updating state will produce a copy of
the state object with the new values.

```javascript
const state1 = State.create ('a', {x: 1, y: 2});
const state2 = State.withValue (state1, 'x', 10);
const state3 = State.withValues (state1, 'x', 10, 'y', 20);
const state4 = State.with (state1, {values: {x: 10, y: 20}});

// Setting same values does not mutate state:
const state5 = State.with (state1, {values: {x: 1, y: 2}});
expect (state1).to.equal (state5); // same values, same state
```

It is also possible to use method `set()` to create a new state;
this is just syntactic sugar over the `State.withValue()` static
methods.

```javascript
const state1 = State.create ('a');
const state2 = state1.set ('x', 1);
const state3 = state2.set ('a'); // set default value
const state4 = state1.set ('x', 1, 'y', 2);
expect (state2.get ('x')).to.equal (1);
expect (state3.get ()).to.equal ('a');
expect (state4.get ('x')).to.equal (1);
expect (state4.get ('y')).to.equal (2);
```

## Mutate state in a store

When a state attached to a store is being mutated, the new state will
be stored in the tree, and all nodes up to the root will get updated
while doing so.

```javascript
const store = Store.create ();
expect (store.select ('a.b.c').generation).to.equal (1);  // gen. 1
expect (store.select ('a.b.d').generation).to.equal (2);  // gen. 2
State.withValue (store.select ('a.b.c'), 'x', 10); // gen. 3
expect (store.select ('a.b.c').generation).to.equal (3);
expect (store.select ('a.b.d').generation).to.equal (2); // unchanged
expect (store.select ('a.b').generation).to.equal (3);
expect (store.select ('a').generation).to.equal (3);
State.withValue (store.select ('a.b'), 'y', 20); // gen. 4
expect (store.select ('a.b.c').generation).to.equal (3); // unchanged
expect (store.select ('a.b.d').generation).to.equal (2); // unchanged
expect (store.select ('a.b').generation).to.equal (4);
expect (store.select ('a').generation).to.equal (4);
```
