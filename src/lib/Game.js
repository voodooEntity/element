import Extender from   './Extender.js';
import Storage from    './Storage.js';
import Log from        './Log.js';
import Gfx from        './Gfx.js';
import Util from       './Util.js';
import Stage from      './Stage.js';
import mainStage from  './stages/mainStage.js';

class Game extends Extender {
    
    constructor() {
        super();
        // default we are not running. handling the update method
        // of pixelbox this way
        this.running = false;

        // preinits (since we cant create classes from strings)
        this._preinit();

    }

    _preinit() {
        // i dont like it but ye. temporary its ok.
        window.app = {};
        
        // the system classes
        window.app.storage    = new Storage();
        window.app.log        = new Log();
        window.app.gfx        = new Gfx();
        window.app.util       = new Util();
        window.app.game       = this;
        
        // stage handlers
        window.app.handler                  = {};
        window.app.handler.stages           = {};
        window.app.handler.stages.mainStage = new mainStage();
    }
    
    run(story,elements,config) {
        super.get('log').info('Running game');
        
        // ### add savegame check
        // save data in game. scope storage
        super.get("storage").set("game.story",story);
        super.get("storage").set("game.elements",elements);
        super.get("storage").set("game.config",config);
        super.get("storage").set("game.startTime",this.getTimestamp() );

        // init ticks
        this.setTickRate(config.tickRate);
        this.initTicks();

        // set the active stage, default 0
        this.setStage(0); // ### playground setting

        // set running = true, this enables the update
        // method of game to be used
        this.running = true;
    }
    
    initTicks() {
        var time      = this.getTimestamp();
        this.lastTick = time;
    }
    
    getTimestamp() {
        var d = new Date();
        var t = d.getTime();
        return t;
    }
    
    calculateTicks() {
        // lets gat the time
        var currTime = this.getTimestamp();
        var timeDiff = currTime - this.lastTick;
        
        // is any tick time gone since last tick?
        // seems not lets return 0
        if(timeDiff < this.tickLength) {
            return 0;
        }
        
        // now we check how many ticks actually
        // passed since the last check
        var quotient  = Math.floor(timeDiff / this.tickLength);
        //var remainder = timeDiff % this.tickLength;
        
        // now we update the lastTick based on the quotient
        this.lastTick = this.lastTick + (quotient * this.tickLength);
        
        // and return the amount in this case the quotient
        return quotient;
    }
    
    setTickRate(tickRate) {
        this.tickRate   = tickRate;
        this.tickLength = 1000 / tickRate;
    }
    
    getTickRate() {
        return this.tickRate();
    }
    
    getActiveStage() {
        var active = super.get("storage").get("stage.id");
        return this.getStageByID(active);
    }
    
    update() {
        // make sure the game is started already
        if(false === this.running) {
            return;
        }
        
        // game seems running lets do the actual work
        var ticks = super.get("game").calculateTicks();
        if(0 < ticks) {
            for(var i = 0; i < ticks; i++) {
                var stage = super.get("game").getActiveStage();
                if("undefined" !== stage) {
                    stage.update();
                    super.get("gfx").update();
                }
            }
        }
    }
    
    setStage(id,reset) {
        // little info
        super.get("log").info("set stage " + id);

        // set current stage ID
        super.get("storage").set("stage.id",id);

        // first we check if the stage was instanced already
        var stage = this.getStageByID(id);
        if(stage && "undefined" === reset) {
        
            // reinit existing stage
            stage.reinit();
        
        } else {
            // init the stage
            var story     = super.get("storage").get("game.story");
            var stageData = story[id];
            stage      = new Stage();

            // get all currently stored stages and add the new one
            var stages = super.get("storage").get("stage.elements");
            stages[id] = stage;

            // store the sage in stage.elements
            super.get("storage").set("stage.elements",stages);
    
            // finally start the stage initer
            stage.init(id, stageData);
        }
    }
    
    getStageByID(id) {
        var stages = super.get("storage").get("stage.elements");
        if("undefined" === stages[id]) {
            return false;
        }
        return stages[id];
    }
    
}

module.exports = Game;