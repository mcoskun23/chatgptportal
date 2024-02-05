import ColumnListItem from "sap/m/ColumnListItem";
import { formatStatus, formatStatusText, formatDate, formatTime } from "../model/formatter";
import { DocumentTypeEnum } from "../model/models";
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

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class AbapToFs extends BaseController {
    public readonly formatter = {
        formatStatus, formatStatusText, formatDate, formatTime
    };

    _docNo: string;
    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.getRouter()?.getRoute("abaptofs")?.attachPatternMatched(this._onMatched, this);
    }

    private _onMatched() {

    }

    private onItemPress(event: Event) {
        const listItem = event.getSource() as ColumnListItem,
            selected = !listItem.getSelected();

        listItem.setSelected(selected);
    }

    private onPressOpenDialog(event: Event, type: string) {
        let _q = (event.getSource() as ManagedObject).getBindingContext()?.getObject();

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

        if (type === DocumentTypeEnum.AbapToTs) // @ts-ignore
            this.openTSDialog(DocumentTypeEnum.AbapToTs, _q.Devpackage, _q.Devprogram);
        else // @ts-ignore
            this.openFSDialog(_q.Devpackage, _q.Devprogram);
    }

    private openFSDialog(packageName: string, programName: string) {
        if (!this._fsDialog) {
            this._fsDialog = Fragment.load({
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


    private onPressCreate(abapToTs: boolean) {
        this._createQuery(abapToTs);
    }

    private onPressUpdate(abapToTs: boolean) {
        MessageBox.confirm(this.getResourceBundle().getText("SaveMsg") as string, {
            actions: [this.getResourceBundle().getText("Save") as string,
            this.getResourceBundle().getText("Close") as string],
            onClose: (action: string) => {
                if (this.getResourceBundle().getText("Save") as string === action) {
                    const query = (sap.ui.getCore().byId("report") as TextArea).getValue();
                    this._updateQuery(abapToTs, query);
                }
            }
        });
    }

    private onPressDoc(event: Event) {
        const _q = (event.getSource() as Button).getBindingContext()?.getObject();

        // @ts-ignore
        this._readQuery((_q.Doctype === DocumentTypeEnum.AbapToTs), _q.Docno);
    }

    private _readQuery(abapToTs: boolean, docNo: string) {
        const model = this.getModel<JSONModel>("abapModel"),
            type = (abapToTs) ? DocumentTypeEnum.AbapToTs : DocumentTypeEnum.AbapToFs,
            path = this.getModel<ODataModel>().createKey("AbapQuerySet", {
                Devpackage: model.getProperty("/Devpackage"),
                Devprogram: model.getProperty("/Devprogram"),
                IvDoctype: type,
                Docno: docNo
            });

        BusyIndicator.show();
        this.getModel<ODataModel>().read(`/${path}`, {
            success: (response: any) => {
                this._docNo = docNo;
                (sap.ui.getCore().byId("report") as TextArea).setValue(response.EvQuery);
                BusyIndicator.hide();
            }
        });
    }

    private _createQuery(abapToTs: boolean, docNo?: string) {
        const model = this.getModel<JSONModel>("abapModel"),
            type = (abapToTs) ? DocumentTypeEnum.AbapToTs : DocumentTypeEnum.AbapToFs,
            _q = {
                Devpackage: model.getProperty("/Devpackage"),
                Devprogram: model.getProperty("/Devprogram"),
                IvDoctype: type,
                Docno: docNo
            };

        this.openBusyDialog();
        this.getModel<ODataModel>().create(`/AbapQuerySet`, _q, {
            success: (response: any) => {
                this._readDocuments(type);
                (sap.ui.getCore().byId("report") as TextArea).setValue(response.EvQuery);
                this.closeBusyDialog();
            }
        });
    }

    private _updateQuery(abapToTs: boolean, query: string) {
        const model = this.getModel<JSONModel>("abapModel"),
            type = (abapToTs) ? DocumentTypeEnum.AbapToTs : DocumentTypeEnum.AbapToFs,
            _q = {
                Devpackage: model.getProperty("/Devpackage"),
                Devprogram: model.getProperty("/Devprogram"),
                IvDoctype: type,
                Docno: this._docNo
            },
            path = this.getModel<ODataModel>().createKey("AbapQuerySet", _q);

        // @ts-ignore
        _q.EvQuery = query;

        BusyIndicator.show();
        this.getModel<ODataModel>().update(`/${path}`, _q, {
            success: (response: any) => {
                // (sap.ui.getCore().byId("report") as TextArea).setValue(response.EvQuery);
                this._readDocuments(type);
                this.createSuccessDialog();
                BusyIndicator.hide();
            }
        });
    }
}