import Extender from './Extender.js';

class Util extends Extender {
    
    constructor() {
        super();
    }
    
    uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    aabbCollision(rect1,rect2) {
        if (rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y) {
            return true;
        }
        return false;
    }

    getDifferenceBetweenNumbers(alpha,beta) {
        return Math.abs(alpha - beta);
    }

    
}

module.exports = Util;