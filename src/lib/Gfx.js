import Extender from './Extender.js'
import Box      from './objects/Box.js';

class Gfx extends Extender{
    
    constructor() {
        super();
    }
    
    drawSprite(x,y,id) {
        sprite(id,x, y);
    }
    
    drawBase() {
        var stage = super.get("game").getActiveStage();
        //var map   = stage.getMap();
        cls();
        paper(stage.getPaper());
        //map.draw(0,0);
    }
    
    drawElements() {
        // some prefetching
        var stage       = super.get("game").getActiveStage();
        var config      = super.get("storage").get("game.config");
        var camPos      = stage.getCam();

        // get all elements to draw
        var toDraw = stage.elementQuad.query(
            new Box(
                Math.max(camPos.x - config.tileWidth,0),
                Math.max(camPos.y - config.tileWidth,0),
                config.screen.x * config.tileWidth,
                config.screen.y * config.tileWidth
            )
        );

        // finally update the gfx
        for(var i in toDraw) {
            this.drawSprite(
                toDraw[i].x - camPos.x,
                toDraw[i].y - camPos.y,
                toDraw[i].data.tileID
            );
        }
    }
    
    update() {
        this.drawBase();
        this.drawElements();
    }
    
}

module.exports = Gfx;
