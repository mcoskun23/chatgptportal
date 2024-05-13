import ColumnListItem from "sap/m/ColumnListItem";
import { formatStatus, formatStatusText, formatDate, formatTime, formatText } from "../model/formatter";
import { DocumentTypeEnum, createViewModel } from "../model/models";
import BaseController from "./BaseController";
import Event from "sap/ui/base/Event";
import ManagedObject from "sap/ui/base/ManagedObject";
import Table from "sap/m/Table";
import MessageToast from "sap/m/MessageToast";
import Dialog from "sap/m/Dialog";
import Fragment from "sap/ui/core/Fragment";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import TextArea from "sap/m/TextArea";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import Button from "sap/m/Button";
import Context from "sap/ui/model/Context";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";

declare global {
    /**
     * Now declare things that go in the global namespace,
     * or augment existing declarations in the global namespace.
     */
    type Summarize = {
        Query: string;
        Programs: Array<Program>
    }

    type Program = {
        Devpackage: string;
        Devprogram: string;
        Projectid: string;
    }
}

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class AbapToFs extends BaseController {
    public readonly formatter = {
        formatStatus, formatStatusText, formatDate, formatTime, formatText
    };

    _docNo: string;
    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.getRouter()?.getRoute("abaptofs")?.attachPatternMatched(this._onMatched, this);
    }

    private _onMatched() {
        this.setModel(createViewModel(), "viewModel");
    }

    private onPressSummarize() {
        const table = this.byId("innerTable") as Table,
            contexts = table.getSelectedContexts() as Context[];

        if (contexts.length < 1) {
            MessageToast.show(this.getResourceBundle().getText("SelectMsg") as string);
            return;
        }

        const programs = contexts.map(x => {
            const _q = x.getObject() as Program;
            return {
                Devpackage: _q.Devpackage,
                Devprogram: _q.Devprogram
            }
        }) as Array<Program>;

        this._createSummarize(programs);
    }

    private onItemPress(event: Event) {
        const listItem = event.getSource() as ColumnListItem,
            selected = !listItem.getSelected();

        listItem.setSelected(selected);
    }

    private onPressOpenDialog(event: Event, type: string) {
        let _q: any = (event.getSource() as ManagedObject).getBindingContext()?.getObject();

        if (!_q) {
            const items = (this.byId("innerTable") as Table).getSelectedItems();

            if (items.length === 0) {
                MessageToast.show(this.getResourceBundle().getText("SelectMsg") as string);
                return;
            } else if (items.length > 1) {
                MessageToast.show(this.getResourceBundle().getText("SelectOneFieldMsg") as string);
                return;
            }

            _q = items[0].getBindingContext()?.getObject();
        }

        this.setModel(new JSONModel(_q), "abapModel");

        if (type === DocumentTypeEnum.AbapToFs)
            this.openFSDialog(_q.Devpackage, _q.Devprogram);
        else if (type === DocumentTypeEnum.AbapToTs)
            this.openTSDialog(DocumentTypeEnum.AbapToTs, _q.Devpackage, _q.Devprogram);
        else if (type === DocumentTypeEnum.EccToHana)
            this.openHanaDialog(_q.Devpackage, _q.Devprogram);
    }

    private openFSDialog(packageName: string, programName: string) {
        if (!this._fsDialog) {
            this._fsDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.FsDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._fsDialog.then((dialog) => {
            dialog.open();
            this._readDocuments(DocumentTypeEnum.AbapToFs, undefined, packageName, programName);
        });
    }

    private openHanaDialog(packageName: string, programName: string) {
        if (!this._hanaDialog) {
            this._hanaDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.HanaDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._hanaDialog.then((dialog) => {
            dialog.open();
            this._readDocuments(DocumentTypeEnum.EccToHana, undefined, packageName, programName);
        });
    }

    private onPressAddParam(property: string) {
        const model = this.getModel<JSONModel>("model"),
            parameters = model.getProperty(`/${property}`),
            _q: any = {
                PropName: "",
                PropVal: "01"
            };

        parameters.push(_q);

        model.setProperty(`/${property}`, parameters);
    }

    private onPressDeleteParam(event: Event, property: string) {
        const _q: any = (event.getSource() as ManagedObject).getBindingContext("model")?.getObject(),
            model = this.getModel<JSONModel>("model"),
            parameters = model.getProperty(`/${property}`),
            filteredParams = parameters.filter((x: any) => (x.PropName !== _q.PropName ||
                x.PropVal !== _q.PropVal));

        model.setProperty(`/${property}`, filteredParams);
    }

    private onPressCreate(type: DocumentTypeEnum) {

        type = (typeof type == "boolean") ? DocumentTypeEnum.AbapToTs : type;

        this._createQuery(type);
    }

    private onPressUpdate() {

        MessageBox.confirm(this.getResourceBundle().getText("SaveMsg") as string, {
            actions: [this.getResourceBundle().getText("Save") as string,
            this.getResourceBundle().getText("Close") as string],
            onClose: (action: string) => {
                if (this.getResourceBundle().getText("Save") as string === action) {
                    try {
                        const model = this.getModel<JSONModel>("model").getData();
                        this._updateQuery(this._type, JSON.stringify(model));
                    } catch (error) {
                        console.log(error);
                        MessageBox.error(this.getResourceBundle().getText("errorText") as string);
                    }

                }
            }
        });
    }

    private onPressDoc(event: Event) {
        const _q: any = (event.getSource() as Button).getBindingContext()?.getObject();

        this._readQuery(_q.Doctype, _q.Docno, _q.Doclangu);
    }

    private _readQuery(type: DocumentTypeEnum, docNo: string, langu: string) {
        // @ts-ignore
        const key = this.byId("smartFilterBar").getControlByKey("Projectid").getValue();

        this._type = type;

        const model = this.getModel<JSONModel>("abapModel"),
            path = this.getModel<ODataModel>().createKey("AbapQuerySet", {
                Devpackage: model.getProperty("/Devpackage"),
                Devprogram: model.getProperty("/Devprogram"),
                IvDoctype: type,
                Docno: docNo,
                Projectid: key,
                Doclangu: langu
            });

        BusyIndicator.show();
        this.getModel<ODataModel>().read(`/${path}`, {
            success: (response: any) => {
                this._docNo = docNo;
                // (this.byId("report") as TextArea).setValue(response.EvQuery);
                this._createDynamicForm(response.EvQuery);
                BusyIndicator.hide();
            }
        });
    }

    private _createQuery(type: DocumentTypeEnum, docNo?: string) {
        // @ts-ignore
        const key = this.byId("smartFilterBar").getControlByKey("Projectid").getValue();

        const model = this.getModel<JSONModel>("abapModel"),
            packageName = model.getProperty("/Devpackage"),
            programName = model.getProperty("/Devprogram"),
            _q = {
                Devpackage: packageName,
                Devprogram: programName,
                IvDoctype: type,
                Docno: docNo,
                Projectid: key,
                Doclangu: sap.ui.getCore().getConfiguration().getLanguage()
            };

        this.openBusyDialog();
        this.getModel<ODataModel>().create(`/AbapQuerySet`, _q, {
            success: (response: any) => {
                // @ts-ignore
                this.byId("smartTable").rebindTable();
                this._readDocuments(type, undefined, packageName, programName);
                this._createDynamicForm(response.EvQuery);
                // (this.byId("report") as TextArea).setValue(response.EvQuery);
                this.closeBusyDialog();
            }
        });
    }

    private _updateQuery(type: DocumentTypeEnum, query: string) {
        // @ts-ignore
        const key = this.byId("smartFilterBar").getControlByKey("Projectid").getValue();

        const model = this.getModel<JSONModel>("abapModel"),
            packageName = model.getProperty("/Devpackage"),
            programName = model.getProperty("/Devprogram"),
            _q = {
                Devpackage: packageName,
                Devprogram: programName,
                IvDoctype: type,
                Docno: this._docNo,
                Projectid: key,
                Doclangu: sap.ui.getCore().getConfiguration().getLanguage()
            },
            path = this.getModel<ODataModel>().createKey("AbapQuerySet", _q);

        // @ts-ignore
        _q.EvQuery = query;

        BusyIndicator.show();
        this.getModel<ODataModel>().update(`/${path}`, _q, {
            success: (response: any) => {
                // (this.byId("report") as TextArea).setValue(response.EvQuery);
                this._readDocuments(type, undefined, packageName, programName);
                // this.createSuccessDialog();
                MessageBox.success(this.getResourceBundle().getText("successMsg") as string);
                BusyIndicator.hide();
            }
        });
    }

    private _createSummarize(programs: Array<Program>) {
        // @ts-ignore
        const key = this.byId("smartFilterBar").getControlByKey("Projectid").getValue();

        const data = {
            Query: "",
            Projectid: key,
            Programs: programs
        } as Summarize;

        this.openBusyDialog();
        this.getModel<ODataModel>().create("/SummarizeSet", data, {
            success: (response: any) => {
                this.closeBusyDialog();
                const _q = JSON.parse(response.Query),
                    queryKeys = Object.keys(_q);

                let query = "";
                queryKeys.forEach(e => {
                    query += `${e}\u000a${this.formatter.formatText(_q[e], this.getResourceBundle())}\u000a`;
                });

                MessageBox.information(query);
            }
        });
    }
}