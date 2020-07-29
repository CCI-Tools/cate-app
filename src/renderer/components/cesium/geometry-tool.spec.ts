import Cesium from "cesium";
import { expect } from 'chai';
import {
    BoxTool,
    NO_TOOL,
    PointTool,
    polygonColor,
    PolygonTool,
    polylineColor,
    PolylineTool,
    ToolContextBase
} from './geometry-tool';



class TestToolContext extends ToolContextBase {
    entities: any[];
    toolEntities: any[];

    constructor() {
        super();
        this.entities = [];
        this.toolEntities = [];
    }

    newEntity(entity: Cesium.Entity): void {
        this.entities.push(entity);
    }

    addToolEntity(entity: Cesium.Entity): void {
        this.toolEntities.push(entity);
    }

    removeAllToolEntities(): void {
        this.toolEntities = [];
    }

    pickEllipsoid(cartesian: Cesium.Cartesian2): Cesium.Cartesian3 | undefined {
        return new Cesium.Cartesian3(cartesian.x, cartesian.y, 0);
    }

    cartesianWithHeightDelta(cartesian: Cesium.Cartesian3, height: number): Cesium.Cartesian3 {
        return new Cesium.Cartesian3(cartesian.x, cartesian.y, height);
    }

    cartesianToCartographic(cartesian: Cesium.Cartesian3): Cesium.Cartographic {
        return new Cesium.Cartographic(cartesian.x, cartesian.y, cartesian.z);
    }

    cartographicToCartesian(cartographic: Cesium.Cartographic): Cesium.Cartesian3 {
        return new Cesium.Cartesian3(cartographic.longitude, cartographic.latitude, cartographic.height);
    }
}


describe('GeometryTool', function () {
    it('NoTool', function () {
        const toolContext = new TestToolContext();
        expect(toolContext.tool).to.equal(NO_TOOL);

        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 12, /*latitude::*/ 9)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 12)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 13, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 18, /*latitude::*/ 0)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 20, /*latitude::*/ 15)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 13, /*latitude::*/ 11)});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities).to.deep.equal([]);
    });

    it('PointTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new PointTool();

        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 12, /*latitude::*/ 9)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 12)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 13, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 18, /*latitude::*/ 0)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 20, /*latitude::*/ 15)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 13, /*latitude::*/ 11)});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities).to.deep.equal([
                                                       {
                                                           position: new Cesium.Cartesian3(/*longitude:*/ 10, /*latitude::*/ 12, /*height:*/ 0),
                                                           point: {
                                                               outlineWidth: 1,
                                                               pixelSize: 6,
                                                           }
                                                       },
                                                       {
                                                           position: new Cesium.Cartesian3(/*longitude:*/ 20, /*latitude::*/ 15, /*height:*/ 0),
                                                           point: {
                                                               outlineWidth: 1,
                                                               pixelSize: 6,
                                                           }
                                                       }]);

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

    it('PolylineTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new PolylineTool();

        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 12, /*latitude::*/ 9)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 10)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 13, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 18, /*latitude::*/ 0)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 20, /*latitude::*/ 10)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 21, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 19, /*latitude::*/ 15)});
        // Note, we simulate here a browser sensing two(!) left click events before a double-click event.
        // See also https://github.com/AnalyticalGraphicsInc/cesium/issues/1171
        let endPoint = {position: new Cesium.Cartesian2(/*longitude:*/ 20, /*latitude::*/ 20)};
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftDoubleClick(endPoint);
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 46, /*latitude::*/ 26)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 49, /*latitude::*/ 32)});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities.length).to.equal(1);
        const entity = toolContext.entities[0];
        expect(entity.polyline).to.exist;
        expect(entity.polyline.positions).to.exist;
        expect(entity.polyline.positions.length).to.equal(3);
        expect(entity).to.deep.equal(
            {
                polyline: {
                    positions: [
                        new Cesium.Cartesian3(/*longitude:*/ 10, /*latitude::*/ 10, /*height:*/ 5),
                        new Cesium.Cartesian3(/*longitude:*/ 20, /*latitude::*/ 10, /*height:*/ 5),
                        new Cesium.Cartesian3(/*longitude:*/ 20, /*latitude::*/ 20, /*height:*/ 5)
                    ],
                    material: polylineColor
                }
            }
        );

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

    it('PolygonTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new PolygonTool();

        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 12, /*latitude::*/ 9)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 10)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 13, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 18, /*latitude::*/ 0)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 20, /*latitude::*/ 10)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 21, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 19, /*latitude::*/ 15)});
        // Note, we simulate here a browser sensing two(!) left click events before a double-click event.
        // See also https://github.com/AnalyticalGraphicsInc/cesium/issues/1171
        let endPoint = {position: new Cesium.Cartesian2(/*longitude:*/ 20, /*latitude::*/ 20)};
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftDoubleClick(endPoint);
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 46, /*latitude::*/ 26)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 49, /*latitude::*/ 32)});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities.length).to.equal(1);
        const entity = toolContext.entities[0];
        expect(entity.polygon).to.exist;
        expect(entity.polygon.hierarchy).to.exist;
        expect(entity.polygon.hierarchy.length).to.equal(3);
        expect(entity).to.deep.equal(
            {
                polygon: {
                    hierarchy: [
                        new Cesium.Cartesian3(/*longitude:*/ 10, /*latitude::*/ 10, /*height:*/ 0),
                        new Cesium.Cartesian3(/*longitude:*/ 20, /*latitude::*/ 10, /*height:*/ 0),
                        new Cesium.Cartesian3(/*longitude:*/ 20, /*latitude::*/ 20, /*height:*/ 0)
                    ],
                    material: polygonColor
                }
            }
        );

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

    it('BoxTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new BoxTool();

        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 11)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 12, /*latitude::*/ 16)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 10, /*latitude::*/ 20)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 13, /*latitude::*/ 28)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 28, /*latitude::*/ 32)});
        toolContext.onLeftClick({position: new Cesium.Cartesian2(/*longitude:*/ 30, /*latitude::*/ 40)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 31, /*latitude::*/ 41)});
        toolContext.onMouseMove({endPosition: new Cesium.Cartesian2(/*longitude:*/ 39, /*latitude::*/ 35)});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities.length).to.equal(1);
        const entity = toolContext.entities[0];
        expect(entity.polygon).to.exist;
        expect(entity.polygon.hierarchy).to.exist;
        expect(entity.polygon.hierarchy.length).to.equal(4);
        expect(entity).to.deep.equal(
            {
                polygon: {
                    hierarchy: [
                        new Cesium.Cartesian3(/*longitude:*/ 10, /*latitude::*/ 20, /*height:*/ 0),
                        new Cesium.Cartesian3(/*longitude:*/ 30, /*latitude::*/ 20, /*height:*/ 0),
                        new Cesium.Cartesian3(/*longitude:*/ 30, /*latitude::*/ 40, /*height:*/ 0),
                        new Cesium.Cartesian3(/*longitude:*/ 10, /*latitude::*/ 40, /*height:*/ 0),
                    ],
                    material: polygonColor
                }
            }
        );

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

});
