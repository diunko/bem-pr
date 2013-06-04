BEM.TEST.decl('seven', function() {

    it('Пятнадцатого мая 2013-го была среда', function() {
        expect((new Date(2013, 4, 15)).getDay()).toEqual(3)
    })

});
