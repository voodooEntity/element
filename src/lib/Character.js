import Extender from './Extender.js'
import Box      from './objects/Box.js';
import Point    from './objects/Point.js';

class Character extends Extender {
    
    constructor(x,y,elementName,config) {
        super();
        super.get("log").info("spawning character");

        // generate a uuid for this character
        this.uuid = super.get("util").uuidv4();

        // some presets
        this.config = {
            "speed" : 1,
            "gravity" : false,
            "jumpHeight" : 32,
            "jumpSpeed" : 20, // ticks
        };
        this.holdJump  = false;
        this.isJumping = false;

        // building character info and storing position
        var character  = this.buildCharacterInfo(elementName);
        this.setPos(x,y);
        
        // overwrite config if given
        if("undefined" !== typeof config) {
            this.setConfig(config);
        }

        // store the character sprites
        this.setCharacterSprites(character.elements);
        
        // store character in game storage for easier access
        super.get("storage").set("game.character",this);
    }
    
    setConfig(config) {
        if("undefined" !== typeof config.speed) {
            this.config.speed = config.speed;
        }
        if("undefined" !== typeof config.gravity) {
            this.config.gravity = config.gravity;
        }
        if("undefined" !== typeof config.jumpSpeed) {
            this.config.jumpSpeed = config.jumpSpeed;
        }
        if("undefined" !== typeof config.jumpHeight) {
            this.config.jumpHeight = config.jumpHeight;
        }
    }
    
    buildCharacterInfo(elementName) {
        var element = super.get("storage").get("game.elements." + elementName);
        var config  = super.get("storage").get("game.config");
        
        var width  = 0;
        var height = 0; 
        for(var i in element.elements) {
            if(element.elements[i].x > width) {
                width  = element.elements[i].x;
            }
            if(element.elements[i].y > height) {
                height = element.elements[i].y;
            }
        }
        
        this.setWidth(width + config.tileWidth);
        this.setHeight(height + config.tileWidth);
        return element;
    }
    
    setCharacterSprites(sprites){
        this.characterSprites = sprites;
    }
    
    getCharacterSprites() {
        return this.characterSprites;
    }

    getUUID() {
        return this.uuid;
    }
    
    pushIntoElementQuad() {
        var stage  = super.get("game").getActiveStage();
        var camPos = stage.getCam();
        var pos    = this.getPos();
        for(var i in this.characterSprites) {
            var tmpSubEl = new Box(
                (this.characterSprites[i].x + pos.x - camPos.x),
                (this.characterSprites[i].y + pos.y - camPos.y),
                this.getWidth(),
                this.getHeight(),
                {
                    "uuid"   : this.getUUID(),
                    "name"   : "character",
                    "tileID" : this.characterSprites[i].tileID // ### todo add more info f.e. tilesheet
                }
            );
            stage.elementQuad.insert(tmpSubEl);
        }
    }

    removeFromElementQuad() {
        //console.log("remove quad");
        var stage  = super.get("game").getActiveStage();
        stage.elementQuad.remove(
            new Point(
                1,
                1,
                {
                    "uuid" : this.getUUID()
                }
            )
        );
    }
    
    setHeight(height) {
        this.height = height;
    }
    
    getHeight() {
        return this.height;
    }
    
    setWidth(width) {
        this.width = width;
    }
    
    getWidth() {
        return this.width;
    }
    
    setSpriteID(id) {
        this.spriteID = id;
    }
    
    getSpriteID() {
        return this.spriteID;
    }
    
    setPos(x,y) {
        this.posX = x;
        this.posY = y;
    }
    
    getPos() {
        return {
            x : this.posX,
            y : this.posY
        };
    }

