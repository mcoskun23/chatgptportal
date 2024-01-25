import BaseController from "./BaseController";
import { createModel } from "../model/models";
import Fragment from "sap/ui/core/Fragment";
import SelectDialog from "sap/m/SelectDialog";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageToast from "sap/m/MessageToast";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Event from "sap/ui/base/Event";
import Wizard from "sap/m/Wizard";
import WizardStep from "sap/m/WizardStep";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class Create extends BaseController {

    _projectDialog: Promise<SelectDialog>;
    _developmentDialog: Promise<SelectDialog>;
    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.getRouter()?.getRoute("create")?.attachPatternMatched(this._onMatched, this);
    }

    private _onMatched() {
        this.setModel(createModel(), "model");

        (this.byId("wizard") as Wizard).setCurrentStep(this.byId("step1") as WizardStep);

    }

    private onPressProject() {

        if (!this._projectDialog) {
            this._projectDialog = Fragment.load({
                name: "com.ntt.chatgptportal.view.fragment.ShProject",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as SelectDialog);
                return dialog;
            }) as Promise<SelectDialog>;
        }

        this._projectDialog.then((dialog) => {
            dialog.open('');
        });

    }

    private onProjectConfirm(event: Event) {
        const model = this.getModel<JSONModel>("model"),
            _q = event.getParameter("selectedItem").getBindingContext().getObject();

        model.setProperty("/Projectid", _q.Projectid);
        model.setProperty("/Projecttxt", _q.Projecttxt);

        //clear
        model.setProperty("/Developmentid", "");
        model.setProperty("/Developmenttxt", "");
    }

    private onPressDevelopment() {
        const projId: string = this.getModel<JSONModel>("model").getProperty("/Projectid");

        if (projId === "") {
            MessageToast.show(this.getResourceBundle().getText("ProjidMsg") as string);
            return;
        }

        if (!this._developmentDialog) {
            this._developmentDialog = Fragment.load({
                name: "com.ntt.chatgptportal.view.fragment.ShDevelopment",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as SelectDialog);
                return dialog;
            }) as Promise<SelectDialog>;
        }

        this._developmentDialog.then((dialog) => {
            this._readDevelopment(dialog, projId);
        });

    }

    private onDevelopmentConfirm(event: Event) {
        const model = this.getModel<JSONModel>("model"),
            _q = event.getParameter("selectedItem").getBindingContext().getObject();

        model.setProperty("/Developmentid", _q.Developmentid);
        model.setProperty("/Developmenttxt", _q.Developmenttxt);
    }

    private onSearch() {
        const model = this.getModel<JSONModel>("model"),
            projId = model.getProperty("/Projectid"),
            devId = model.getProperty("/Developmentid"),
            proType = model.getProperty("/ProcessType");

        if (projId !== "" && devId !== "")
            this._readHeader(projId, devId, proType);
        else
            MessageToast.show(this.getResourceBundle().getText("FilterMsg") as string);
    }

    private onPressAddParam() {

    }

    private onPressDeleteParam() {

    }

    private _readDevelopment(dialog: SelectDialog, projId: string) {
        const filters: Array<Filter> = [new Filter("Projectid", FilterOperator.EQ, projId)];

        BusyIndicator.show();
        this.getModel<ODataModel>().read("/ShDevelopmentSet", {
            filters: filters,
            success: (response: any) => {
                // @ts-ignore
                const template = dialog.getBindingInfo("items").template;
                // @ts-ignore
                dialog.unbindAggregation("items");

                dialog.setModel(new JSONModel(response.results));
                dialog.bindAggregation("items", {
                    path: "/",
                    template: template,
                    templateShareable: true
                });

                dialog.open('');
                BusyIndicator.hide();
            }
        });

    }

    private _readHeader(projId: string, devId: string, proType: string) {
        const path = this.getModel<ODataModel>().createKey("HeaderSet", {
            Projectid: projId,
            Developmentid: devId,
            ProcessType: proType,
        });

        this.getModel<ODataModel>().read(`/${path}`, {
            success: (response: any) => {

            }
        });
    }
}