import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import AppComponent from "../Component";
import Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Router from "sap/ui/core/routing/Router";
import History from "sap/ui/core/routing/History";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import View from "sap/ui/core/mvc/View";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import Event from "sap/ui/base/Event";
import FilterOperator from "sap/ui/model/FilterOperator";
import Filter from "sap/ui/model/Filter";
import Table from "sap/m/Table";
import Fragment from "sap/ui/core/Fragment";
import { DocumentTypeEnum, FeedBack, Regenerate } from "../model/models";
import Text from "sap/m/Text";
import Image from "sap/m/Image";
import TextArea from "sap/m/TextArea";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import Label from "sap/m/Label";
import UI5Element from "sap/ui/core/Element";
import ScrollContainer from "sap/m/ScrollContainer";
import OverflowToolbar from "sap/m/OverflowToolbar";
import List from "sap/m/List";
import InputListItem from "sap/m/InputListItem";
import Select from "sap/m/Select";
import Item from "sap/ui/core/Item";
import ColumnListItem from "sap/m/ColumnListItem";
import Column from "sap/m/Column";
import Toolbar from "sap/m/Toolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import Input from "sap/m/Input";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default abstract class BaseController extends Controller {


    _successDialog: Dialog
    _fsDialog: Promise<Dialog>;
    _tsDialog: Promise<Dialog>;
    _abapDialog: Promise<Dialog>;
    _busyDialog: Promise<Dialog>;
    _feedbackDialog: Promise<Dialog>;
    _regenerateDialog: Promise<Dialog>;
    _docNo: string;
    _type: DocumentTypeEnum;
    _jsonString: string;
    /**
     * Convenience method for accessing the component of the controller's view.
     * @returns The component of the controller's view
     */
    public getOwnerComponent(): AppComponent {
        return super.getOwnerComponent() as AppComponent;
    }

    /**
     * Convenience method to get the components' router instance.
     * @returns The router instance
     */
    public getRouter(): Router {
        return UIComponent.getRouterFor(this);
    }

    /**
     * Convenience method for getting the i18n resource bundle of the component.
     * @returns The i18n resource bundle of the component
     */
    protected getResourceBundle(): ResourceBundle {
        return (this.getOwnerComponent().getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle;
    }

    public geti18nText(text: string): string {
        // @ts-ignore
        return this.getResourceBundle().getText(text);
    }

    /**
     * Convenience method for getting the view model by name in every controller of the application.
     * @param [sName] The model name
     * @returns The model instance
     */
    protected getModel<T extends Model>(name?: string): T {
        return this.getView()!.getModel(name) as T;
    }

    /**
     * Convenience method for setting the view model in every controller of the application.
     *
     * @param model the model instance
     * @param name the model name
     * @returns the view instance
     */
    protected setModel(model: Model, name: string): View {
        return this.getView()!.setModel(model, name);
    }

    /**
     * Convenience method for triggering the navigation to a specific target.
     * @public
     * @param sName Target name
     * @param [oParameters] Navigation parameters
     * @param [bReplace] Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
     */
    public navTo(sName: string, oParameters?: object, bReplace?: boolean) {
        this.getRouter().navTo(sName, oParameters, undefined, bReplace);
    }

    /**
     * Convenience event handler for navigating back.
     * It there is a history entry we go one step back in the browser history
     * If not, it will replace the current entry of the browser history with the main route.
     */
    public onNavBack() {
        const sPreviousHash = History.getInstance().getPreviousHash();
        if (sPreviousHash !== undefined) {
            window.history.go(-1);
        } else {
            this.getRouter().navTo("main", {}, undefined, true);
        }
    }

    public onPressEdit(isEdit: boolean) {
        this.getModel<JSONModel>("viewModel").setProperty("/edit", isEdit);

        if (!isEdit) {
            this._createDynamicForm();
        } else {
            setTimeout(() => {
                (this.byId("scrollCont") as ScrollContainer).scrollToElement(this.byId("toolbar") as OverflowToolbar);
            }, 5);
        }


    }

    public onPressCopy(event: Event) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this._createCopyText());
        }
    }

    public _createCopyText(): string {
        const form = this.byId("form") as SimpleForm;
        const data = this.getModel<JSONModel>("model").getData()
        const content = form.getContent();

        let copyText = "";

        Object.keys(data).forEach((e: any) => {

            if (e === "TsReport") {
                const inlineKeys: string[] = Object.keys(data[e]);
                inlineKeys.forEach(x => {
                    copyText += "\u000a" + x + "\u000a";
                    copyText += this._formatValue(data[e][x]);
                });
            } else {
                copyText += "\u000a" + e + "\u000a";
                copyText += this._formatValue(data[e]);
            }
        });

        // if (Array.isArray(content)) {
        //     for (const control of content) {
        //         if (control instanceof TextArea) {
        //             copyText += control.getValue() + "\u000a";
        //         } else if (control instanceof Label) {
        //             copyText += control.getText() + "\u000a";
        //         } else if (control instanceof Table) {
        //             // copyText += control.getText() + "\u000a";
        //             debugger;
        //         }
        //     }
        // }

        return copyText;
    }

    public _createDynamicForm(report?: string, isTs?: boolean) {
        this.getModel<JSONModel>("viewModel").setProperty("/report", true);
        this.getModel<JSONModel>("viewModel").setProperty("/edit", false);
        this.getModel<JSONModel>("viewModel").setProperty("/isTs", false);

        if (!report) {
            report = this._jsonString;
        } else {
            this._jsonString = report;
        }

        const form = this.byId("form") as SimpleForm,
            txtForm = this.byId("txtForm") as TextArea,
            _q: Record<string, any> = JSON.parse(report),
            keys: string[] = Object.keys(_q);

        this.setModel(new JSONModel(_q), "model");


        // form.removeAllContent();

        // keys.forEach(e => {
        //     if (e === "TsReport") {
        //         const inlineKeys: string[] = Object.keys(_q[e]);
        //         inlineKeys.forEach(x => {
        //             const [label, textArea] = this._createFormItem(x, _q[e][x]);
        //             form.addContent(label);
        //             form.addContent(textArea);
        //         });
        //     } else {
        //         if (e === "LoginScreenParameters" || e === "Lists" ||
        //             e === "Formulas") {
        //             const [label, table] = this._createFormTable(e, _q[e]);
        //             form.addContent(label);
        //             form.addContent(table);
        //         } else {
        //             const [label, textArea] = this._createFormItem(e, _q[e]);
        //             form.addContent(label);
        //             form.addContent(textArea);

        //         }
        //     }
        // });


        txtForm.setValue(this._createCopyText());

        setTimeout(() => {
            (this.byId("scrollCont") as ScrollContainer).scrollToElement(this.byId("toolbar") as OverflowToolbar);
        }, 5);

    }

    private _createFormItem(key: string, value: any): [Label, TextArea] {

        const label = new Label({ text: key }),
            textAreaValue: string = this._formatValue(value),
            textArea = new TextArea({ value: textAreaValue, growing: true, growingMaxLines: 1000000, width: "100%" });

        return [label, textArea];
    }

    public _createFormTable(key: string, value: any): [Label, Table] {
        const label = new Label({ text: key }),
            table = new Table({
                headerToolbar: new Toolbar({
                    content: [
                        new ToolbarSpacer(),
                        new Button({
                            text: "Add",
                            icon: "sap-icon://sys-add",
                            type: "Emphasized"
                        })
                    ]
                }),
                columns: [
                    new Column({
                        header: new Text({
                            text: "Column1"
                        })
                    }),
                    new Column({
                        header: new Text({
                            text: "Column2"
                        })
                    }),
                    new Column({
                        header: new Text(),
                        hAlign: "End"
                    })
                ],
                items: [
                    new ColumnListItem({
                        cells: [
                            new Input({
                                value: "123"
                            }),
                            new Select({
                                selectedKey: "01",
                                items: [
                                    new Item({ key: "01", text: "Opsiyonel" }),
                                    new Item({ key: "02", text: "Zorunlu" })
                                ]
                            }),
                            new Button({ icon: "sap-icon://delete", type: "Reject" })
                        ]
                    }),
                    new ColumnListItem({
                        cells: [
                            new Input({
                                value: "123"
                            }),
                            new Select({
                                items: [
                                    new Item({ key: "01", text: "Opsiyonel" }),
                                    new Item({ key: "02", text: "Zorunlu" })
                                ]
                            }),
                            new Button({ icon: "sap-icon://delete", type: "Reject" })
                        ]
                    }),
                    new ColumnListItem({
                        cells: [
                            new Input({
                                value: "123"
                            }),
                            new Input({
                                value: "123"
                            }),
                            new Button({ icon: "sap-icon://delete", type: "Reject" })
                        ]
                    })
                ]
            });

        return [label, table];

    }

    public _formatValue(value: string): string {
        value = Array.isArray(value) ? value.map(x => {
            if (x.PropName) {
                return `${x.PropName}:${(x.PropVal) === "01" ? "Opsiyonel" : x.PropVal === "02" ? "Zorunlu" : x.PropVal}`;
            }
            else
                return x;
        }).join("\u000a") : value;

        return value;
    }

    public _formatToJson(type: string): string {
        const form = this.byId("form") as SimpleForm;
        const content = form.getContent();
        const json: Record<string, any> = {};

        if (type === "TsReport") {
            json[type] = {};
        }

        if (Array.isArray(content)) {
            for (let i = 0; i < content.length; i += 2) {
                const label = content[i] as Label;
                const valueControl = content[i + 1];

                if (label instanceof Label) {
                    const labelText = label.getText(); // @ts-ignore
                    const value = valueControl.getValue().trim();
                    const splitValue = value.split("\u000a");

                    if (labelText === "TimeEstimation") {
                        json[labelText] = value;
                    } else if (type === "TsReport") {
                        json[type][labelText] = splitValue;
                    } else {
                        json[labelText] = splitValue;
                    }
                }
            }
        }

        return JSON.stringify(json);
    }

    private onPressDownload(event: Event) {
        const _q: any = (event.getSource() as ManagedObject).getBindingContext()?.getObject(),
            path: string = this.getModel<ODataModel>().createKey("FileSet", {
                Docno: _q.Docno,
                Doctype: _q.Doctype

            }) + "/$value",
            service: string = this.getOwnerComponent().getManifestObject().getEntry("/sap.app").dataSources.mainService.uri;

        window.open(service + path)
    }

    public onPressClose(event: Event) {
        const form = this.byId("form") as SimpleForm;
        form.setVisible(false);

        const dialog = ((event.getSource() as ManagedObject).getParent() as Dialog);
        dialog.close();
        dialog.destroy();

        // @ts-ignore
        this._tsDialog = undefined; // @ts-ignore
        this._abapDialog = undefined; // @ts-ignore
        this._fsDialog = undefined;  // @ts-ignore

        this._type = "";
    }

    public openTSDialog(type: DocumentTypeEnum, packageName?: string, programName?: string) {

        if (!this._tsDialog) {
            this._tsDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.TsDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._type = type;

        this._tsDialog.then((dialog) => {
            this.getView()?.addDependent(dialog as Dialog);
            if (DocumentTypeEnum.AbapToTs)
                this._readDocuments(type, undefined, packageName, programName);
            else
                this._readDocuments(type);
            dialog.open();
        });

    }

    public createSuccessDialog() {

        if (!this._successDialog) {
            this._successDialog = new Dialog({
                type: "Message",
                title: this.getResourceBundle().getText("Success"),
                content: [
                    // new IllustratedMessage({ illustrationType: "sapIllus-SuccessHighFive" }),
                ],
                buttons: [
                    new Button({
                        text: this.getResourceBundle().getText("Close"),
                        press: (event: Event) => {
                            ((event.getSource() as ManagedObject).getParent() as Dialog).close()
                        }
                    })
                ]
            });
        }

        this._successDialog.open();
    }


    public openBusyDialog() {
        if (!this._busyDialog) {
            this._busyDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.BusyDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._busyDialog.then((dialog) => {
            const text = this.byId("text") as Text,
                image = this.byId("image") as Image;
            let index = 2;
            const interval = setInterval(() => {
                if (index === 5)
                    clearInterval(interval);
                else {
                    text.setText(this.getResourceBundle().getText(`BusyText${index}`) as string);
                    index++;
                }
            }, 7500);

            // @ts-ignore
            image.setSrc(loadingImg);

            this.getView()?.setBusy(true);
            dialog.open();
        });
    }

    public closeBusyDialog() {
        this._busyDialog.then((dialog) => {
            this.getView()?.setBusy(false);
            dialog.close()
            dialog.destroy(); // @ts-ignore
            this._busyDialog = undefined;
        });
    }

    public handleEscape() {

    }

    private onPressFeedback(type?: DocumentTypeEnum) {
        this._type = (type) ? type : this._type;

        if (!this._docNo) {
            MessageToast.show(this.getResourceBundle().getText("DocMsg") as string)
            return;
        }

        if (!this._feedbackDialog) {
            this._feedbackDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.FeedbackDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._feedbackDialog.then((dialog) => {
            dialog.open();
        });
    }

    private onPressCloseFB() {
        this._feedbackDialog.then((dialog) => {
            dialog.close();
            dialog.destroy();
            // @ts-ignore
            this._feedbackDialog = undefined;
        });
    }

    private onPressRegenerate(type?: DocumentTypeEnum) {
        this._type = (type) ? type : this._type;

        if (!this._docNo) {
            MessageToast.show(this.getResourceBundle().getText("DocMsg") as string)
            return;
        }

        if (!this._regenerateDialog) {
            this._regenerateDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.RegenerateDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._regenerateDialog.then((dialog) => {
            dialog.open();
        });
    }

    private onPressCloseRG() {
        this._regenerateDialog.then((dialog) => {
            dialog.close();
            dialog.destroy();
            // @ts-ignore
            this._regenerateDialog = undefined;
        });
    }

    public _readDocuments(type: DocumentTypeEnum, dialog?: Dialog, packageName?: string, programName?: string) {
        this.getModel<JSONModel>("viewModel").setProperty("/report", false);
        this.getModel<JSONModel>("viewModel").setProperty("/edit", false);

        const data = this.getModel<JSONModel>("fsModel")?.getData();

        let filters: Array<Filter> = [new Filter("Doctype", FilterOperator.EQ, type)];

        if (data) {
            filters.push(new Filter("Projectid", FilterOperator.EQ, data.Projectid),
                new Filter("Developmentid", FilterOperator.EQ, data.Developmentid),
                new Filter("ProcessType", FilterOperator.EQ, data.ProcessType)
            );
        }

        if (packageName)
            filters.push(new Filter("Devpackage", FilterOperator.EQ, packageName));

        if (programName)
            filters.push(new Filter("Devprogram", FilterOperator.EQ, programName));

        BusyIndicator.show();
        this.getModel<ODataModel>().read("/DocumentsSet", {
            filters: filters,
            success: (response: any) => {
                const table = (dialog) ? dialog : this.byId("docTable") as Table,
                    // @ts-ignore
                    template = table.getBindingInfo("items").template;    // @ts-ignore
                table.unbindAggregation("items");

                table?.setModel(new JSONModel(response.results));
                table?.bindAggregation("items", {
                    path: "/",
                    template: template,
                    templateShareable: true
                });

                BusyIndicator.hide();
            }
        });
    }

    private onCreateReg() {

        const fsModel = this.getModel<JSONModel>("fsModel"),
            abapModel = this.getModel<JSONModel>("abapModel"),
            regenerate: Regenerate = {
                Doctype: this._type,
                Docno: this._docNo,
                Developmentid: (fsModel) ? fsModel.getProperty("/Developmentid") : "",
                Projectid: (fsModel) ? fsModel.getProperty("/Projectid") : "",
                ProcessType: (fsModel) ? fsModel.getProperty("/ProcessType") : "",
                Devpackage: (abapModel) ? abapModel.getProperty("/Devpackage") : "",
                Devprogram: (abapModel) ? abapModel.getProperty("/Devprogram") : "",
                Feedback: (this.byId("feedback") as TextArea).getValue()
            }

        this._cfRegenerate(regenerate);
    }

    private onSaveFB() {

        const fsModel = this.getModel<JSONModel>("fsModel"),
            abapModel = this.getModel<JSONModel>("abapModel"),
            feedBack: FeedBack = {
                Doctype: this._type,
                Docno: this._docNo,
                Content: (this.byId("content") as TextArea).getValue(),
                Developmentid: (fsModel) ? fsModel.getProperty("/Developmentid") : "",
                Projectid: (fsModel) ? fsModel.getProperty("/Projectid") : "",
                ProcessType: (fsModel) ? fsModel.getProperty("/ProcessType") : "",
                Devpackage: (abapModel) ? abapModel.getProperty("/Devpackage") : "",
                Devprogram: (abapModel) ? abapModel.getProperty("/Devprogram") : "",
            }

        this._cfFeedBack(feedBack);
    }

    public _cfFeedBack(feedBack: FeedBack) {

        BusyIndicator.show();
        this.getModel<ODataModel>().callFunction("/Feedback", {
            "method": "POST",
            urlParameters: feedBack,
            success: (response: any) => {
                MessageToast.show(this.getResourceBundle().getText("Success") as string);
                this.onPressCloseFB();
                BusyIndicator.hide();
            }
        });
    }

    public _cfRegenerate(regenerate: Regenerate) {

        this.openBusyDialog();
        this.getModel<ODataModel>().callFunction("/Regenerate", {
            "method": "POST",
            urlParameters: regenerate,
            success: (response: any) => {
                // (this.byId("report") as TextArea).setValue(response.Query);
                this._createDynamicForm(response.Query);
                this.onPressCloseRG();
                this.closeBusyDialog();
            }
        });
    }

}