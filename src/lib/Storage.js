import Extender from './Extender.js'

class Storage {
    
    constructor() {
        this.data = {
            "sys" : {
                "config" : {
                    "debug" : true
                }
            },
            "character" : {
                "count" : 0,
                "element" : false,
            },
            "stage" : {
                "elements" : [],
                "id"       : false
            }
        };
    }
    
    set(key,value) {
        // split the key
        let arrKey = key.split('.');
        // start recursive following the config path
        return this._setR(arrKey,value,this.data);
    }
    
    _setR(arrKey,value,ref) {
        let cKey   = arrKey.shift();
        // is this allready set?
        if(typeof ref[cKey] === 'undefined') {
            ref[cKey] = {};
        }
        // if there is more level than  we go on recursive
        if(arrKey.length > 0) {
            return this._setR(arrKey,value,ref[cKey]);
        } else {
            ref[cKey] = value;
            return true;
        }
    }
    
    increment(key) {
        var num = this.get(key);
        var intNum = parseInt(num);
        if("NaN" === intNum) {
            return false;
        }
        intNum++;
        this.set(key,intNum);
        return intNum;
    }
    
    decrement(key) {
        var num = this.get(key);
        var intNum = parseInt(num);
        if("NaN" === intNum) {
            return false;
        }
        if(intNum > 0) {
            intNum--;
            this.set(key,intNum);
        }
        return intNum;
    }
    
    get (key) {
        // split the key
        let arrKey = key.split('.');
        // start recursive following the config path
        return this._getR(arrKey,this.data);
    }
    
    _getR(arrKey,ref) {
        let cKey   = arrKey.shift();
        // is this allready set?
        if(typeof ref[cKey] === 'undefined') {
            return false;
        }
        // if there is more level than  we go on recursive
        if(arrKey.length > 0) {
            return this._getR(arrKey,ref[cKey]);
        } else {
            return ref[cKey];
        }
    }
    
}

module.exports = Storage;