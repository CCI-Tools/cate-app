import {
    Card,
    Checkbox,
    Collapse,
    InputGroup,
    Intent,
    Label,
    Tooltip,
    Icon,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import * as React from 'react';

import * as types from '../../common/cate-types';
import { formatDateAsISODateString } from '../../common/format';
import { DateRangeField, DateRangeFieldValue, validateDateRange } from '../components/field/DateRangeField';
import { TextFieldValue } from '../components/field/TextField';
import LongIdLabel from '../components/LongIdLabel';
import { GLOBAL, Region, RegionValue } from '../components/Region';
import { DataSourceState, ResourceState, VariableState } from '../state';
import { VarNameValueEditor } from './editor/VarNameValueEditor';

type TimeRangeValue = [string, string];

export interface IDataAccessComponentOptions {

    hasTimeConstraint: boolean;
    dateRange: DateRangeFieldValue | null;

    hasRegionConstraint: boolean;
    region: RegionValue | null;

    hasVariablesConstraint: boolean;
    variableNames: TextFieldValue | null;

    isCacheDataSourceSelected?: boolean;
    cachedDataSourceId?: string;
    cachedDataSourceTitle?: string;

    openDatasetResourceName: string;
}

export interface IDataAccessComponentProps {
    options: IDataAccessComponentOptions;
    onChange: (options: IDataAccessComponentOptions) => any;
    dataSource: DataSourceState | null;
    isLocalDataSource: boolean;
    temporalCoverage: TimeRangeValue | null;
    canConstrainRegion: boolean;
    canConstrainTime: boolean;
    canConstrainVariables: boolean;
    canCache: boolean;
}


const WARNINGS_PANEL_STYLE: React.CSSProperties = {
    marginTop: 8,
    marginBottom: 8,
};


const WARNING_ICON = (<Icon icon={IconNames.WARNING_SIGN} intent={Intent.WARNING}/>);
const ERROR_ICON = (<Icon icon={IconNames.ERROR} intent={Intent.DANGER}/>);
const ISSUE_ICON = (<Icon icon={IconNames.ISSUE} intent={Intent.PRIMARY}/>);

const TIME_RANGE_STYLE: React.CSSProperties = {
    marginTop: 4,
    marginBottom: 4,
};

/**
 * A components that yields IDataAccessComponentOptions as value.
 *
 * @author Norman Fomferra
 */
export class DataAccessComponent extends React.Component<IDataAccessComponentProps, null> {
    static readonly VAR_NAMES_INPUT = {name: 'varNames', dataType: 'string', description: null, nullable: true};
    static readonly SUB_PANEL_STYLE = {marginTop: '1em'};
    static readonly OPTION_CHECK_STYLE = {marginTop: '1em'};
    static readonly OPTION_DIV_STYLE = {marginLeft: '2em'};

    constructor(props: IDataAccessComponentProps) {
        super(props);
        this.onHasTimeConstraintChange = this.onHasTimeConstraintChange.bind(this);
        this.onDateRangeChange = this.onDateRangeChange.bind(this);
        this.onHasRegionConstraintChange = this.onHasRegionConstraintChange.bind(this);
        this.onRegionChange = this.onRegionChange.bind(this);
        this.onHasVariablesConstraintChange = this.onHasVariablesConstraintChange.bind(this);
        this.onVariableNamesChange = this.onVariableNamesChange.bind(this);
        this.onMakeLocalSelectedChange = this.onMakeLocalSelectedChange.bind(this);
        this.onMakeLocalDataSourceIdChange = this.onMakeLocalDataSourceIdChange.bind(this);
        this.onOpenDatasetResourceNameChange = this.onOpenDatasetResourceNameChange.bind(this);
    }

    private onDateRangeChange(dateRange: DateRangeFieldValue) {
        this.props.onChange({...this.props.options, dateRange});
    }

    private onRegionChange(region: RegionValue) {
        this.props.onChange({...this.props.options, region});
    }

    private onHasTimeConstraintChange(ev: any) {
        this.props.onChange({...this.props.options, hasTimeConstraint: ev.target.checked});
    }

    private onHasRegionConstraintChange(ev: any) {
        this.props.onChange({...this.props.options, hasRegionConstraint: ev.target.checked});
    }

    private onHasVariablesConstraintChange(ev: any) {
        this.props.onChange({...this.props.options, hasVariablesConstraint: ev.target.checked});
    }

    //noinspection JSUnusedLocalSymbols
    private onVariableNamesChange(unused: any, variableNames: TextFieldValue) {
        this.props.onChange({...this.props.options, variableNames});
    }

    private onMakeLocalSelectedChange(ev: any) {
        this.props.onChange({...this.props.options, isCacheDataSourceSelected: ev.target.checked});
    }

    private onMakeLocalDataSourceIdChange(ev: any) {
        this.props.onChange({...this.props.options, cachedDataSourceId: ev.target.value});
    }

    private onOpenDatasetResourceNameChange(ev: any) {
        this.props.onChange({...this.props.options, openDatasetResourceName: ev.target.value});
    }

    private static dataSourceVarToVariable(dsVar: any): VariableState {
        return {name: dsVar.name, units: dsVar.units || '-', dataType: types.DATA_ARRAY_TYPE};
    }

    private static dataSourceToResource(dataSource: DataSourceState): ResourceState {
        if (dataSource) {
            const metaInfo = dataSource.metaInfo;
            if (metaInfo && metaInfo.data_vars && metaInfo.data_vars.length) {
                return {
                    name: dataSource.id,
                    dataType: types.DATASET_TYPE,
                    variables: metaInfo.data_vars.map(v => DataAccessComponent.dataSourceVarToVariable(v)),
                } as ResourceState;
            }
        }
        return null;
    }

    render() {
        if (!this.props.dataSource) {
            return null;
        }
        const options = this.props.options;

        // TODO (forman): turn timeConstraintsPanel,
        //      regionConstraintsPanel,
        //      variablesConstraintPanel into components

        let minDate = new Date('1970-01-01');
        let maxDate = new Date(Date.now());
        const temporalCoverage = this.props.temporalCoverage;
        if (temporalCoverage) {
            if (temporalCoverage[0]) {
                minDate = new Date(temporalCoverage[0]);
            }
            if (temporalCoverage[1]) {
                maxDate = new Date(temporalCoverage[1]);
            }
        }

        const temporalCoverageText = temporalCoverage && (
            <div style={TIME_RANGE_STYLE}>{`Available time range: ${temporalCoverage.join(', ')}`}</div>
        );

        const hasTimeConstraint = options.hasTimeConstraint;
        const dateRange = hasTimeConstraint ? options.dateRange : null;
        const timeConstraintsPanel = (<div style={DataAccessComponent.SUB_PANEL_STYLE}>
            <Checkbox
                disabled={!temporalCoverage || !this.props.canConstrainTime}
                checked={hasTimeConstraint}
                label="Time constraint"
                onChange={this.onHasTimeConstraintChange}
            />
            <Collapse isOpen={hasTimeConstraint}>
                <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                    <DateRangeField
                        nullable={true}
                        min={minDate}
                        max={maxDate}
                        value={dateRange}
                        onChange={this.onDateRangeChange}
                    />
                    {temporalCoverageText}
                </div>
            </Collapse>
        </div>);

        const hasRegionConstraint = options.hasRegionConstraint;
        const region = hasRegionConstraint ? options.region || GLOBAL : options.region;
        const regionConstraintsPanel = (
            <div style={DataAccessComponent.SUB_PANEL_STYLE}>
                <Checkbox
                    disabled={!this.props.canConstrainRegion}
                    checked={hasRegionConstraint}
                    label="Region constraint"
                    onChange={this.onHasRegionConstraintChange}
                />
                <Collapse isOpen={this.props.canConstrainRegion && hasRegionConstraint}>
                    <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                        <Region
                            value={region}
                            disabled={!hasRegionConstraint}
                            onChange={this.onRegionChange}
                        />
                    </div>
                </Collapse>
            </div>
        );

        const hasVariablesConstraint = options.hasVariablesConstraint;
        const res = DataAccessComponent.dataSourceToResource(this.props.dataSource);
        const variablesConstraintPanel = (
            <div style={DataAccessComponent.SUB_PANEL_STYLE}>
                <Checkbox
                    disabled={!this.props.canConstrainVariables}
                    checked={hasVariablesConstraint}
                    label="Variables constraint"
                    onChange={this.onHasVariablesConstraintChange}
                />
                <Collapse isOpen={hasVariablesConstraint}>
                    <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                        <VarNameValueEditor input={DataAccessComponent.VAR_NAMES_INPUT}
                                            value={options.variableNames}
                                            onChange={this.onVariableNamesChange}
                                            resource={res}
                                            multi={true}/>
                    </div>
                </Collapse>
            </div>
        );

        let cacheConfigPanel;
        if (this.props.canCache && !this.props.isLocalDataSource) {
            const isMakeLocalSelected = options.isCacheDataSourceSelected;
            cacheConfigPanel = (<div style={DataAccessComponent.SUB_PANEL_STYLE}>
                    <Tooltip content={"If unchecked, remote data will be accessed " +
                                      "using an available protocol, e.g. OPeNDAP."}>
                        <Checkbox
                            checked={isMakeLocalSelected}
                            label="Cache data source (allocates space on disk)"
                            onChange={this.onMakeLocalSelectedChange}
                        />
                    </Tooltip>
                    <Collapse isOpen={isMakeLocalSelected}>
                        <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                            <Label>
                                Unique identifier for the new local data source
                                <span className="bp3-text-muted"> (optional)</span>
                                <InputGroup
                                    style={{width: '100%'}}
                                    type="text"
                                    value={options.cachedDataSourceId}
                                    onChange={this.onMakeLocalDataSourceIdChange}
                                />
                            </Label>
                        </div>
                    </Collapse>
                </div>
            );
        }

        const messages: Array<[React.ReactNode, React.ReactNode]> = [];
        if (this.props.dataSource.metaInfoStatus === 'ok') {
            if (!this.props.canConstrainTime) {
                messages.push([WARNING_ICON, "This dataset has no (recognised) temporal coverage."]);
            }
            if (!this.props.canConstrainRegion) {
                messages.push([WARNING_ICON,
                               <span>This dataset has no (recognised) spatial coverage
                                   and hence it will not show up
                                   in the <strong>World View</strong>.</span>]);
            }
            if (!this.props.canConstrainVariables) {
                messages.push([WARNING_ICON, "This datasets has no (recognised) variables."]);
            }
        } else if (this.props.dataSource.metaInfoStatus === 'loading') {
            messages.push([ISSUE_ICON, "Please wait while dataset metadata is loaded..."]);
        } else if (this.props.dataSource.metaInfoStatus === 'error') {
            messages.push([ERROR_ICON, "Failed to load dataset metadata."]);
        }

        let messagesPanel;
        if (messages.length > 0) {
            messagesPanel = (
                <Card style={WARNINGS_PANEL_STYLE}>
                    {
                        messages.map(([i, t]) =>
                                         <div>{i}&nbsp;&nbsp;{t}</div>)
                    }
                </Card>);
        }

        return (
            <div>
                <LongIdLabel
                    label={this.props.isLocalDataSource
                           ? 'Data source (local):'
                           : 'Data source:'}
                    longId={this.props.dataSource.title}
                />
                {timeConstraintsPanel}
                {regionConstraintsPanel}
                {variablesConstraintPanel}
                {cacheConfigPanel}
                {/*{resourceNamePanel}*/}
                {messagesPanel}
            </div>
        );
    }

    static validateOptions(isLocalDataSource: boolean, options: IDataAccessComponentOptions): boolean {
        if (!options) {
            return false;
        }

        let validTimeConstraint = true;
        if (options.hasTimeConstraint && options.dateRange) {
            validTimeConstraint = !options.dateRange.error;
        }

        let validRegion = true;
        if (options.hasRegionConstraint && options.region) {
            const west = options.region.west.value;
            const east = options.region.east.value;
            const south = options.region.south.value;
            const north = options.region.north.value;
            const eps = 360. / 40000.; // 1km
            const validWest = west >= -180 && west <= 180;
            const validEast = east >= -180 && east <= 180;
            const validNorth = north >= -90 && north <= 90;
            const validSouth = south >= -90 && south <= 90;
            const validEastWest = validWest && validEast && Math.abs(west - east) >= eps;
            const validSouthNorth = validSouth && validNorth && (north - south) >= eps;
            validRegion = validEastWest && validSouthNorth;
        }

        let validVariableNames = true;
        if (options.hasVariablesConstraint && options.variableNames) {
            validVariableNames = !options.variableNames.error;
        }

        let validDataSourceId = true;
        if (!isLocalDataSource && options.isCacheDataSourceSelected) {
            const makeLocalDataSourceId = options.cachedDataSourceId;
            if (makeLocalDataSourceId && !/[^\\/:*?"<>|\r\n]+$/im.test(makeLocalDataSourceId)) {
                validDataSourceId = false;
            }
        }

        return validTimeConstraint && validRegion && validVariableNames && validDataSourceId;
    }

    static optionsToErrors(options: IDataAccessComponentOptions) {
        const inputErrors = {};
        if (options.hasTimeConstraint && options.dateRange && options.dateRange.error) {
            inputErrors['Time constraint'] = options.dateRange.error
        }
        if (options.hasVariablesConstraint && options.variableNames && options.variableNames.error) {
            inputErrors['Variables constraint'] = options.variableNames.error
        }
        return inputErrors;
    }


    static optionsToOperationArguments(options: IDataAccessComponentOptions) {
        let args = {};
        if (options.hasTimeConstraint && options.dateRange && options.dateRange.value) {
            const t0 = formatDateAsISODateString(options.dateRange.value[0]);
            const t1 = formatDateAsISODateString(options.dateRange.value[1]);
            args = {
                time_range: `${t0},${t1}`,
            };
        }
        if (options.hasRegionConstraint && options.region) {
            const region = options.region;
            args = {
                ...args,
                region: `${region.west.value},${region.south.value},${region.east.value},${region.north.value}`
            };
        }
        if (options.hasVariablesConstraint && options.variableNames) {
            const variableNames = options.variableNames.value;
            args = {
                ...args,
                var_names: variableNames
            };
        }
        if (options.isCacheDataSourceSelected) {
            args = {
                ...args,
                force_local: true
            };
            if (options.cachedDataSourceId) {
                args = {
                    ...args,
                    local_ds_id: options.cachedDataSourceId
                };
            }
        }
        return args;
    }

    static defaultOptions(isLocalDataSource: boolean, temporalCoverage: TimeRangeValue): IDataAccessComponentOptions {
        let minDate = null;
        let maxDate = null;
        if (temporalCoverage && temporalCoverage[0]) {
            try {
                minDate = new Date(temporalCoverage[0]);
            } catch (e) {
                // ok
            }
        }
        if (temporalCoverage && temporalCoverage[1]) {
            try {
                maxDate = new Date(temporalCoverage[1]);
            } catch (e) {
                // ok
            }
        }

        return {
            hasTimeConstraint: false,
            dateRange: {value: [minDate, maxDate]},

            hasRegionConstraint: false,
            region: null,

            hasVariablesConstraint: false,
            variableNames: null,

            isCacheDataSourceSelected: !isLocalDataSource,
            cachedDataSourceId: '',

            openDatasetResourceName: '',
        };
    }

    // static adjustLocalDataSourceName(options: IDataAccessComponentOptions, dataSource: DataSourceState): IDataAccessComponentOptions {
    //     if (!options.cachedDataSourceId || options.cachedDataSourceId === '') {
    //         let dataSourceId = dataSource && dataSource.id;
    //         if (!dataSourceId) {
    //             dataSourceId = 'unnamed';
    //         }
    //         return {...options, cachedDataSourceId: 'local.' + dataSourceId};
    //     }
    //     return options;
    // }

    static ensureDateRangeIsValidated(options: IDataAccessComponentOptions, temporalCoverage: TimeRangeValue): IDataAccessComponentOptions {
        if (options.hasTimeConstraint && options.dateRange && temporalCoverage) {
            try {
                const minDate = temporalCoverage[0] ? new Date(temporalCoverage[0]) : new Date('1980-01-01');
                const maxDate = temporalCoverage[1] ? new Date(temporalCoverage[1]) : new Date(Date.now());

                // re-validate, because min, max may have changed
                validateDateRange(options.dateRange.value, true, minDate, maxDate);
                return {...options, dateRange: {...options.dateRange, error: null}};
            } catch (e) {
                return {...options, dateRange: {...options.dateRange, error: e}};
            }
        }
        return options;
    }
}


