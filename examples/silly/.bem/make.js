/*global MAKE */

var PATH = require('path'),
    BEM = require('bem'),
    setsNodes = require('../../../bem/nodes/sets');

MAKE.decl('Arch', {

    blocksLevelsRegexp  : /^.*blocks$/i,
    bundlesLevelsRegexp : /^.*bundles$/i,

    createCustomNodes : function() {
        return new (setsNodes.SetsNode)({
                root : this.root,
                arch : this.arch
            })
            .alterArch();
    }

});

MAKE.decl('SetsNode', {

    getSets : function() {
        return {
            'test' : ['common.blocks']
        };
    }

});

MAKE.decl('ExampleNode', {

    getTechs : function() {
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'css'
        ];
    },

    getLevels : function() {
        var resolve = PATH.resolve.bind(null, this.root),
            levels = ['common.blocks'];

        // appending `block.examples/example-name.blocks` level
        levels.push(this.rootLevel.getTech('blocks').getPath(this.getSourceNodePrefix()));

        return levels.map(function(p) { return resolve(p) });
    }

});

MAKE.decl('TestNode', {

    getTechs : function() {
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'test.js'
//            'phantom.js'
        ];
    },

    getLevels : function() {
        var levels = this.__base();
        levels.push(PATH.resolve(this.root, '../../../test.blocks'));

        return levels;
    }

});