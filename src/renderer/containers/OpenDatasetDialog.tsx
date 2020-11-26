import * as React from 'react';
import { connect, DispatchProp } from 'react-redux';
import { DataSourceState, DataStoreState, DialogState, State } from '../state';
import { isLocalDataStore, isRemoteDataStore } from '../state-util';
import { ModalDialog } from '../components/ModalDialog';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { DataAccessComponent, IDataAccessComponentOptions } from './DataAccessComponent';
import { renderInputErrors } from './OperationStepDialog';

type TimeRangeValue = [string, string];


interface IOpenDatasetDialogProps {
    isOpen: boolean;
    dataStore: DataStoreState | null;
    dataSource: DataSourceState | null;
    temporalCoverage: TimeRangeValue | null;
    options: IDataAccessComponentOptions;
}

interface IOpenDatasetDialogState extends DialogState {
    options: IDataAccessComponentOptions;
}

function mapStateToProps(state: State): IOpenDatasetDialogProps {
    const dialogState = selectors.dialogStateSelector(OpenDatasetDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        dataStore: selectors.selectedDataStoreSelector(state),
        dataSource: selectors.selectedDataSourceSelector(state),
        temporalCoverage: selectors.selectedDataSourceTemporalCoverageSelector(state),
        options: (dialogState as any).options as IDataAccessComponentOptions,
    };
}

class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps & DispatchProp<State>, IOpenDatasetDialogState> {
    static readonly DIALOG_ID = 'openDatasetDialog';

    constructor(props: IOpenDatasetDialogProps & DispatchProp<State>) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onOptionsChange = this.onOptionsChange.bind(this);
        this.state = OpenDatasetDialog.mapPropsToState(props);
    }

    componentWillReceiveProps(nextProps: IOpenDatasetDialogProps): void {
        this.setState(OpenDatasetDialog.mapPropsToState(nextProps));
    }

    static mapPropsToState(nextProps: IOpenDatasetDialogProps): IOpenDatasetDialogState {
        let options = nextProps.options
                      || DataAccessComponent.defaultOptions(isLocalDataStore(nextProps.dataStore),
                                                            nextProps.temporalCoverage);
        options = DataAccessComponent.ensureDateRangeIsValidated(options, nextProps.temporalCoverage);
        return {options};
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID));
    }

    private canConfirm(): boolean {
        return DataAccessComponent.validateOptions(this.isLocalDataStore, this.state.options);
    }

    private onConfirm() {
        const options = this.state.options;
        // Clear cachedDataSourceId, so on next props, we can create a new default from selected data source
        // clear cachedDataSourceTitle, hasVariablesConstraint, variableNames, too
        // keep time and geo constraint
        const dsDefault = this.isRemoteDataStore ? '' : undefined;
        const dialogState = {
            options:
                {
                    ...options,
                    makeLocalDataSourceId: dsDefault,
                    makeLocalDataSourceTitle: dsDefault,
                    hasVariablesConstraint: false,
                    variableNames: null,
                }
        };
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID, dialogState));
        this.props.dispatch(actions.openDataset(
            this.props.dataSource.id,
            DataAccessComponent.optionsToOperationArguments(this.state.options),
            this.isRemoteDataStore && this.state.options.isCacheDataSourceSelected
        ) as any);
        // Save modified state
        this.setState(dialogState);
    }

    private onOptionsChange(options: IDataAccessComponentOptions) {
        this.setState({options});
    }

    private get isRemoteDataStore() {
        return isRemoteDataStore(this.props.dataStore);
    }

    private get isLocalDataStore() {
        return isLocalDataStore(this.props.dataStore);
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        const cacheSelected = this.isRemoteDataStore && this.state.options.isCacheDataSourceSelected;
        const inputErrors = DataAccessComponent.optionsToErrors(this.state.options);
        const confirmTooltip = renderInputErrors(inputErrors);

        return (
            <ModalDialog
                isOpen={isOpen}
                title={'Open Dataset'}
                icon="database"
                confirmTitle={cacheSelected ? 'Cache and Open' : 'Open'}
                confirmIconName={"folder-shared-open"}
                confirmTooltip={confirmTooltip}
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />);
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <DataAccessComponent
                options={this.state.options}
                onChange={this.onOptionsChange}
                dataSource={this.props.dataSource}
                isLocalDataSource={this.isLocalDataStore}
                temporalCoverage={this.props.temporalCoverage}/>
        );
    }

}

export default connect(mapStateToProps)(OpenDatasetDialog);