    update() {
        // predefinitions
        var config       = super.get("storage").get("game.config");
        var stage        = super.get("game").getActiveStage();
        var mapReso      = stage.mapReso;
        var tileWidth    = config.tileWidth;
        var maxX         = mapReso.x * tileWidth;
        var maxY         = mapReso.y * tileWidth;
        var screen       = config.screen;
        var camPos       = stage.getCam();
        var character    = this.getPos();
        var oldX         = character.x;
        var oldY         = character.y;
        var moveDistance = config.moveDistance * tileWidth;
        var boundry,nextPos,triggerPos = false;
        var startedJumping = false;
        
        // merge all input sources
        var input = this.getInput();
        
        // press right
        if (input.right) {
            boundry    = camPos.x + (screen.x * tileWidth);
            nextPos    = character.x + 1 + this.getWidth(); // #### todo add character width and lines below
            triggerPos = nextPos + moveDistance;
            if(triggerPos > boundry && nextPos <= (mapReso.x * tileWidth)) {
                if(camPos.x + screen.x * tileWidth < maxX) {
                   camPos.x++;
                }
            }
            if(character.x + 1 < maxX - this.getWidth() + 1) {
                character.x += 1;
            }
        }
        
        //press left
        if (input.left) {
            boundry    = camPos.x;
            nextPos    = character.x - 1;
            triggerPos = nextPos - moveDistance;
            if(triggerPos < boundry && nextPos >=0) {
                if(camPos.x > 0) {
                    camPos.x--;
                }
             }
            if(character.x - 1 >= 0) {
                character.x -= 1;
            }
        }
        
        
        // this is a special case bcause we need to switch between gravity and non gravity mode
        if(false === this.config.gravity)  {
            // press up
            if (input.up)    {
                boundry    = camPos.y;
                nextPos    = character.y - 1;
                triggerPos = nextPos - moveDistance;
                if(triggerPos < boundry && nextPos >= 0) {
                    if (camPos.y > 0) {
                        camPos.y--;
                    }
                }
                if(character.y - 1 > 0) {
                    character.y -= 1;
                }
            }
        }
                
        // press down
        if (input.down)  {
            boundry    = camPos.y + (screen.y * tileWidth);
            nextPos    = character.y + 1;
            triggerPos = nextPos + moveDistance + this.getHeight();
            if(triggerPos > boundry && nextPos <= (mapReso.y * tileWidth) ) {
                if(camPos.y + screen.y * tileWidth < maxY) {
                    camPos.y++;
                }
            }
            if(character.y + 1 < maxY - this.getHeight() + 1) {
                character.y += 1;
            }
        }
        
        // handle character collisions
        character = this.handleCollisionDetection(character,oldX,oldY);
        
        if(this.config.gravity) {
            // if u stopped pressing jumpt so u cant resume to do it
            // 1 million edge cases fml
            if(this.holdJump && !input.a) {
                this.holdJump = false;
            }
            
            // ok we got gravity, lets check for jumping
            if (input.a) {
                if(false === this.isJumping) {
                    if(this.isOnTheFloor(character)) {
                        sfx('jump');
                        this.isJumping         = true;
                        this.holdJump          = true;
                        startedJumping         = true;
                        this.currJumpingHeight = 0;
                    }
                } else {
                    var tickJumpHeight = Math.floor(this.config.jumpHeight / this.config.jumpSpeed);
                    // if we didnt reach max jumpheight already
                    if(this.currJumpingHeight < this.config.jumpHeight && this.holdJump) {
                        var test = {
                            x : character.x,
                            y : character.y
                        };
                        for(var i = 0;  i < tickJumpHeight; i ++) {
                            test.y = test.y - 1;
                            var check = this.hitTheCeiling(test);
                            // we cant get higher
                            if(false !== check) {
                                sfx('jumpcollide');
                                this.currJumpingHeight = this.config.jumpHeight; // to make checks easier
                                break;
                            } else {
                                this.currJumpingHeight += 1;
                                test.y = test.y - 1;
                            }
                        }
                        if(test.y < character.y) {
                            character.y = test.y;
                        }
                    }
                }
            }
        }
        
        // reset jumping if we hit the floor again
        if(this.isJumping && false == startedJumping) {
            if(this.isOnTheFloor(character)) {
                this.isJumping = false;
            }
        } 
        
        if(false !== this.config.gravity) {
            // now we handle gravity including a recheck on camera movement
            // move this later
            var result = this.handleGravity(character,camPos);
            character  = result.character;
            camPos     = result.camPos;
        }

        // finally update camera and redraw character
        stage.setCam(camPos.x , camPos.y);
        this.setPos(character.x,character.y);
        this.updateElementQuad();
    }

    updateElementQuad() {
        this.removeFromElementQuad();
        this.pushIntoElementQuad();
    }

    
    handleGravity(character,camPos){
        var stage  = super.get("game").getActiveStage();
        var mapReso= stage.mapReso;
        var config =  super.get("storage").get("game.config");
        var screen = config.screen;
        var maxY = mapReso.y * config.tileWidth ;
        var next = 0;
        
        for(var i = 0;i < this.config.gravity;i++) {
            var onTheFloor = this.isOnTheFloor(character);
            next = character.y + 1;
            if(next < maxY - this.getHeight() && false === onTheFloor) {
                character.y    = next;
                var boundry    = camPos.y + (screen.y * config.tileWidth);
                var triggerPos = next + config.moveDistance + this.getHeight();
                if(triggerPos > boundry && next <= maxY ) {
                    if(camPos.y + screen.y * config.tileWidth < maxY) {
                        camPos.y++;
                    }
                }
            } else {
                break;
            }
        }
        
        return {
            "character" : character,
            "camPos"  : camPos
        };
    }

