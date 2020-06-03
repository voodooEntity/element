class Extender {
    
    get(key) {
        if(typeof window.app[key] !== 'undefined') {
            return window.app[key];
        }
        return false;
    }
    
}

module.exports = Extender;