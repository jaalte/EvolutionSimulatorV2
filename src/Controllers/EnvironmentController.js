const CanvasController = require("./CanvasController");
const Organism = require('../Organism/Organism');
const Modes = require("./ControlModes");
const CellStates = require("../Organism/Cell/CellStates");
const Neighbors = require("../Grid/Neighbors");
const FossilRecord = require("../Stats/FossilRecord");
const Hyperparams = require("../Hyperparameters");

class EnvironmentController extends CanvasController {
    constructor(env, canvas) {
        super(env, canvas);
        this.mode = Modes.Drag;
        this.org_to_clone = null;
        this.add_new_species = false;

        this.zoomLevel = 1;
        this.focusPos = [screen.width/2, screen.height/2]
        this.cornerOffset = [
            // screen width
            parseInt($('#env-canvas').css('left'))/2,
            parseInt($('#env-canvas').css('top'))/2

        ]
        this.targetPos = [];

        this.defineZoomControls();
    }


    // TODO: implement smooth zoom with a zoom acceleration value



    defineZoomControls() {
        let currentScale = 1;
        var zoom_speed = 0.1;
        const el = document.querySelector('#env');
        el.onwheel = function zoom(event) {
            event.preventDefault();

            var sign = -Math.sign(event.deltaY);

            // Restrict scale
            currentScale = Math.max(0.5, currentScale + (sign * zoom_speed));

            if (currentScale != 0.5) {
                var cur_top = parseInt($('#env-canvas').css('top'));
                var cur_left = parseInt($('#env-canvas').css('left'));
                if (sign == 1) {
                    // If we're zooming in, zoom towards wherever the mouse is
                    var diff_x = ((this.canvas.width / 2 - cur_left / currentScale) - this.mouse_x) * currentScale / 1.5;
                    var diff_y = ((this.canvas.height / 2 - cur_top / currentScale) - this.mouse_y) * currentScale / 1.5;
                } else {
                    // If we're zooming out, zoom out towards the center
                    var diff_x = -cur_left / currentScale;
                    var diff_y = -cur_top / currentScale;
                }
                $('#env-canvas').css('top', (cur_top + diff_y) + 'px');
                $('#env-canvas').css('left', (cur_left + diff_x) + 'px');
            }

            // Apply scale transform
            el.style.transform = `scale(${currentScale})`;
            currentScale = currentScale;


            //this.setZoom(zoomFactor)




        }.bind(this);
    }

    moveCanvasCenterTo([x,y]) {
        
        let size = [
            parseInt($('#env-canvas').css('width')),
            parseInt($('#env-canvas').css('height'))
        ]

        let centerOffset = [size[0]/2,size[1]/2]

        let newCornerCoords = [x-centerOffset[0],y-centerOffset[1]]

        $('#env-canvas').css('left', (newCornerCoords[0]) + 'px');
        $('#env-canvas').css('top', (newCornerCoords[1]) + 'px');

    }

    setZoom(new_x,new_y) {

    
        // zoomfactor > 1 should be zoom in, and <1 be zoom out 

        this.canvas.width
        this.canvas.height

        let canvasCenter = [this.canvas.width/2,this.canvas.height/2]


        this.viewportCenterLocation = [x,y] // position ON ENTIRE WEBPAGE, should always be in center of visible area, TICONSIDERATION HOW MUCH SPACE THE MENU TAKES UP
        this.zoomTarget = [x,y]// position on env-canvas that the center of the viewport will be at after multiple ticks


        let zoomInLimit = 0.5


        let top = parseInt($('#env-canvas').css('top'))
        let left = parseInt($('#env-canvas').css('left'))

        oldFocus = this.focusPos
        newFocus = [new_x,new_y]

        



        var zoom_speed = 0.1;


        const el = document.querySelector('#env');
        el.onwheel = function zoom(event) {
            event.preventDefault();

            var sign = -Math.sign(event.deltaY);

            if (this.zoomLevel != 0.5) {
                var cur_top = parseInt($('#env-canvas').css('top'));
                var cur_left = parseInt($('#env-canvas').css('left'));
                if (sign == 1) {
                    // If we're zooming in, zoom towards wherever the mouse is
                    var diff_x = this.canvas.width / 2 - cur_left
                    var diff_y = this.canvas.height / 2 - cur_top
                } else {
                    // If we're zooming out, zoom out towards the center
                    var diff_x = -cur_left / this.zoomLevel;
                    var diff_y = -cur_top / this.zoomLevel;
                }
                $('#env-canvas').css('top', (cur_top + diff_y) + 'px');
                $('#env-canvas').css('left', (cur_left + diff_x) + 'px');
            }

            // Apply scale transform
            el.style.transform = `scale(${this.zoomLevel})`;
            

            // Moving env

            // math to calculate new position from current and mouse position

            // Adjusting to move to mouse position


            // Zoom limits
            // only allow zoom levels where the nearest neighbor scaling will be equal for all pixels
            // those are the landmarks it looks for
            // i can weight it later


            if (true) {

            }

        } // End of scrollwheel event
    }


