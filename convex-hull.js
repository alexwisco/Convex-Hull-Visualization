const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_WIDTH = 600;
const SVG_HEIGHT = 400;

// fields
const canvas = document.querySelector("#canvas");
let pointSet = new PointSet(); // for dots
let CHV = new ConvexHullViewer(canvas, pointSet);
let ch = new ConvexHull(pointSet, CHV);
let ready = false; // switch ready flip once ... TODO
let animation_speed = 600; // speed in ns of algorithm steps

// represent a 2d point (x,y).
function Point (x,y,id) {
    this.x = x;
    this.y = y;
    this.id = id; 

    // compareTo function for sorting the point set.
    // (x,y) < (x2, y2) if x < x2 or x == x2 and y < y2
    // function takes a point to compare.
    this.compareTo = function(p)  {
        if (this.x > p.x) {
            return 1;
        }
    
        if (this.x < p.x) {
            return -1;
        }
    
        if (this.y > p.y) {
            return 1;
        }
    
        if (this.y < p.y) {
            return -1;
        }
    
        return 0;
    }

    // return a string representation of this Point
    this.toString = function () {
        return "(" + x + ", " + y + ")";
        }
}

// PointSet, an object representing points on the canvas.
function PointSet() {
    this.points=[]; // store point coords in array
    this.currentPointID = 0; // Provide a unique id for each point 

    // for adding a new point
    this.addNewPoint = function(x,y) {
        this.points.push(new Point(x,y,this.currentPointID));
        this.currentPointID++;
        }

    // for adding an existing point
    this.addPoint = function (p) {
        this.points.push(p);
        }

    // sort the points in this.points 
    this.sort = function () {
        this.points.sort((a,b) => {return a.compareTo(b)});
        }

    // reverse the order of the points in this.points
    this.reverse = function () {
        this.points.reverse();
        }

        // return an array of the x-coordinates of points in this.points
    this.getXCoords = function () {
        let coords = [];
        for (let p of this.points) {
            coords.push(p.x);
        }
            return coords;
        }
    

    // return an array of the y-coordinates of points in this.points
    this.getYCoords = function () {
        let coords = [];
        for (p of this.points) {
            coords.push(p.y);
        }
            return coords;
        }

    // get the number of points 
    this.size = function () {
        return this.points.length;
        }


    // return a string representation of this PointSet
    this.toString = function () {
        let str = '[';
        for (let pt of this.points) {
            str += pt + ', ';
        }
        str = str.slice(0,-2); 	// remove the trailing ', '
        str += ']';
    
        return str;
        }
}

// Where the magic happens - takes the svg canvas element and a point set
function ConvexHullViewer (svg, ps) {
    this.svg = svg; // where the visualization is drawn
    this.ps = ps;

    let rect = svg.getBoundingClientRect();


    let startClick = document.querySelector("#start");
    let stepClick = document.querySelector("#step");
    let animateClick = document.querySelector("#animate");

    startClick.addEventListener('click', startClicked);
    stepClick.addEventListener('click', stepClicked);
    animateClick.addEventListener('click', animateClicked);

    function startClicked() {
        ch.start();
    } // startClicked
    function stepClicked () {
        ch.step();
    } // stepClicked
    function animateClicked () {
        ch.animate();
    } // animateClicked

    // Drawing a dot on a user's mouse click
    svg.addEventListener('click', drawDot);
    function drawDot(e) {
        // if still waiting for ready flag switch
        if (!ready) {
            let x = e.clientX; // adjust for shift
            let y = e.clientY;
            // create circle to be appended
            let circle = document.createElementNS(SVG_NS, "circle"); 
            // grab correct coord on the svg
            circle.setAttribute('cx', x - rect.left); 
            circle.setAttribute('cy', y - rect.top); 
            circle.setAttribute('r', 5);
            circle.setAttribute('fill', 'green');
            circle.classList.add("circle");
            // point added to backend pointset
            ps.addNewPoint(x, y); 
            svg.appendChild(circle); 
            console.log(ps.toString()); // debugging
        }
           
    }

    // auto line drawing between points in the set
    this.drawLine = function(p1,p2) {
        let line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', p1.x-rect.left);
        line.setAttribute('y1', p1.y-rect.top);
        line.setAttribute('x2', p2.x-rect.left);
        line.setAttribute('y2', p2.y-rect.top);
        line.classList.add('line');
        svg.appendChild(line);
    }

    // for visual clarity when running through algorithm,
    // changes the colour of a reviewed linse 
    this.reviewedLine = function(e) {
        e.classList.add('reviewed');
    }

}

