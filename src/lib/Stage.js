import Extender  from './Extender.js';
import Animation from './Animation.js';
import QuadTree  from './Quadtree.js';
import Box       from './objects/Box.js';

class Stage extends Extender {
    
    constructor() {
        super();
        this.handler           = {};
        this.mapReso           = {};
        this.namedElements     = {};
        this.animations        = {};
        this.elementQuad       = false;
        this.animationQuad     = false;
    }
    
    addHandler(name,func) {
        this.handler[name] = func;
    }
    
    removeHandler(name) {
        delete this.handler[name];
    }
    
    addAnimation(name,data){
        this.animations[name] = data;
    }
    
    getAnimation(name) {
        return this.animations[name];
    }
    
    removeAnimation(name) {
        if('undefined' !== this.animations[name]) {
            delete this.animations[name];
        }
    }
    
    addNamedElement(name,data){
        this.namedElements[name] = data;
    }
    
    getNamedElement(name) {
        return this.namedElements[name];
    }
    
    removeNamedElement(name) {
        if('undefined' !== this.namedElements[name]) {
            delete this.namedElements[name];
        }
    }
    
    getHandler(name) {
        return this.handler[name];
    }
    
    getAllHandler() {
        return this.handler;
    }
    
    setPaper(paper) {
        this.paper = paper;
    }
    
    getPaper() {
        return this.paper;
    }
    
    setCam(x,y) {
        this.camX = x;
        this.camY = y;
    }
    
    getCam() {
        return {
            "x" : this.camX,
            "y" : this.camY
        };
    }
    
    setID(id) {
        this.id = id;
    }
    
    getID() {
        return this.id;
    }
    
    getMap() {
        return this.map;
    }
    
    setElements(elements) {
        this.elements = elements;
    }
    
    getElements() {
        return this.elements;
    }
    
    init(id,data) {
        // little info
        super.get("log").info("creating stage " + id);

        // get the game config
        var config = super.get("storage").get("game.config")

        // init everything .>
        this.setPaper(data.paper);
        this.setElements(data.elements);
        this.setCam(data.camera.x, data.camera.y);
        this.setMapReso(data.mapReso);
        this.elementQuad    = new QuadTree(new Box(0, 0, data.mapReso.x * config.tileWidth, data.mapReso.y * config.tileWidth));
        this.animationQuad  = new QuadTree(new Box(0, 0, data.mapReso.x * config.tileWidth, data.mapReso.y * config.tileWidth));
        this.populateLookupQuads();
        
        // fire custom code initer
        super.get("log").info("running stage initer");
        window.app.handler.stages[data.provider].init();
    }
    
    setMapReso(mapReso) {
        this.mapReso = mapReso;
    }
    
    getMapReso() {
        return this.mapReso;
    }
    
    getAnimationIndex() {
        return this.animationIndex;
    }
    
