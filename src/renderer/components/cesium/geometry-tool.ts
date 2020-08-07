import * as Cesium from 'cesium'
import { isDefined } from '../../../common/types';


export const pointHeight = 10;
export const polylineHeight = 5;
export const polygonHeight = 0;

export const pointColor = new Cesium.ColorMaterialProperty(Cesium.Color.CHARTREUSE.withAlpha(0.9));
export const polylineColor = new Cesium.ColorMaterialProperty(Cesium.Color.YELLOW.withAlpha(0.9));
export const polylineWidth = 2;
export const polygonColor = new Cesium.ColorMaterialProperty(Cesium.Color.AQUA.withAlpha(0.7));

export type GeometryToolType = 'PointTool' | 'PolylineTool' | 'PolygonTool' | 'BoxTool' | 'NoTool';

class Click {
    position: Cesium.Cartesian2;
}

class Movement {
    // noinspection JSUnusedGlobalSymbols
    startPosition?: Cesium.Cartesian2;
    endPosition: Cesium.Cartesian2;
}

export abstract class ToolContext {

    abstract newEntity(entity: Cesium.Entity): void;

    abstract addToolEntity(entityT: Cesium.Entity): void;

    abstract removeAllToolEntities(): void;

    abstract pickEllipsoid(position: Cesium.Cartesian2): Cesium.Cartesian3 | undefined;

    abstract cartesianWithHeightDelta(cartesian: Cesium.Cartesian3, height: number): Cesium.Cartesian3;

    abstract cartesianToCartographic(cartesian: Cesium.Cartesian3): Cesium.Cartographic;

    abstract cartographicToCartesian(cartographic: Cesium.Cartographic): Cesium.Cartesian3;
}

export abstract class ToolContextBase extends ToolContext {
    private _tool: Tool;

    protected constructor() {
        super();
        this._tool = NO_TOOL;
    }

    set tool(tool: Tool) {
        if (tool !== this._tool) {
            this._tool.deactivate();
            this._tool.context = null;
            this._tool = tool;
            this._tool.context = this;
            this._tool.activate();
        }
    }

    get tool(): Tool {
        return this._tool;
    }

    onLeftClick(leftClick: Click): void {
        this._tool.handleLeftClick(leftClick);
    }

    onLeftDoubleClick(leftClick: Click): void {
        this._tool.handleLeftDoubleClick(leftClick);
    }

    onMouseMove(movement: Movement): void {
        this._tool.handleMouseMove(movement);
    }
}


export class CesiumToolContext extends ToolContextBase {
    private _viewer: Cesium.Viewer;
    private _ellipsoid: Cesium.Ellipsoid;
    private _toolDataSource: Cesium.CustomDataSource;
    private _handler: Cesium.ScreenSpaceEventHandler;
    private _onNewEntity?: (entity: Cesium.Entity) => void;

