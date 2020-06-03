import Extender from './Extender.js';
import Point    from './objects/Point.js';
import Box      from './objects/Box.js';

class Animation extends Extender {
    
    constructor(element,animationUUID) {
        super();
        this.element         = element;
        this.elementType     = element.element;
        this.elementTemplate = super.get("storage").get("game.elements." + this.elementType);
        this.path            = element.animation.path;
        this.loop            = element.loop;
        this.duration        = this.path[this.path.length - 1][0];
        this.pathSteps       = this.path.length;
        this.animationUUID   = animationUUID;
        this.active          = true;
        this.calculateSize();
        this.calculateBoundingPoints();
    }

    getUUID(){
        return this.animationUUID;
    }
    
    calculateBoundingPoints() {
        var rightBounding  = false;
        var leftBounding   = false;
        var topBounding    = false;
        var bottomBounding = false;
        var elWidth        = this.getWidth();
        var elHeight       = this.getHeight();

        for(var i in this.path) {
            var pathPoint = this.path[i];

            // get min X aka left
            if(false == leftBounding || pathPoint[1]  < leftBounding) {
                leftBounding = pathPoint[1];
            }
            
            // get max X aka right
            if(false == rightBounding || pathPoint[1] + elWidth  > rightBounding) {
                rightBounding = pathPoint[1] + elWidth ;
            }
            
            // get min Y aka top
            if(false == topBounding || pathPoint[2]  < topBounding) {
                topBounding = pathPoint[2];
            }
            
            // get max Y aka bottom
            if(false == bottomBounding || pathPoint[2] + elHeight  > bottomBounding) {
                bottomBounding = pathPoint[2] + elHeight ;
            }
            
        }

        
        this.boundingPoints = {
            "x" : topBounding    + this.element.x,
            "y" : leftBounding   + this.element.y,
            "w" : rightBounding  - leftBounding,
            "h" : bottomBounding - topBounding
        };        
    }
    
    getBoundingPoints() {
        return this.boundingPoints;
    }
    
    calculateSize() {
        var config          = super.get("storage").get("game.config");
        
        var width  = 0;
        var height = 0; 
        console.log(this.elementTemplate);
        for(var i in this.elementTemplate.elements) {
            var tmpEl = this.elementTemplate.elements[i];
            if(tmpEl.x > width) {
                width  = tmpEl.x;
            }
            if(tmpEl.y > height) {
                height = tmpEl.y;
            }
        }
        
        this.setWidth(width + config.tileWidth);
        this.setHeight(height + config.tileWidth);
    }
    
    setWidth(width) {
        this.width = width;
    }
    
    getWidth() {
        return this.width;
    }
    
    setHeight(height) {
        this.height = height;
    }
    
    getHeight() {
        return this.height;
    }

    calculatePosition() {
        // some predefintion
        var config   = super.get("storage").get("game.config");
        var start    = super.get("storage").get("game.startTime");
        var currTime = super.get("game").getTimestamp();
        var timeDiff = currTime - start;
        var alpha    = false;
        var beta     = false;
        var duration = false;
        var ret      = {};
        
        // get the remainder, this tells us how weep we are 
        // into the animation at this point
        var remainder = Math.floor(timeDiff % (this.duration * 1000));
        //console.log("remainder",remainder);

        // for each coords in part
        for(var i in this.path) {
            // while we might not reach the last element 
            if(i < this.path.length - 1) {

                // if remainder is in range of duration i and i+1, we might take this
                // elements to calculate the position
                if(remainder >= this.path[i][0] * 1000 && remainder <= this.path[parseInt(i) + 1][0] * 1000) {
                    // store the elements
                    alpha    = this.path[i];
                    beta     = this.path[parseInt(i) + 1];

                    // and calc the path parts duration by substracti alpha (starttime) from beta(endtime)
                    duration = (beta[0] - alpha[0]) * 1000;
                    //console.log(alpha,beta,duration);
                    //console.log(i);
                    break;
                }
            }
        }
        
        // how deep are we into the current step
        var subPathTimePosition = (remainder - alpha[0] * 1000) * config.tickRate;
        var xStepLength         = Math.abs(beta[1] - alpha[1]) / (duration / 1000 * config.tickRate);
        var yStepLength         = Math.abs(beta[2] - alpha[2]) / (duration / 1000 * config.tickRate);
        //console.log(subPathTimePosition,xStepLength,yStepLength);
        

        // to calculate shift for X axis we need to dispatch directions
        if(beta[1] > alpha[1]) {
            var xPos  = alpha[1] + (subPathTimePosition / 1000 * xStepLength);
        } else if(beta[1] < alpha[1]) {
            var xPos  = alpha[1] +  ~(subPathTimePosition / 1000 * xStepLength);
        } else {
            var xPos  = alpha[1];
        }

        // to calculate shift for Y axis we need to dispatch directions
        if(beta[2] > alpha[2]) {
            var yPos  = alpha[2] + subPathTimePosition / 1000 * yStepLength;
        } else if(beta[2] < alpha[2]){
            var yPos  = alpha[2] + ~(subPathTimePosition / 1000 * yStepLength);
        } else {
            yPos      = alpha[2];
        }

       // console.log(xPos,yPos);
        //console.log(subPathTimePosition,yStepLength);
        return {
            "x" : xPos + this.element.x,
            "y" : yPos + this.element.y
        };
    }

    enableAnimation() {
        this.active = true;
    }

    disableAnimation() {
        this.active = false;
    }

    isActive() {
        return this.active;
    }
    
    update(currentPosition) {
        //console.log("update animation",currentPosition);
        var config = super.get("storage").get("config");
        // first we check if we need to calculate the current position
        if ("undefined" === typeof currentPosition) {
            var currentPosition = this.calculatePosition();
        }

        // now we gonne delete the elements from elementQuad
        var stage = super.get("game").getActiveStage();
        stage.elementQuad.remove(
            new Point(1,1,{
                "uuid" : this.getUUID()
            })
        )

        // and insert thew new ones to the correct positions
        for(var i in this.elementTemplate.elements) {
            var subEl = this.elementTemplate.elements[i];

            var data = {
                "element"       : this.element.element,
                "name"          : this.element.name,
                "subElIndex"    : i, 
                "x"             : currentPosition.x + subEl.x,
                "y"             : currentPosition.y + subEl.y,
                "tileID"        : subEl.tileID,
                "tileSheet"     : subEl.tileSheet,
                "block"         : this.element.block,
                "handler"       : false,
                "uuid"          : this.getUUID(),
            };
            
            // add handler if given
            if("undefined" !== this.element.handler) {
                data.handler = this.element.handler;
            }
            
            // insert the element into the element quad
            var el = new Box(
                data.x,
                data.y,
                config.tileWidth,
                config.tileWidth,
                data
            );

            stage.elementQuad.insert(
                el
            );
        }

        return this.getUUID();

    }

}

module.exports = Animation;