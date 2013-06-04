exports.baseLevelPath = require.resolve('bem/lib/levels/simple.js');

exports.getTechs = function() {
    return {
        'blocks'  : '',
        'bundles' : '',
        'sets'    : require.resolve('../../../bem/techs/sets.js')
    };
};
