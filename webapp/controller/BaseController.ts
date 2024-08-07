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
import MessageToast from "sap/m/MessageToast";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import ScrollContainer from "sap/m/ScrollContainer";
import OverflowToolbar from "sap/m/OverflowToolbar";
import { formatText } from "../model/formatter";
import MessageBox from "sap/m/MessageBox";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default abstract class BaseController extends Controller {

    public readonly formatter = {
        formatText
    };

    _successDialog: Dialog
    _fsDialog: Promise<Dialog>;
    _tsDialog: Promise<Dialog>;
    _abapDialog: Promise<Dialog>;
    _hanaDialog: Promise<Dialog>;
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
        const form = this.byId("form") as SimpleForm,
            data = this.getModel<JSONModel>("model").getData();

        let copyText = "";

        Object.keys(data).forEach((e: any) => {

            if (e === "TsReport") {
                const inlineKeys: string[] = Object.keys(data[e]);
                inlineKeys.forEach(x => {
                    copyText += "\u000a" + x + "\u000a";
                    copyText += this.formatter.formatText(data[e][x], this.getResourceBundle());
                });
            } else {
                copyText += "\u000a" + e + "\u000a";
                copyText += this.formatter.formatText(data[e], this.getResourceBundle());
            }
        });
        return copyText;
    }

    public _createDynamicForm(report?: string) {

        try {
            if (!report) {
                report = this._jsonString;
            } else {
                this._jsonString = report;
            }

            const txtForm = this.byId("txtForm") as Text,
                _q: Record<string, any> = JSON.parse(report),
                keys: string[] = Object.keys(_q);

            //show with space
            keys.forEach(e => {
                if (e === "TsReport") {
                    const inlineKeys: string[] = Object.keys(_q[e]);
                    inlineKeys.forEach(x => {
                        _q[e][x] = this.formatter.formatText(_q[e][x], this.getResourceBundle())
                    });
                } else if (e !== "LoginScreenParameters" && e !== "Lists" &&
                    e !== "Formulas") {
                    _q[e] = this.formatter.formatText(_q[e], this.getResourceBundle())
                }
            });

            const model = this.getModel<JSONModel>("viewModel");
            //clear
            model.setProperty("/report", true);
            model.setProperty("/edit", false);

            this.setModel(new JSONModel(_q), "model");

            txtForm.setText(this._createCopyText());

            setTimeout(() => {
                (this.byId("scrollCont") as ScrollContainer).scrollToElement(this.byId("toolbar") as OverflowToolbar);
            }, 5);

        } catch (error) {
            console.log(error);
            MessageBox.error(this.getResourceBundle().getText("errorText") as string);
        }
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
        this._hanaDialog = undefined; // @ts-ignore

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
                if (index === 6)
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
        // @ts-ignore
        const projectId = this.byId("smartFilterBar")?.getControlByKey("Projectid")?.getValue();

        if (projectId)
            filters.push(new Filter("Projectid", FilterOperator.EQ, projectId));

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
                Projectid: (fsModel) ? fsModel.getProperty("/Projectid") : abapModel.getProperty("/Projectid"),
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
                Projectid: (fsModel) ? fsModel.getProperty("/Projectid") : abapModel.getProperty("/Projectid"),
                ProcessType: (fsModel) ? fsModel.getProperty("/ProcessType") : "",
                Devpackage: (abapModel) ? abapModel.getProperty("/Devpackage") : "",
                Devprogram: (abapModel) ? abapModel.getProperty("/Devprogram") : "",
            }

        this._cfFeedBack(feedBack);
    }

    public _excelExport(tenant: string) {

        // @ts-ignore
        var workbook = XLSX.read(NttExcelSchema, { type: 'base64' })

        // @ts-ignore
        XLSX.writeFile(workbook, "SheetJSTable.xlsx");

        // this._spreadJS();

    }

    public async _spreadJS() {
        // @ts-ignore
        var spread = new GC.Spread.Sheets.Workbook(document.getElementById("ss"));
        // @ts-ignore
        var spread2 = new GC.Spread.Sheets.Workbook(document.getElementById("s2"));

        // @ts-ignore
        var excelIo = new GC.Spread.Excel.IO();
        // @ts-ignore
        const base64 = await fetch(NttExcelSchema);


        const blob = await base64.blob().then((blob) => {
            // console.log(blob);  
            excelIo.open(blob, (json: any) => {
                spread.fromJSON(json);
                // @ts-ignore
                var _json = JSON.stringify(spread.toJSON());

                excelIo.save(json, function (blob: any) {
                    // @ts-ignore
                    saveAs(blob, "FileName");
                }, function (e: any) {
                    if (e.errorCode == 1) {
                        alert(e.errorMessage);
                    }
                });

            },
                (message: any) => {
                    console.log(message);
                });
        });

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