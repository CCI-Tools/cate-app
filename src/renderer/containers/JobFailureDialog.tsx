import { Checkbox, Icon, IconName, Intent } from '@blueprintjs/core';
import * as React from 'react';
import { connect, DispatchProp } from 'react-redux';
import * as actions from '../actions';
import MessageDetails from '../components/MessageDetails';

import { ModalDialog } from '../components/ModalDialog';
import * as selectors from '../selectors';
import { State } from '../state';
import { getJobFailureIconName, getJobFailureTitle, isDeveloperError, isUserError, JobFailure } from '../webapi';


interface IJobFailureDialogProps {
    isOpen: boolean;
    jobTitle: string;
    jobFailure: JobFailure;
}

interface IJobFailureDialogState {
    copyReport: boolean;
}

function mapStateToProps(state: State): IJobFailureDialogProps {
    const dialogState = selectors.dialogStateSelector(JobFailureDialog.DIALOG_ID)(state) as any;
    return {
        isOpen: dialogState.isOpen,
        jobTitle: dialogState.jobTitle,
        jobFailure: dialogState.jobFailure,
    };
}

const ERROR_MESSAGE_STYLE: React.CSSProperties = {wordBreak: 'break-all'};

class JobFailureDialog extends React.Component<DispatchProp<State> & IJobFailureDialogProps, IJobFailureDialogState> {

    static readonly DIALOG_ID = 'jobFailureDialog';
    // BlueprintJS Dialog width is 500px by default
    private static readonly DIALOG_STYLE: React.CSSProperties = {width: '600px'};

    constructor(props: IJobFailureDialogProps) {
        super(props);
        this.renderBody = this.renderBody.bind(this);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleCopyReport = this.handleCopyReport.bind(this);
        this.state = {copyReport: false};
    }

    handleConfirm() {
        if (this.state.copyReport) {
            let title = this.props.jobTitle;
            let failure = this.props.jobFailure;
            let report = `Job: ${title}\nMessage: ${failure.message}\n`;
            report += `Code: ${failure.code}\n`;
            if (failure.data) {
                if (failure.data.method) {
                    report += `Method: ${failure.data.method}\n`;
                }
                if (failure.data.exception) {
                    report += `Exception: ${failure.data.exception}\n`;
                }
                if (failure.data.traceback) {
                    report += `\n${failure.data.traceback}\n`;
                }
            }
            actions.copyTextToClipboard(report);
        }
        this.props.dispatch(actions.hideDialog(JobFailureDialog.DIALOG_ID));
    }

    handleCancel() {
        this.props.dispatch(actions.hideDialog(JobFailureDialog.DIALOG_ID));
    }

    handleCopyReport(event) {
        this.setState({copyReport: event.target.checked});
    }

    render() {
        if (!this.props.isOpen || !this.props.jobFailure) {
            return null;
        }
        const title = getJobFailureTitle(this.props.jobFailure);
        return (
            <ModalDialog isOpen={this.props.isOpen}
                         icon={'error'}
                         title={title}
                         onConfirm={this.handleConfirm}
                         onCancel={this.handleCancel}
                         noCancelButton={true}
                         renderBody={this.renderBody}
                         style={JobFailureDialog.DIALOG_STYLE}/>
        );
    }

    renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        let messageText = this.props.jobFailure.message;
        if (!messageText) {
            messageText = `An unknown error occurred (code ${this.props.jobFailure.code}).`;
        }
        let messageDiv = (
            <div style={ERROR_MESSAGE_STYLE}>
                <p>Oops, Cate couldn't carry out the request</p>
                <em><p className="user-selectable">{this.props.jobTitle}</p></em>
                <div>Reason:</div>
                <div className="user-selectable">{messageText}</div>
            </div>
        );

        let traceback;
        if (!isUserError(this.props.jobFailure)
            && this.props.jobFailure.data && this.props.jobFailure.data.traceback) {
            traceback = <MessageDetails details={this.props.jobFailure.data.traceback} width={'36em'}/>;
        }

        let reporting;
        if (isDeveloperError(this.props.jobFailure)) {
            reporting = (
                <div style={{marginTop: '1em'}}>
                    <span className="bp3-text-muted">Please consider reporting this issue in Cate's <a
                        href="https://github.com/CCI-Tools/cate/issues" target="_blank" rel="noopener noreferrer">issue tracker</a>.</span>
                    <Checkbox label='Copy error report to clipboard'
                              checked={this.state.copyReport}
                              onChange={this.handleCopyReport}/>
                </div>
            );
        }

        const icon = getJobFailureIconName(this.props.jobFailure) as IconName;
        let iconIntent;
        if (isUserError(this.props.jobFailure)) {
            iconIntent = Intent.PRIMARY;
        } else {
            iconIntent = Intent.WARNING;
        }

        return (
            <div style={{display: 'flex'}}>
                <div style={{fontSize: '4em', flex: '0 1 1em'}}>
                    <Icon icon={icon} intent={iconIntent} iconSize={48}/>
                </div>
                <div style={{flex: '1 1 90%', marginLeft: '1em'}}>
                    {messageDiv}
                    {traceback}
                    {reporting}
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(JobFailureDialog);