    populateLookupQuads() {
        // temporary retrieve all game elements to faster pick
        // the stage elements and config for configs...
        var totalElements = super.get("storage").get("game.elements");
        var config        = super.get("storage").get("game.config");
        
        // we iterate through all elements of
        // this stage
        for(var i in this.elements) {
            var stageElement = this.elements[i];
            
            // lets retrieve the fitting element from game.element storage
            var elementTemplate = totalElements[stageElement.element];
            
            // first we check if it is a "named" element. those can be easily
            // accessedlater on due to a easy access index we create on init
            var uuid = false;
            if('undefined' !== typeof stageElement.name) {
                uuid = super.get('util').uuidv4();
                this.addNamedElement(stageElement.name,uuid);
            }
            
            // check if is animated
            var animated = false;
            if('undefined' !== typeof stageElement.animation) {
                animated = true;
            }

            // ok now we iterate through all the subElements
            for(var y in elementTemplate.elements) {
                var subEl = elementTemplate.elements[y];
                
                // prepare data payload for Quad
                var data = {
                    "element"       : stageElement.element,
                    "name"          : stageElement.name,
                    "subElIndex"    : y, 
                    "x"             : stageElement.x + subEl.x,
                    "y"             : stageElement.y + subEl.y,
                    "tileID"        : subEl.tileID,
                    "tileSheet"     : subEl.tileSheet,
                    "block"         : stageElement.block,
                    "handler"       : false,
                    "uuid"          : false,
                };
                
                // add handler if given
                if("undefined" !== stageElement.handler) {
                    data.handler = stageElement.handler;
                }
                
                // add animation uuid if tis an animation
                if(uuid) {
                    data.uuid = uuid;
                }
                
                // insert the element into the element quad
                var el = new Box(
                    data.x,
                    data.y,
                    config.tileWidth,
                    config.tileWidth,
                    data
                );
                this.elementQuad.insert(el);
            }
            
            // if its an animation we need further handling
            // additionally checking for 'named' to make sure
            // we got a name, mayber add any kind of error handling
            // for no given name ### todo
            if(animated && uuid) {
                // ok we create an animation
                var animation = new Animation(
                    stageElement,
                    uuid
                );

                // push the new animation into animation storage 
                this.addAnimation(
                    stageElement.name,
                    animation
                );

                // and we push the bounding coordinates of the animation
                // into our animation quad to have a faster lookup
                // possibility for our animations later
                var animationBounding = animation.getBoundingPoints();
                var boundingBox       = new Box(
                    animationBounding.x,
                    animationBounding.y,
                    animationBounding.w,
                    animationBounding.h,
                    {
                        "name" : stageElement.name,
                        "uuid" : uuid
                    }
                );
                this.animationQuad.insert(boundingBox);
            }
            
        }
        
    }
    
    reinit() {
        
    }
    
    update() {
        var updates = this.handleAnimations();
        var handler = this.getAllHandler();
        //if(handler.length > 0) {
            for(var i in handler) {
                handler[i]();
            }
        //}
    }
    
    handleAnimations(){
        var updates = [];
        // if we got any animations we iterate through them
        if(this.animations) {
            // some preperations
            var cam       = this.getCam();
            var config    = super.get("storage").get("game.config");
            var minX      = Math.max(0,cam.x - config.tileWidth); // ### todo maybe remove "- config.tilewidth" later
            var minY      = Math.max(0,cam.y - config.tileWidth); // ### todo maybe remove "- config.tilewidth" later
            var screenPxX = config.screen.x * config.tileWidth;
            var screenPxY = config.screen.y * config.tileWidth;

            // we get all animations from our animation quad index
            var screenBox = new Box(
                minX,
                minY,
                screenPxX,
                screenPxY
            );
            var animations = this.animationQuad.query(screenBox);

            for(var i in animations) {
                var anim = this.getAnimation(animations[i].data.name);

                // if the animation is active
                if(anim.isActive()) {
                    var animPosition = anim.calculatePosition();
                    var inViewport = super.get("util").aabbCollision(
                        {
                            "x" : cam.x,
                            "y" : cam.y,
                            "w" : screenPxX,
                            "h" : screenPxY
                        },
                        {
                            "x" : animPosition.x,
                            "y" : animPosition.y,
                            "w" : anim.getWidth(),
                            "h" : anim.getHeight()
                        }
                    ); 
                    //console.log({
                    //    "x" : cam.x,
                    //    "y" : cam.y,
                    //    "w" : screenPxX,
                    //    "h" : screenPxY
                    //},
                   // {
                    //    "x" : animPosition.x,
                    //    "y" : animPosition.y,
                    //    "w" : anim.getWidth(),
                    //    "h" : anim.getHeight()
                    //});

                    // if it collides the animation is in viewport so we fire up the update function
                    if(inViewport){
                        updates.push(anim.update(animPosition));
                    }
                }
            }
        }
        return updates;
    }

}

module.exports = Stage;