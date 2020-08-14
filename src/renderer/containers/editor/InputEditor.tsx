import * as React from 'react';
import { ReactChild } from 'react';
import { HTMLSelect, Popover, PopoverInteractionKind, PopoverPosition, Switch, Tooltip, Alignment } from '@blueprintjs/core';
import { LabelWithType } from '../../components/LabelWithType';
import { ResourceState } from '../../state';
import * as cateTypes from '../../../common/cate-types';
import { isAssignableFrom } from '../../../common/cate-types';
import { formatDataTypeName } from '../../../common/format';

export interface IInputEditorProps {
    name: string;
    dataType: string;
    valueEditor?: JSX.Element;
    tooltipText?: string;
    units?: string;
    resources: Array<ResourceState>;
    resourceName?: string | null;
    isValueEditorShown?: boolean;
    /**
     * Notified if a resource is selected or deselected.
     * @param resourceName The resource name or null
     * @param isValueEditorShown whether the value editor is shown and active
     */
    onChange?: (resourceName: string | null, isValueEditorShown: boolean) => void;
}

/**
 * A component that is used as editor for an input of some workflow step, e.g. operation.
 *
 * @author Norman Fomferra
 */
export class InputEditor extends React.PureComponent<IInputEditorProps, null> {

    private static readonly LABEL_STYLE = 
            {justifySelf: 'end', justifyContent: 'end'};
    private static readonly EDITOR_SWITCH_STYLE = {margin: 0}
    private static readonly RESOURCE_NAME_STYLE = {justifySelf: 'stretch'};

    render() {

        let editor;
        if (this.isValueEditorShown()) {
            editor = this.props.valueEditor;
        } else {
            editor = this.renderResourceNameEditor();
        }

        const editorSwitch = this.renderEditorSwitch();
        return (
           <React.Fragment key={this.props.name}>
                <LabelWithType style={InputEditor.LABEL_STYLE}
                               label={this.props.name}
                               units={this.props.units}
                               dataType={this.props.dataType}
                               tooltipText={this.props.tooltipText}/>
                {editor}
                {editorSwitch}
            </React.Fragment>
        );
    }

    private handleChange(resourceName: string, isValueEditorShown: boolean) {
        // console.log('InputEditor: handleChange', resourceName, isValueEditorShown);
        if (this.props.onChange) {
            this.props.onChange(resourceName, isValueEditorShown);
        }
    }

    private renderResourceNameEditor() {
        const NULL_VALUE = '__null__';
        const firstResourceOption = (<option key='__first__' value={NULL_VALUE}>Select resource</option>);
        const otherResourceOptions = (this.props.resources || [])
            .filter(resource => this.isDataTypeCompatible(resource))
            .map(resource => <option key={resource.name} value={resource.name}>{resource.name}</option>);
        const resourceOptions = [firstResourceOption].concat(otherResourceOptions);

        let editor = (
            <div className="bp3-intent-primary" style={InputEditor.RESOURCE_NAME_STYLE}>
                <HTMLSelect
                    fill={true}
                    style={InputEditor.RESOURCE_NAME_STYLE}
                    value={this.props.resourceName || NULL_VALUE}
                    disabled={otherResourceOptions.length === 0}
                    onChange={(event: any) => this.handleChange(event.target.value === NULL_VALUE ? null : event.target.value, false)}
                >
                    {resourceOptions}
                </HTMLSelect>
            </div>
        );

        if (otherResourceOptions.length === 0) {
            editor = (
                <Popover interactionKind={PopoverInteractionKind.HOVER} hoverOpenDelay={0} hoverCloseDelay={0}
                         position={PopoverPosition.TOP}
                         fill={true}
                         >
                    {editor}
                    <div style={{padding: 8}}>
                        This parameter requires a resource of type <span
                        style={{color: 'rgba(0,255,0,0.8)'}}>{formatDataTypeName(this.props.dataType, false)}</span>.
                        <br/>
                        Currently, no resources of this type are available.<br/>
                        {renderTypeInstanceHintText(this.props.dataType)}
                    </div>
                </Popover>
            );
        }

        return editor;
    }

    private renderEditorSwitch() {
        const valueEditorShown = this.isValueEditorShown();
        const valueEditorDisabled = this.isValueEditorDisabled();
        const resourceSelectorDisabled = !this.hasCompatibleResources();
        const switchDisabled = valueEditorDisabled || resourceSelectorDisabled;
        return (
            <span>
                <Tooltip
                    content={(valueEditorShown ? 'Switch to resource selection' : 'Switch to value entry')
                             + (switchDisabled ? ' (disabled)' : '')}>
                    <Switch checked={valueEditorShown}
                            disabled={switchDisabled}
                            alignIndicator={Alignment.LEFT}
                            style={InputEditor.EDITOR_SWITCH_STYLE}
                            onChange={(event: any) =>
                                      this.handleChange(this.props.resourceName, event.target.checked)}/>
                </Tooltip>
            </span>
        );
    }

    private isDataTypeCompatible(resource) {
        return isAssignableFrom(this.props.dataType, resource.dataType);
    }

    private hasCompatibleResources() {
        return (this.props.resources || []).some(resource => this.isDataTypeCompatible(resource));
    }

    private isValueEditorDisabled() {
        return !this.props.valueEditor;
    }

    private isValueEditorShown() {
        return !!(this.props.isValueEditorShown && this.props.valueEditor);
    }
}

/**
 * Render a hint text how to produce an instance of the desired target type.
 *
 * @param targetDataType The name of the target data type used in Cate's Python API
 * @returns {string} the hint text.
 */
function renderTypeInstanceHintText(targetDataType: string): ReactChild {
    switch (targetDataType) {
        case cateTypes.DATASET_TYPE:
            return <span>Datasets can be opened from the <b>DATA SOURCES</b> panel.<br/>
                You can also use operations like <code>open_dataset</code> or <br/>
                <code>read_netcdf</code> to produce resources of this type.</span>;
        case cateTypes.DATASET_LIKE_TYPE:
            return <span>Datasets can be opened from the <b>DATA SOURCES</b> panel.<br/>
                You can also use operations like <code>open_dataset</code>, <br/>
                or <code>read_netcdf</code> to produce resources of this type.</span>;
        case cateTypes.DATA_FRAME_TYPE:
            return <span>You can use operations like <code>read_csv</code>, <code>read_geo_data</code><br/>
                to produce resources of this type.</span>;
        case cateTypes.DATA_FRAME_LIKE_TYPE:
            return <span>You can use operations like <code>read_csv</code>, <code>read_geo_data</code>,<br/>
                or <code>open_dataset</code> to produce resources of this type.</span>;
        case cateTypes.ND_ARRAY_TYPE:
            return '';
        case cateTypes.SERIES_TYPE:
            return '';
    }
    return '';
}
