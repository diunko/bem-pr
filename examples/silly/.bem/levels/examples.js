var path = require('path'),
    PRJ_ROOT = path.resolve(__dirname, '../../');

exports.baseLevelPath = require.resolve('bem/lib/levels/simple');

exports.getTechs = function() {
    return {
        'blocks'     : '',
        'bemjson.js' : '',
        'title.txt'  : ''
    };
};

exports.getConfig = function() {
    return {
        bundleBuildLevels : ['common.blocks'].map(path.resolve.bind(null, PRJ_ROOT))
    };
};