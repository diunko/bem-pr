var path = require('path'),
    setsNodes = require('../../bem/nodes/sets');

MAKE.decl('Arch', {

    blocksLevelsRegexp:  /^.*blocks$/i,

    bundlesLevelsRegexp: /^.*bundles$/i,

    createCustomNodes : function(common) {
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
            'test' : ['common.blocks'],
            'pr'   : ['common.blocks']
        };
    }

});

var BEM = require('bem');

MAKE.decl('ExampleNode', {

    getTechs : function() {
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'css'
        ];
    },

    getExampleLevels : function() {
        if(this.getNodePrefix().indexOf('pr.sets') === 0) {
            return [
                'bem-bl/blocks-common',
                'bem-bl/blocks-desktop'
            ].map(path.resolve.bind(null, this.root));
        }

        return this.__base.apply(this, arguments);
    }

});
