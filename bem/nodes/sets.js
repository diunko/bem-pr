/**
 * @fileOverview Узлы для сборки наборов БЭМ-сущностей (sets)
 *
 * TODO
 * корневые узлы для сборки *всего* набора
 *
 *     › bem make sets
 *     › bem make examples      ← как определить примеры какого набора собрать?
 *
 * узлы для сборки тестов
 */

var BEM = require('bem'),
    PATH = require('path'),
    FS = require('fs'),

    Q = BEM.require('qq'),
    MKDIRP = BEM.require('mkdirp'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    registry = BEM.require('./nodesregistry'),
    nodes = BEM.require('./nodes/node'),
    magicNodes = BEM.require('./nodes/magic'),
//    levelNodes = BEM.require('./nodes/level'),
    blockNodes = BEM.require('./nodes/block'),
    bundleNodes = BEM.require('./nodes/bundle'),
    createNodes = BEM.require('./nodes/create'),
    fileNodes = BEM.require('./nodes/file'),

    // XXX: monkey-patching
    monkeyNodes = require('./monkey'),

    SetsNodeName = exports.SetsNodeName = 'SetsNode',
    SetsLevelNodeName = exports.SetsLevelNodeName = 'SetsLevelNode',
    ExamplesLevelNodeName = exports.ExamplesLevelNodeName = 'ExamplesLevelNode',
    ExampleSourceNodeName = exports.ExampleSourceNodeName = 'ExampleSourceNode',
    ExampleNodeName = exports.ExampleNodeName = 'ExampleNode',

    /** Id главного узла сборки наборов */
    SETS_NODE_ID = 'sets',

    createLevel = BEM.createLevel;


Object.defineProperty(exports, SetsNodeName, {
    get : function() {
        return registry.getNodeClass(SetsNodeName);
    }
});


registry.decl(SetsNodeName, nodes.NodeName, {

    __constructor : function(o) {

         this.__base(o);

         this.arch = o.arch;
         this.root = o.root;
         this.rootLevel = createLevel(this.root);

    },

    alterArch : function(parent, children) {

        var _t = this,
            arch = _t.arch;

        return Q.when(_t.createCommonSetsNode.call(_t, parent))
            .then(function(common) {
                return Q.call(_t.createSetsLevelNodes, _t,
                    parent? [common].concat(parent) : common, children);
            })
            .then(function() {
                LOGGER.info(arch.toString());
                return arch;
            })
            .fail(console.log);

    },

    createCommonSetsNode : function(parent) {

        var node = new nodes.Node(SETS_NODE_ID);
        this.arch.setNode(node, parent);

        return node.getId();

    },

    createSetsLevelNodes : function(parents, children) {

        var sets = this.getSets();
        return Object.keys(sets).map(function(name) {

            var node = new (registry.getNodeClass(SetsLevelNodeName))({
                    root    : this.root,
                    level   : this.rootLevel,
                    name    : name,
                    techName : 'sets',
                    sources : sets[name]
                });

            this.arch.setNode(node);

            parents && this.arch.addParents(node, parents);
            children && this.arch.addChildren(node, children);

            return node.getId();

        }, this);

    },

    /**
     * TODO: Придумать формат описания набора
     * @returns {Object} Описание наборов `{ name : [level1, level2] }`
     */
    getSets : function() {
        return { };
    }

}, {

    create : function(o) {
        return new this(o);
    }

});


var GeneratedLevelNodeName = 'GeneratedLevelNode';

registry.decl(GeneratedLevelNodeName, magicNodes.MagicNodeName, {

    __constructor : function(o) {

        Object.defineProperty(this, 'level', {
            get : function() {
                return createLevel(PATH.resolve(this.root, this._level));
            }
        });

        this.item = o.item;
        this.techName = o.techName;
        this._level = o.level.dir || o.level;

        this.rootLevel = createLevel(this.root);

        this.__base(U.extend({ path : this.__self.createPath(o) }, o));

    },

    make : function() {
        return this.ctx.arch.withLock(this.alterArch(), this);
    },

    /**
     * @returns {Function}
     */
    alterArch : function() {

        var ctx = this.ctx;

        return function() {

            var arch = ctx.arch,
                levelNode,

                snapshot1 = this.takeSnapshot('Before GeneratedLevelNode alterArch');

            if(arch.hasNode(this.path)) {
                levelNode = arch.getNode(this.path);
            } else {
                levelNode = this.useFileOrBuild(new createNodes.BemCreateNode({
                        root     : this.root,
                        level    : this.level,
                        item     : this.item,
                        techName : this.techName
                    }));

                arch.setNode(levelNode, arch.getParents(this));
            }

            return Q.all([snapshot1, this.takeSnapshot('After GeneratedLevelNode alterArch ' + this.getId())])
                .then(function() {
                    return levelNode.getId();
                });

        };

    },

    useFileOrBuild : function(node) {

        if(FS.existsSync(node.getPath())) {
            return new fileNodes.FileNode({
                root : this.root,
                path : node.getId()
            });
        }

        return node;

    }

}, {

    create : function(o) {
        return new this(o);
    },

    createPath : function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return level
            .getTech(o.techName)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    },

    createNodePrefix: function(o) {

        // FIXME: hardcoded NodePrefix
//        return serializeBemItem(PATH.relative(o.root, o.level.dir), o.item);
        var level = typeof o.level === 'string'?
                createLevel(PATH.resolve(o.root, o.level)) :
                o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});


registry.decl(SetsLevelNodeName, GeneratedLevelNodeName, {

    __constructor : function(o) {

        this.sources = o.sources;
        this.setsName = o.name;

        o.item || (o.item = { block : o.name, tech : o.techName });

        this.__base(o);

    },

    /**
     * @returns {Function}
     */
    alterArch : function() {

        var base = this.__base();
        return function() {

            var _t = this;
            return Q.when(base.call(this))
                .then(function(levelNode) {

                    var arch = _t.ctx.arch,
                        decls = _t.scanSources();

                    decls.forEach(function(item) {

                        var o = {
                            root     : this.root,
                            level    : this.path,
                            item     : item,
                            techName : item.tech
                        };

                        var exampleNode = registry
                            .getNodeClass(ExamplesLevelNodeName)
                            .create(o);

                        arch.setNode(exampleNode, arch.getParents(this), levelNode);

                        // TODO: move to method
                        o = {
                            root  : this.root,
                            item  : item,
                            level : item.level
                        };

                        var blockNode,
                            id = blockNodes.BlockNode.createId(o);

                        if(arch.hasNode(id)) {
                            blockNode = arch.getNode(id);
                        } else {
                            blockNode = new blockNodes.BlockNode(o);
                        }

                        arch.setNode(blockNode, exampleNode);

                        // XXX: hardcore
                        exampleNode._blockNode = blockNode;

                    }, _t);

                    return _t.takeSnapshot('After SetsLevelNode alterArch ' + _t.getId());

                });

        };

    },

    getSourceItemTechs : function() {
        return [
            'docs',
            'examples',
            'spec.js'
        ];
    },

    getSources : function() {

        if(!this._sources) {
            var absolutivize = PATH.resolve.bind(null, this.root);

            this._sources = this.sources.map(function(level) {
                    if(typeof level === 'string')
                        return createLevel(absolutivize(level));
                    return level;
                });
        }

        return this._sources;

    },

    scanSources : function() {

        return this.getSources()
            .map(this.scanSourceLevel.bind(this))
            .reduce(function(decls, item) {
                return decls.concat(item);
            }, []);

    },

    scanSourceLevel : function(level) {

        var relativize = PATH.relative.bind(null, this.root),
            techs = this.getSourceItemTechs();

        return level.getItemsByIntrospection()
            .filter(function(item) {
                return ~techs.indexOf(item.tech);
            })
            .map(function(item) {
                item.level = relativize(level.dir);
                // XXX: key?
                item.key = serializeBemItem(item.level, item);
                return item;
            });

    }

}, {

    create : function(o) {
        return new this(o);
    }

});


registry.decl(ExamplesLevelNodeName, GeneratedLevelNodeName, {

    /**
     * @returns {Function}
     */
    alterArch : function() {

        var base = this.__base();
        return function() {

            var _t = this,
                arch = _t.ctx.arch;
            return Q.when(base.call(_t), function(levelNode) {

                var decls = _t.scanSourceLevel();

                decls.forEach(function(item) {

                    // TODO: meta node
                    var source = PATH.relative(this.root, createLevel(
                            this._blockNode.level.getPathByObj(
                                    this.item, this.item.tech)).getPathByObj(item, item.tech)),
                        srcNode = registry.getNodeClass(ExampleSourceNodeName).create({
                            root   : this.root,
                            level  : this.path,
                            item   : item,
                            source : source
                        });

                    arch.setNode(srcNode, arch.getParents(this))
                        .addChildren(srcNode, [levelNode, _t._blockNode]);

                    // TODO: source node should be block, not any BEM-item
                    var sourceNode;
                    if(arch.hasNode(source)) {
                        sourceNode = arch.getNode(source);
                    } else {
                        sourceNode = new fileNodes.FileNode({
                            root : this.root,
                            path : source
                        });
                    }

                    arch.setNode(sourceNode, srcNode);

                    var bundleNode = registry.getNodeClass(ExampleNodeName).create({
                        root   : this.root,
                        source : PATH.dirname(source),   // FIXME: hack
                        level  : this.path,
                        item   : item
                    });

                    arch.setNode(bundleNode, arch.getParents(this), srcNode);

                }, _t);

//                 (XXX,debug): final arch struct
//                LOGGER.info(arch.toString());

                return _t.takeSnapshot('After ExamplesLevelNode alterArch ' + _t.getId());;

            });

        };

    },

    getSourceItemTechs : function() {
        return ['bemjson.js'];
    },

    scanSourceLevel : function(level) {

        var sourceTechs = this.getSourceItemTechs();

        return createLevel(this._blockNode.level.getPathByObj(this.item, this.item.tech))
            .getItemsByIntrospection().filter(function(item) {
                return ~sourceTechs.indexOf(item.tech);
            });

    }

});


registry.decl(ExampleSourceNodeName, fileNodes.GeneratedFileNodeName, {

    __constructor : function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.item = o.item;
        this.source = o.source;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    make : function() {

        var _t = this;
        return U.readFile(PATH.resolve(this.root, this.source))
            .then(function(data) {

                MKDIRP.sync(PATH.dirname(_t.getPath()));

                return U.writeFileIfDiffers(_t.getPath(), data)
                    .then(function() {
                        return _t.path;
                    });

            });

    }

}, {

    create : function(o) {
        return new this(o);
    },

    createPath : function(o) {

        var level = typeof o.level === 'string'?
                createLevel(PATH.resolve(o.root, o.level)) :
                o.level;

        return level
            .getTech(o.item.tech)
            .getPath(this.createNodePrefix(o));

    },

    createNodePrefix : function(o) {

//        return serializeBemItem(PATH.relative(o.root, o.level), o.item);
        var level = typeof o.level === 'string'?
                createLevel(PATH.resolve(o.root, o.level)) :
                o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});


registry.decl(ExampleNodeName, bundleNodes.BundleNodeName, {

    __constructor : function(o) {

        this.__base(o);

        this.source = o.source;
        this.sourceLevel = createLevel(this.source);
        this.rootLevel = createLevel(this.root);

    },

    getSourceNodePrefix : function() {

        if (!this._sourceNodePrefix) {
            this._sourceNodePrefix = this.__self.createNodePrefix({
                root: this.root,
                level: this.sourceLevel.dir,
                item: this.item
            });
        }
        return this._sourceNodePrefix;

    },

    getTechs : function() {

        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'css',
            'js',
            'bemhtml.js',
            'html'
            ];

    },

    getExampleLevels : function(techName) {
        return this.sourceLevel.getConfig().bundleBuildLevels;
    },

    getLevels : function(techName) {

        var prefix = this.getSourceNodePrefix();

        return [].concat.call(this.getExampleLevels(techName) || [],
                this.sourceLevel.getTech('blocks').getPath(prefix));

    },

    createTechNode : function(tech, bundleNode, magicNode) {

        // NOTE: we use `ExampleSourceNode` to build example's source bundle
        if(tech === this.item.tech)
            return false;

        return this.__base.apply(this, arguments);

    },

}, {

    create : function(o) {
        return new this(o);
    }

});


function serializeBemItem() {
    return [].splice.call(arguments, 0)
        .reduce(function(keys, item) {

            if(typeof item === 'string') {
                item = item.trim();
                if(!item)
                    return keys;
                item = { block : item };
            };

            keys.push(U.bemKey(item));
            return keys;

        }, [])
        .join('/');
}

function parseBemItem(key) {
    return (key + '').split('/').map(function(part) {
            return U.bemParseKey(part);
        });
}