    hitTheCeiling(charPos) {
        // some prefetching
        var config      = super.get("storage").get("game.config");

        // get min  lookup for x & y axis
        var minLookupX  = Math.max(charPos.x - config.tileWidth ,0);
        var minLookupY  = Math.max(charPos.y - config.tileWidth ,0);

        // just return collision detection
        return this.collisionInRange(
            minLookupX,
            minLookupY,
            this.getWidth() + 2 * config.tileWidth, // ### todo check if 2 * config.tileWidth is correct here, im not sure tho
            this.getHeight(),
            charPos
        );
    }


    isOnTheFloor(charPos) {
        // some prefetching
        var config      = super.get("storage").get("game.config");

        // get min  lookup for x & y axis
        var minLookupX  = Math.max(charPos.x - config.tileWidth  ,0);
        var minLookupY  = Math.max(charPos.y ,0);


        // increse charpos Y by 1 to see if the next pixel collides with us
        var test = {
            "x" : charPos.x,
            "y" : charPos.y
        };
        
        var collision = this.collisionInRange(
            minLookupX,
            minLookupY,
            this.getWidth()  + 2 * config.tileWidth,  // ### todo check if 2 * config.tileWidth is correct here, im not sure tho
            this.getHeight() + 2 * config.tileWidth, // ### todo check if 2 * config.tileWidth is correct here, im not sure tho
            test
        );

        // if we collide AND its an y axis collision,
        // than we are indeed on the floor
        if(collision) {
            // through all collision elements
            for(var i in collision) {
                // is y axis in detect?
                if(collision[i].detect.includes("y")) {
                    return true;
                }
            }
        }

        // didnt collide or not on y axis
        return false;
    }

    collisionInRange(minLookupX,minLookupY,lookupWidth,lookupHeight,charPos) {
        var stage       = super.get("game").getActiveStage();
        var collision   = false;
        var ret         = [];

        // lets check if charPos is given, if not we gonne fetch it
        // from current position
        if('undefined' === typeof charPos){
            var charPos = this.getPos();
        }
        
        // prepare character check element
        var charCheck = {
            "x" : charPos.x,
            "y" : charPos.y,
            "w" : this.getWidth(),
            "h" : this.getHeight(),
        };

        // retrieve elements from elementQuad
        var inScope =  stage.elementQuad.query(
            new Box(
                minLookupX,
                minLookupY,
                lookupWidth, 
                lookupHeight 
            )
        );

        // if there are no elements nearby, just return false;
        // 1 because the character itself is there
        if(1 === inScope.length) {
            return false;
        }

        // now we iterate through all elements
        var selfUUID = this.getUUID();
        for(var i in inScope) {
            var tmpEl = inScope[i];
            if(true === tmpEl.data.block && tmpEl.data.uuid != selfUUID){
                collision = this.mazeAABBcollision(charCheck, {
                    "x" : tmpEl.x,
                    "y" : tmpEl.y,
                    "w" : tmpEl.w,
                    "h" : tmpEl.h 
                });
                if(collision) {
                    ret.push({
                        'elem'   : tmpEl,
                        'detect' : collision
                    });
                }
            }
        }

        // if we detected any element collisions
        if(0 < ret.length) {
            return ret;
        }
        
        return false;
    }

    
    
    handleCollisionDetection(character,oldX,oldY) {
        // predefitnions
        var collision   = false;
        var check       = false;
        var resetX      = false;
        var resetY      = false;
		var xResettable = true;
		var yResettable = true;
        
        
        // collision detection on movement
        collision = this.detectCollisions(character);
        if (collision && 0 < collision.length) {
            for(var i in collision) {
                // both sides collide
                if(collision[i].detect.includes("x") && collision[i].detect.includes("y")) {
					
					if ( yResettable )
					{
						check = this.mazeAABBcollision({
							"w" : this.getWidth() ,
							"h" : this.getHeight() ,
							"x" : character.x,
							"y" : oldY
						}, {
							"w" : 8 ,
							"h" : 8 ,
							"x" : collision[i].elem.x,
							"y" : collision[i].elem.y
						});
						if( check) {
							yResettable = false;
						} else {
							resetY = true;
						}
					}
                    
                    if(xResettable) {
                        check = this.mazeAABBcollision({
                            "w" : this.getWidth() ,
                            "h" : this.getHeight() ,
                            "x" : oldX,
                            "y" : character.y
                        },{
                            "w" : 8 ,
                            "h" : 8 ,
                            "x" : collision[i].elem.x,
                            "y" : collision[i].elem.y
                        });						

                        if(check) {
							xResettable = false;
                        }  else {
                            resetX = true;
                        }
                    }
                    
                    // only one side collides
                } else {
                    if(collision[i].detect.includes("x")) {
                        resetX = true;
						yResettable = false;
                    }
                    if(collision[i].detect.includes("y")) {
                        resetY = true;
						xResettable = false;
                    }
                }
            }
        }

        if(resetX && xResettable) {
            character.x = oldX;
        }
        if(resetY && yResettable) {
            character.y = oldY;
        }
        
        return character;
    }
    