    constructor(viewer: Cesium.Viewer, onNewEntity?: (entity: Cesium.Entity) => void) {
        super();
        this._viewer = viewer;
        this._ellipsoid = viewer.scene.globe.ellipsoid;
        this._toolDataSource = new Cesium.CustomDataSource('Tool Data Source');
        viewer.dataSources.add(this._toolDataSource);
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(leftClick => {
            if (this.tool.isActive()) {
                this.onLeftClick(leftClick);
                this._viewer.scene.requestRender();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(doubleClick => {
            if (this.tool.isActive()) {
                this.onLeftDoubleClick(doubleClick);
                this._viewer.scene.requestRender();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        handler.setInputAction(movement => {
            if (this.tool.isActive()) {
                this.onMouseMove(movement);
                this._viewer.scene.requestRender();
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this._handler = handler;
        this._onNewEntity = onNewEntity;
    }

    newEntity(entity: Cesium.Entity): void {
        if (this._onNewEntity) {
            this._onNewEntity(new Cesium.Entity(entity));
        } else {
            this._viewer.entities.add(entity);
        }
    }

    addToolEntity(entity: Cesium.Entity): void {
        this._toolDataSource.entities.add(entity);
    }

    removeAllToolEntities(): void {
        this._toolDataSource.entities.removeAll();
    }

    pickEllipsoid(position: Cesium.Cartesian2): Cesium.Cartesian3 {
        return this._viewer.camera.pickEllipsoid(position, this._ellipsoid);
    }

    cartesianWithHeightDelta(cartesian: Cesium.Cartesian3, height: number): Cesium.Cartesian3 {
        const cartographic = this._ellipsoid.cartesianToCartographic(cartesian);
        cartographic.height += height;
        return this._ellipsoid.cartographicToCartesian(cartographic);
    }

    cartesianToCartographic(cartesian: Cesium.Cartesian3): Cesium.Cartographic {
        return this._ellipsoid.cartesianToCartographic(cartesian);
    }

    cartographicToCartesian(cartographic: Cesium.Cartographic): Cesium.Cartesian3 {
        return this._ellipsoid.cartographicToCartesian(cartographic);
    }

    destroy() {
        this._handler.destroy();
    }
}

export interface Tool {
    readonly type: string;

    context: ToolContext | null;

    isActive(): boolean;

    activate(): void;

    deactivate(): void;

    handleLeftClick(leftClick: Click): void;

    handleLeftDoubleClick(leftClick: Click): void;

    handleMouseMove(movement: Movement): void;
}


abstract class ToolBase implements Tool {
    readonly type: string;
    private _context: ToolContext | null = null;

    constructor(type: string) {
        this.type = type;
    }

    set context(context: ToolContext | null) {
        this._context = context;
    }

    get context(): ToolContext | null {
        return this._context;
    }

    isActive(): boolean {
        return this._context !== null;
    }

    activate() {
    }

    deactivate() {
    }

    handleLeftClick(leftClick: Click) {
    }

    handleLeftDoubleClick(leftClick: Click) {
    }

    handleMouseMove(movement: Movement) {
    }
}

export class NoTool extends ToolBase {
    constructor() {
        super('NoTool');
    }
}

export const NO_TOOL = new NoTool();

export class PointTool extends ToolBase {

    constructor() {
        super('PointTool');
    }

    handleLeftClick(leftClick) {
        const position = this.context.pickEllipsoid(leftClick.position);
        if (isDefined(position)) {
            this.context.newEntity(new Cesium.Entity({
                                                         position,
                                                         point: {
                                                             pixelSize: 6,
                                                             //color: Cesium.Color.RED,
                                                             //outlineColor: Cesium.Color.WHITE,
                                                             outlineWidth: 1
                                                         },
                                                     }));
        }
    }
}

class PolyTool extends ToolBase {

    private readonly genPolygon: boolean;

    // Note polylinePositions and polygonPositions differ in height
    private polylinePositions: Cesium.Cartesian3[] | null = null;
    private polygonPositions: Cesium.Cartesian3[] | null = null;

    private polylineEntity: Cesium.Entity | null = null;
    private polygonEntity: Cesium.Entity | null = null;

    private hasRubberband: boolean = false;

    constructor(type: string, genPolygon: boolean) {
        super(type);
        this.genPolygon = genPolygon;
    }

    deactivate() {
        this.reset();
    }

    handleLeftClick(leftClick: Click) {
        this.addPoint(leftClick.position);
    }

    handleMouseMove(movement: Movement) {
        this.moveLastPoint(movement.endPosition);
    }

    handleLeftDoubleClick(leftClick: Click) {
        this.endInteraction();
    }

    private addPoint(screenPosition: Cesium.Cartesian2) {
        let position = this.context.pickEllipsoid(screenPosition);
        if (isDefined(position)) {
            position = this.context.cartesianWithHeightDelta(position, pointHeight);
            // Add point graphics
            if (this.updatePositions(position)) {
                this.context.addToolEntity(new Cesium.Entity({
                                                                 position,
                                                                 //allowPicking: false,
                                                                 point: {
                                                                     show: true,
                                                                     outlineColor: Cesium.Color.BLACK,
                                                                     outlineWidth: 1,
                                                                     color: pointColor,
                                                                     pixelSize: 10,
                                                                 }
                                                             }));
            }
            this.hasRubberband = false;
        }
    }

    private endInteraction() {
        if (this.polygonEntity !== null) {
            this.context.newEntity(new Cesium.Entity({
                                                         polygon: {
                                                             // check: why doesn't this work?
                                                             // hierarchy: this.polygonEntity.hierarchy,
                                                             hierarchy: new Cesium.PolygonHierarchy(this.polygonPositions),
                                                             material: polygonColor,
                                                         }
                                                     }));
        } else if (this.polylineEntity !== null) {
            this.context.newEntity(new Cesium.Entity({
                                                         polyline: {
                                                             // check: why doesn't this work?
                                                             // positions: this.polylinePositions.positions,
                                                             positions: this.polylinePositions,
                                                             material: polylineColor,
                                                         }
                                                     }));
        }
        this.reset();
    }

    private moveLastPoint(screenPosition: Cesium.Cartesian2) {
        if (!this.polylinePositions) {
            return;
        }
        const position = this.context.pickEllipsoid(screenPosition);
        if (isDefined(position)) {
            this.updatePositions(position);
            this.hasRubberband = true;
        }
    }

    private updatePositions(position: Cesium.Cartesian3): boolean {
        const polylinePoint = this.context.cartesianWithHeightDelta(position, polylineHeight);
        let newPointAdded = true;
        if (this.polylinePositions === null) {
            this.polylinePositions = [polylinePoint];
        } else {
            const numPoints = this.polylinePositions.length;
            if (this.hasRubberband) {
                this.polylinePositions[numPoints - 1] = polylinePoint;
            } else {
                if (polylinePoint.equals(this.polylinePositions[numPoints - 1])) {
                    newPointAdded = false;
                } else {
                    this.polylinePositions.push(polylinePoint);
                }
            }
        }
        if (this.polylinePositions.length > 1) {
            let positions = this.polylinePositions.slice();
            if (!this.polylineEntity) {
                this.polylineEntity = new Cesium.Entity({
                                                            //allowPicking: false,
                                                            polyline: {
                                                                positions: positions,
                                                                width: polylineWidth,
                                                                //followSurface: true,
                                                                material: polylineColor,
                                                            }
                                                        })
                this.context.addToolEntity(this.polylineEntity);
            } else if (newPointAdded) {
                this.polylineEntity.polyline.positions = new Cesium.ConstantProperty(positions);
            }
        }

        if (newPointAdded && this.genPolygon) {
            const polygonPoint = this.context.cartesianWithHeightDelta(position, polygonHeight);
            if (!this.polygonPositions) {
                this.polygonPositions = [polygonPoint];
            } else {
                const numPoints = this.polygonPositions.length;
                if (this.hasRubberband) {
                    this.polygonPositions[numPoints - 1] = polygonPoint;
                } else {
                    this.polygonPositions.push(polygonPoint);
                }
            }
            if (this.polygonPositions.length > 2) {
                let positions = this.polygonPositions.slice();
                if (!this.polygonEntity) {
                    this.polygonEntity = new Cesium.Entity({
                                                               //allowPicking: false,
                                                               polygon: {
                                                                   hierarchy: new Cesium.PolygonHierarchy(positions),
                                                                   material: polygonColor,
                                                               }
                                                           });
                    this.context.addToolEntity(this.polygonEntity);
                } else {
                    this.polygonEntity.polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(positions));
                }
            }
        }

        return newPointAdded;
    }

    private reset() {
        this.polylinePositions = null;
        this.polygonPositions = null;
        this.polylineEntity = null;
        this.polygonEntity = null;
        this.hasRubberband = false;
        if (this.context !== null) {
            this.context.removeAllToolEntities();
        }
    }

}

export class PolylineTool extends PolyTool {

    constructor() {
        super('PolylineTool', false);
    }
}

export class PolygonTool extends PolyTool {

    constructor() {
        super('PolygonTool', true);
    }
}

export class BoxTool extends ToolBase {

    private position1: Cesium.Cartesian3 | null = null;
    private position2: Cesium.Cartesian3 | null = null;
    private polygonEntity: Cesium.Entity | null = null;

    constructor() {
        super('BoxTool');
    }

    deactivate() {
        this.reset();
    }

    handleLeftClick(leftClick: Click) {
        this.setPosition(leftClick.position, true);
    }

    handleLeftDoubleClick(leftClick: Click) {
        this.setPosition(leftClick.position, true);
    }

    handleMouseMove(movement: Movement) {
        if (this.position1) {
            this.setPosition(movement.endPosition, false);
        }
    }

    private setPosition(screenPosition: Cesium.Cartesian2, doAdd: boolean) {
        const position = this.context.pickEllipsoid(screenPosition);
        if (isDefined(position)) {
            if (this.position1 === null) {
                this.position1 = position;
            } else {
                this.position2 = position;
                const positions = this.getPositions();
                if (doAdd) {
                    this.context.newEntity(new Cesium.Entity({
                                                                 polygon: {
                                                                     hierarchy: new Cesium.PolygonHierarchy(positions),
                                                                     material: polygonColor,
                                                                 }
                                                             }));
                    this.reset();
                    return;
                }
                if (this.polygonEntity === null) {
                    this.polygonEntity = new Cesium.Entity({
                                                               // allowPicking: false,
                                                               polygon: {
                                                                   hierarchy: new Cesium.PolygonHierarchy(positions),
                                                                   material: polygonColor,
                                                               }
                                                           });
                    this.context.addToolEntity(this.polygonEntity);
                } else {
                    this.polygonEntity.polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(positions));
                }
            }
        }
    }

    private getPositions(): Cesium.Cartesian3[] {
        const carto1 = this.context.cartesianToCartographic(this.position1);
        const carto2 = this.context.cartesianToCartographic(this.position2);
        const lon1 = carto1.longitude;
        const lat1 = carto1.latitude;
        const lon2 = carto2.longitude;
        const lat2 = carto2.latitude;
        const height = 0.5 * (carto1.height + carto2.height);
        return [
            this.context.cartographicToCartesian(new Cesium.Cartographic(lon1, lat1, height)),
            this.context.cartographicToCartesian(new Cesium.Cartographic(lon2, lat1, height)),
            this.context.cartographicToCartesian(new Cesium.Cartographic(lon2, lat2, height)),
            this.context.cartographicToCartesian(new Cesium.Cartographic(lon1, lat2, height)),
        ];
    }

    reset() {
        this.position1 = null;
        this.position2 = null;
        this.polygonEntity = null;
        if (this.context !== null) {
            this.context.removeAllToolEntities();
        }
    }
}

