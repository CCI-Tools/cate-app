import { HTMLSelect } from '@blueprintjs/core';
import * as React from 'react';
import { IValueEditorProps } from './ValueEditor';
import { OperationInputState } from '../../state';


export class ValueSetValueEditor extends React.PureComponent<IValueEditorProps<any>, null> {
    static readonly NULL_VALUE = '__null__';
    private static readonly VALUE_SELECTOR_STYLE = {justifySelf: 'stretch'};

    private onChange(value: any) {
        this.props.onChange(this.props.input, value === ValueSetValueEditor.NULL_VALUE ? null : value);
    }

    static isValueSetGiven(input: OperationInputState) {
        return input.valueSet && input.valueSet.length;
    }

    render() {
        const valueSet = this.props.input.valueSet;
        const hasValueSet = valueSet && valueSet.length;
        if (!hasValueSet) {
            return null;
        }
        let options = valueSet.map((v, i) => (<option key={i} value={v}>{v}</option>));
        if (this.props.input.nullable) {
            options = [<option key={-1} value={ValueSetValueEditor.NULL_VALUE}/>].concat(...options);
        }
        const value = this.props.value || ValueSetValueEditor.NULL_VALUE;
        return (
            <div className="bp3-select">
                <HTMLSelect
                    fill={true}
                    style={ValueSetValueEditor.VALUE_SELECTOR_STYLE}
                    value={value}
                    onChange={(event: any) => this.onChange(event.target.value)}
                >
                    {options}
                </HTMLSelect>
            </div>
        );
    }
}