    resetView() {
        $('#env-canvas').css('transform', 'scale(1)');
        $('#env-canvas').css('top', '0px');
        $('#env-canvas').css('left', '0px');
        this.zoomLevel = 1;
    }

    updateMouseLocation(offsetX, offsetY) {

        super.updateMouseLocation(offsetX, offsetY);
    }

    mouseMove() {
        this.performModeAction();
    }

    mouseDown() {
        this.start_x = this.mouse_x;
        this.start_y = this.mouse_y;
        this.performModeAction();
    }

    mouseUp() {

    }

    performModeAction() {
        if (Hyperparams.headless)
            return;
        var mode = this.mode;
        var right_click = this.right_click;
        var left_click = this.left_click;
        var middle_click = this.middle_click;
        if (mode != Modes.None && (right_click || left_click || middle_click)) {
            var cell = this.cur_cell;
            if (cell == null) {
                return;
            }
            switch (mode) {
                case Modes.FoodDrop:
                    if (left_click) {
                        this.dropCellType(cell.col, cell.row, CellStates.food, false);
                    } else if (right_click) {
                        this.dropCellType(cell.col, cell.row, CellStates.empty, false);
                    } else if (middle_click) {
                        this.dragEnvironment()
                    }
                    break;
                case Modes.WallDrop:
                    if (left_click) {
                        this.dropCellType(cell.col, cell.row, CellStates.wall, true);

                    } else if (right_click) {
                        this.dropCellType(cell.col, cell.row, CellStates.empty, false);
                    } else if (middle_click) {
                        this.dragEnvironment()
                    }
                    break;
                case Modes.ClickKill:

                    if (left_click) {
                        this.killNearOrganisms();
                    } else if (middle_click) {
                        this.dragEnvironment()
                    }
                    break;

                case Modes.Select:
                    if (left_click) {
                        if (this.cur_org == null) {
                            this.cur_org = this.findNearOrganism();
                        }
                        if (this.cur_org != null) {
                            this.control_panel.setEditorOrganism(this.cur_org);
                        }
                    } else if (middle_click) {
                        this.dragEnvironment()
                    }
                    break;
                case Modes.Clone:
                    if (left_click) {
                        if (this.org_to_clone != null) {
                            var new_org = new Organism(this.mouse_c, this.mouse_r, this.env, this.org_to_clone);
                            if (this.add_new_species) {
                                FossilRecord.addSpeciesObj(new_org.species);
                                new_org.species.start_tick = this.env.total_ticks;
                                this.add_new_species = false;
                                new_org.species.population = 0;
                            } else if (this.org_to_clone.species.extinct) {
                                FossilRecord.resurrect(this.org_to_clone.species);
                            }

                            if (new_org.isClear(this.mouse_c, this.mouse_r)) {
                                this.env.addOrganism(new_org);
                                new_org.species.addPop();
                            }
                        }
                    } else if (middle_click) {
                        this.dragEnvironment()
                    }
                    break;
                case Modes.Drag:
                    this.dragEnvironment()
            }
        }
    }

    dragEnvironment() {
        var cur_top = parseInt($('#env-canvas').css('top'), 10);
        var cur_left = parseInt($('#env-canvas').css('left'), 10);
        var new_top = cur_top + ((this.mouse_y - this.start_y) * this.zoomLevel);
        var new_left = cur_left + ((this.mouse_x - this.start_x) * this.zoomLevel);
        $('#env-canvas').css('top', new_top + 'px');
        $('#env-canvas').css('left', new_left + 'px');
    }

    dropCellType(col, row, state, killBlocking = false) {
        for (var loc of Neighbors.allSelf) {
            var c = col + loc[0];
            var r = row + loc[1];
            var cell = this.env.grid_map.cellAt(c, r);
            if (cell == null)
                continue;
            if (killBlocking && cell.owner != null) {
                cell.owner.die();
            } else if (cell.owner != null) {
                continue;
            }
            this.env.changeCell(c, r, state, null);
        }
    }

    findNearOrganism() {
        for (var loc of Neighbors.all) {
            var c = this.cur_cell.col + loc[0];
            var r = this.cur_cell.row + loc[1];
            var cell = this.env.grid_map.cellAt(c, r);
            if (cell != null && cell.owner != null)
                return cell.owner;
        }
        return null;
    }

    killNearOrganisms() {
        for (var loc of Neighbors.allSelf) {
            var c = this.cur_cell.col + loc[0];
            var r = this.cur_cell.row + loc[1];
            var cell = this.env.grid_map.cellAt(c, r);
            if (cell != null && cell.owner != null)
                cell.owner.die();
        }
    }


}

module.exports = EnvironmentController;