// An object representing an instance of the convex hull problem
// takes a point set and a viewer for displaying
function ConvexHull (ps, viewer) {
    this.ps = ps;          
    this.viewer = viewer;  
    let turnedRight = true; // denotes the direction turned is the correct one
    let upper = true; // if on upper side of point set on plane
    let algo_stack = []; // temp stack that deals with the points we are testing 
    let i = 2; // easier for stepping


    // Helper methods for steping through the scan
    // returns the slope of two points 
     function slope(p1, p2) {
        return ((p2.y - p1.y) / (p2.x - p1.x));
    } // slope 

    // boolean returning true if we make a right turn from our latest point in sorted_ps
    function rightTurn (p1, p2, p3) {
        let line01 = slope(p1, p2);
        let line02 = slope(p2, p3);
        return line01 <= line02;
    } // rightTurn 

    // start a visualization performed on ps
    this.start = function () {
        let step = document.getElementById("step");
        let animate = document.getElementById("animate");
        step.removeAttribute("disabled");
        animate.removeAttribute("disabled");
        // lets users click step and animate buttons once we have clicked start 
        document.querySelectorAll('.line').forEach(e => e.remove());
        i = 2;
        upper = true;
        pointsFinalized = true;
        ps.sort();
        algo_stack = [];
        upper = true;
        algo_stack.push(ps.points[0]);
        algo_stack.push(ps.points[1]);
        viewer.drawLine(algo_stack[0], algo_stack[1]);
    } // start 

    // perform a single step of the algorithm performed on ps
    this.step = function () {
    document.querySelectorAll('.reviewed').forEach(e => e.remove());
    if ((i==ps.size()) && !upper){
        let element = document.querySelector("#step");
        element.setAttribute("disabled","");
        return;
    } // if 
    if (i==ps.size()) {
        algo_stack = [];
        ps.reverse();
        algo_stack.push(ps.points[0]);
        algo_stack.push(ps.points[1]);
        viewer.drawLine(algo_stack[0],algo_stack[1]);
        i = 2;
        upper = false;
        return;
    } // if 

    if (algo_stack.length ==1 ) {
        viewer.drawLine(algo_stack[algo_stack.length - 1], ps.points[i]);
        algo_stack.push(ps.points[i]);

    } else {

        turnedRight = rightTurn(algo_stack[algo_stack.length-2], algo_stack[algo_stack.length-1], ps.points[i]);
        let element = viewer.svg.lastElementChild;

        while ((!turnedRight) && algo_stack.length > 1) {
            algo_stack.pop();
            viewer.reviewedLine(element);
            element = element.previousElementSibling;

            if (algo_stack.length == 1) {
                break;
            } 
            turnedRight = rightTurn(algo_stack[algo_stack.length-2], algo_stack[algo_stack.length-1], ps.points[i]);
        } // while 

        viewer.drawLine(algo_stack[algo_stack.length-1], ps.points[i]);
        algo_stack.push(ps.points[i]);
        i++;

    } // else 
    } // step 

    // repeatedly steps
    this.animate = function() {
        setInterval(() => {
            this.step();
        }, animation_speed);
    }


    // Return a new PointSet consisting of the points along the convex
    // hull of ps. This method should **not** perform any
    // visualization. It should **only** return the convex hull of ps
    // represented as a (new) PointSet. Specifically, the elements in
    // the returned PointSet should be the vertices of the convex hull
    // in clockwise order, starting from the left-most point, breaking
    // ties by minimum y-value.
    this.getConvexHull = function () {

	
    } // getConvexHull
    } // ConvexHull
