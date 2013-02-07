exports.baseLevelPath = require.resolve('bem/lib/levels/simple.js');

exports.getTechs = function() {
    return {
        'blocks'  : '',
        'bundles' : '',
        'sets'    : '../../bem/techs/sets'
    };
};
