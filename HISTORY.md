0.0.6 / 2013-02-07 (Unstable)
==================

  * basic level naming scheme is used for all levels: simple-levels couldn't be resolved properly from the cold run
  * all levels used common level prototype `bem/levels/sets.js` as base level, to simplify customization proccess
  * `ExampleNode#getExampleLevels` public method added, to customize set of levels used by building process
  * by default bem-build used levels, declared by `Level#getConfig` method of example's source level
    (e.g. `blocks/one/one.examples/.bem/level.js`)

0.0.3 / 2013-01-26
==================

  * adding parent node for "sets" node should be option
  * howto guide improved

0.0.2 / 2013-01-16
==================

  * sets node for bem-make fixed to build all the sets
  * fixed build nodes order
  * fixed issue with first-run levels resolving, when bem-make couldn't resolve tech's path properly (see bem/bem-tools/issues#341)
  * howto guide added in russian

0.0.1 / 2013-01-13
==================

  * root sets node added to build all sets
  * some code refactoring
  * documentation fixed

0.0.0 / 2013-01-10
==================

  * first working draft released
  * basic documentation in russian

