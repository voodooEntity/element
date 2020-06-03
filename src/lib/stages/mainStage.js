import Extender  from './../Extender.js'
import Character from './../Character.js'

class mainStage extends Extender {
    
    constructor() {
        super();
    }
    
    init() {
        return;
        // set character
        var stage      = super.get("game").getActiveStage();
        new Character(
            24,
            24,
            "smallCharacter",
            {
                "gravity"    : true,
                "jumpHeight" : 32,
                "jumpSpeed"  : 20, // ticks
            }
        );
        stage.addHandler("character",() => {
            window.app.storage.get("game.character").update();
        });
    }
    
    reinit() {
    }
    
    update() {
    }
    
    hitTheWall() {
    }
    
    touchTheWall() {
    }
    
}


module.exports = mainStage;