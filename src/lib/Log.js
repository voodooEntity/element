import Extender from './Extender.js';

class Log extends Extender {
    
    construct() {
        if(super.get('storage').get('sys.config.debug') !== true) {
            localStorage.setItem('log','');
        }
    }
    
    info(msg,data) {
        if(super.get('storage').get('sys.config.debug') === true) {
            this.append('info',msg,data);
        }
    }
    
    warning(msg,data) {
        if(super.get('storage').get('sys.config.debug') === true) {
            this.append('warning',msg,data);
        }
    }
    
    error(msg,data) {
        this.append('error',msg,data);
    }
    
    append(type,msg,data) {
        // get the date
        let logline = new Date().toLocaleString();
        // append log message type
        logline    += ' [' + type + '] ' + msg;
        // if we got data
        if(typeof data !== 'undefined'){
            // dispatch the type
            if(typeof data === 'object' || typeof data == 'array') {
                logline += " |JSON: " +  JSON.stringify(data);
            } else if(typeof data === 'boolean') {
                logline += " |Boolean: " + data.toString();
            } else {
                logline += " |String: " + data;
            }
        }
        // break the line
        logline += "\n";
        console.log(logline);
    }
}

module.exports = Log;
