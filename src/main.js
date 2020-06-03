// all we actually need to do here
import Game from './lib/Game.js';
var story      = require('../assets/story.json');
var elements   = require('../assets/elements.json');
var config     = require('../assets/config.json');
var game       = new Game();
exports.update = game.update;
game.run(story,elements,config);