    detectCollisions(charPos) {
        // get config from global storage
        var config      = super.get("storage").get("game.config");

        // get min  lookup for x & y axis
        var minLookupX  = Math.max((charPos.x - config.tileWidth) ,0);
        var minLookupY  = Math.max((charPos.y - config.tileWidth) ,0);

        // just return collision detection
        return this.collisionInRange(
            minLookupX,
            minLookupY,
            this.getWidth()  + 2 * config.tileWidth, // ### todo check if 2 * config.tileWidth is correct here, im not sure tho
            this.getHeight() + 2 * config.tileWidth, // ### todo check if 2 * config.tileWidth is correct here, im not sure tho
            charPos
        );
    }
    
    mazeAABBcollision(recta,rectb) {
        // check if x overlaps
        if( recta.x < rectb.x + rectb.w && recta.x + recta.w > rectb.x ) {
            // check if y overlaps
            if( recta.y < rectb.y + rectb.h && recta.y + recta.h > rectb.y ) {
                let xOverlapSize = 0;
                
                // check if A starts more right then B
                if( recta.x > rectb.x ) {
                    //  	|<- A
                    //  |<- B
                    
                    // check if A ends more right then B
                    if( recta.x + recta.w > rectb.x + rectb.w ) {
                        //      |<- A  ->|
                        //	|<- B   ->|
                        xOverlapSize = (rectb.x + rectb.w) - recta.x;
                    } else {
                        //     |<- A ->|
                        //	|<-    B   ->|
                        xOverlapSize = recta.w;
                    }
                } else {
                    //  |<- A
                    //  	|<- B
                    
                    // check if A ends more right then B
                    if( recta.x + recta.w > rectb.x + rectb.w ) {
                        //	|<-    A   ->|
                        //     |<- B ->|
                        xOverlapSize = rectb.w;
                    } else {
                        //  |<- A  ->|
                        //		|<- B   ->|
                        xOverlapSize = (recta.x + recta.w) - rectb.x;
                    }
                }
                
                let yOverlapSize = 0;
                
                if( recta.y > rectb.y ) {
                    if( recta.y + recta.h > rectb.y + rectb.h ) {
                        yOverlapSize = ( rectb.y + rectb.h ) - recta.y;
                    } else {
                        yOverlapSize = recta.h;
                    }
                } else {
                    if( recta.y + recta.h > rectb.y + rectb.h ) {
                        yOverlapSize = rectb.h;
                    } else {
                        yOverlapSize = (recta.y + recta.h) - rectb.y;
                    }
                }
                
                if( xOverlapSize > yOverlapSize ) {
                    return [{"y" : yOverlapSize},"y"];
                } else if ( xOverlapSize == yOverlapSize ) {
                    return [{"x" : xOverlapSize,"y" : yOverlapSize},"x","y"];
                } else {
                    return [{"x" : xOverlapSize},"x"];
                }
            }
        }
        
        return false;
    }
    
    getInput() {
        // get gamepad and prepare ret
        var state = gamepad; // get state of gamepad id 0
        var ret = {
            "top"    : false,
            "right"  : false,
            "bottom" : false,
            "left"   : false,
            "a"      : false
        };
        
        // up
        if(btn.up || state.btn.up){
            ret.up = true;
        }
        
        // down
        if(btn.down || state.btn.down){
            ret.down = true;
        }
        
        // right
        if(btn.right || state.btn.right){
            ret.right = true;
        }
        
        // left
        if(btn.left || state.btn.left){
            ret.left = true;
        }
        
        // A
        if(btn.A || state.btn.A){
            ret.a = true;
        }
        
        return ret;
        
        // buttons:
        //state.btn.A; // state of A button
        //state.btn.B; // state of B button
        //state.btn.X; // state of X button
        //state.btn.Y; // state of Y button
        //state.btn.start; // state of 'start' button
        //state.btn.back;  // state of 'back' button
        //state.btn.up;    // directionnal pad's up button
        //state.btn.down;  // directionnal pad's down button
        //state.btn.left;  // directionnal pad's left button
        //state.btn.right; // directionnal pad's right button
        //state.btn.lb; // left bumper button
        //state.btn.rb; // right bumper button
        //state.btn.lt; // left trigger button
        //state.btn.rt; // right trigger button

    }
    
}

module.exports = Character;