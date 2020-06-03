import Box from    './objects/Box.js';
import Point from  './objects/Box.js';
import Circle from './objects/Box.js';


const defaultConfig = {
    capacity: 10000,
    removeEmptyNodes: false,
    maximumDepth: 1000,
    arePointsEqual: (point1, point2) => point1.data.uuid === point2.data.uuid
//    arePointsEqual: (point1, point2) => point1.x === point2.x && point1.y === point2.y
};
/**
 * QuadTree class.
 * @class QuadTree
 */
class QuadTree {
    /**
     * Create a new QuadTree
     * @constructor
     * @param {Box} container - The box on which the QuadTree will operate.
     * @param {Object} [config] - The configuration of the quadtree.
     * @param {number} [config.capacity] - The maximum amount of points per node.
     * @param {boolean} [config.removeEmptyNodes] - Specify if the quadtree has to remove subnodes if they are empty.
     * @param {number} [config.maximumDepth] - Specify the maximum depth of the tree.
     * @param {function} [config.arePointsEqual] - Specify a custom method to compare point for removal.
     * @param {(Object[]|Point[])} [points] - An array of initial points to insert in the QuadTree.
     * @param {number} points[].x - X coordinate of the point.
     * @param {number} points[].y - Y coordinate of the point.
     */
    constructor(container, config, points = []) {
        this.container = container;
        this.config = Object.assign({}, defaultConfig, config);
        this.isDivided = false;
        this.points = [];
        for (const point of points) {
            this.insertRecursive(point);
        }
    }
    /**
     * Return a tree representation of the QuadTree
     * @returns {{se: *, sw: *, ne: *, nw: *}|Number} - A tree representation of the QuadTree
     */
    getTree() {
        let tree;
        if (this.isDivided) {
            tree = {
                ne: this.ne.getTree(),
                nw: this.nw.getTree(),
                se: this.se.getTree(),
                sw: this.sw.getTree()
            };
        }
        else {
            tree = this.getNodePointAmount();
        }
        return tree;
    }
    /**
     * Get all the points in the QuadTree
     * @returns {(Object[]|Point[])} - An array containing all the points.
     */
    getAllPoints() {
        const pointsList = [];
        this.getAllPointsRecursive(pointsList);
        return pointsList;
    }
    /**
     * Get all the points in the QuadTree
     * @param {(Object[]|Point[])} pointsList
     * @private
     */
    getAllPointsRecursive(pointsList) {
        if (!this.isDivided) {
            Array.prototype.push.apply(pointsList, this.points.slice());
            return;
        }
        this.ne.getAllPointsRecursive(pointsList);
        this.nw.getAllPointsRecursive(pointsList);
        this.se.getAllPointsRecursive(pointsList);
        this.sw.getAllPointsRecursive(pointsList);
    }
    /**
     * Return the amount of points in this node.
     * @returns {number} - The amount of points in this node.
     * @private
     */
    getNodePointAmount() {
        return this.points.length;
    }
    /**
     * Divide this node into 4 sub-nodes
     * @private
     */
    divide() {
        const childMaximumDepth = this.config.maximumDepth === -1 ? -1 : this.config.maximumDepth - 1;
        const childConfig = Object.assign({}, this.config, { maximumDepth: childMaximumDepth });
        this.isDivided = true;
        const x = this.container.x;
        const y = this.container.y;
        const w = this.container.w / 2;
        const h = this.container.h / 2;
        // Creation of the sub-nodes, and insertion of the current point
        this.ne = new QuadTree(new Box(x + w, y, w, h), childConfig, this.points.slice());
        this.nw = new QuadTree(new Box(x, y, w, h), childConfig, this.points.slice());
        this.se = new QuadTree(new Box(x + w, y + h, w, h), childConfig, this.points.slice());
        this.sw = new QuadTree(new Box(x, y + h, w, h), childConfig, this.points.slice());
        // We empty this node points
        this.points.length = 0;
        this.points = [];
    }
    /**
     * Remove a point in the QuadTree
     * @param {(Point|Object|Point[]|Object[])} pointOrArray - A point or an array of points to remove
     * @param {number} pointOrArray.x - X coordinate of the point
     * @param {number} pointOrArray.y - Y coordinate of the point
     */
    remove(pointOrArray) {
        if (Array.isArray(pointOrArray)) {
            for (const point of pointOrArray) {
                this.removeRecursive(point);
            }
        }
        else {
            this.removeRecursive(pointOrArray);
        }
    }
    /**
     * Remove a point in the QuadTree
     * @param {(Point|Object)} point - A point to remove
     * @param {number} point.x - X coordinate of the point
     * @param {number} point.y - Y coordinate of the point
     * @private
     */
    removeRecursive(point) {
        if (!this.container.contains(point)) {
            return;
        }
        if (!this.isDivided) {
            const len = this.points.length;
            for (let i = len - 1; i >= 0; i--) {
                if (this.config.arePointsEqual(point, this.points[i])) {
                    this.points.splice(i, 1);
                }
            }
            return;
        }
        this.ne.removeRecursive(point);
        this.nw.removeRecursive(point);
        this.se.removeRecursive(point);
        this.sw.removeRecursive(point);
        if (this.config.removeEmptyNodes) {
            if (this.ne.getNodePointAmount() === 0 && !this.ne.isDivided &&
                this.nw.getNodePointAmount() === 0 && !this.nw.isDivided &&
                this.se.getNodePointAmount() === 0 && !this.se.isDivided &&
                this.sw.getNodePointAmount() === 0 && !this.sw.isDivided) {
                this.isDivided = false;
                delete this.ne;
                delete this.nw;
                delete this.se;
                delete this.sw;
            }
        }
    }
    /**
     * Insert a point in the QuadTree
     * @param {(Point|Object|Point[]|Object[])} pointOrArray - A point or an array of points to insert
     * @param {number} pointOrArray.x - X coordinate of the point
     * @param {number} pointOrArray.y - Y coordinate of the point
     */
    insert(pointOrArray) {
        if (Array.isArray(pointOrArray)) {
            for (const point of pointOrArray) {
                this.insertRecursive(point);
            }
        }
        else {
            this.insertRecursive(pointOrArray);
        }
    }
    /**
     * Insert a point in the QuadTree
     * @param {(Point|Object)} point - A point to insert
     * @param {number} point.x - X coordinate of the point
     * @param {number} point.y - Y coordinate of the point
     * @returns {boolean}
     * @private
     */
    insertRecursive(point) {
        if (!this.container.contains(point)) {
            return false;
        }
        if (!this.isDivided) {
            if (this.getNodePointAmount() < this.config.capacity || this.config.maximumDepth === 0) {
                this.points.push(point);
                return true;
            }
            else if (this.config.maximumDepth === -1 || this.config.maximumDepth > 0) {
                this.divide();
            }
        }
        if (this.isDivided) {
            if (this.ne.insertRecursive(point))
                return true;
            if (this.nw.insertRecursive(point))
                return true;
            if (this.se.insertRecursive(point))
                return true;
            return this.sw.insertRecursive(point);
        }
        else {
            return false;
        }
    }
    /**
     * Query all the point within a range
     * @param {Shape} range - The range to test
     * @returns {(Point[]|Object[])} - The points within the range
     */
    query(range) {
        const pointsFound = [];
        this.queryRecursive(range, pointsFound);
        return pointsFound;
    }
    /**
     * @param {Shape} range
     * @param {(Point[]|Object[])} pointsFound
     * @returns {(Point[]|Object[])}
     * @private
     */
    queryRecursive(range, pointsFound) {
        if (range.intersects(this.container)) {
            if (this.isDivided) {
                this.ne.queryRecursive(range, pointsFound);
                this.nw.queryRecursive(range, pointsFound);
                this.se.queryRecursive(range, pointsFound);
                this.sw.queryRecursive(range, pointsFound);
            }
            else {
                const p = this.points.filter((point) => range.contains(point));
                Array.prototype.push.apply(pointsFound, p);
            }
        }
    }
    /**
     * Clear the QuadTree
     */
    clear() {
        this.points = [];
        this.isDivided = false;
        delete this.ne;
        delete this.nw;
        delete this.se;
        delete this.sw;
    }
}
 
module.exports = QuadTree;