import ColumnListItem from "sap/m/ColumnListItem";
import { formatStatus, formatStatusText } from "../model/formatter";
import { DocumentTypeEnum } from "../model/models";
import BaseController from "./BaseController";
import Event from "sap/ui/base/Event";
import ManagedObject from "sap/ui/base/ManagedObject";
import Table from "sap/m/Table";
import MessageToast from "sap/m/MessageToast";
import Dialog from "sap/m/Dialog";
import Fragment from "sap/ui/core/Fragment";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class AbapToFs extends BaseController {
    public readonly formatter = {
        formatStatus, formatStatusText
    };
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
}