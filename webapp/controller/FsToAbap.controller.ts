import BaseController from "./BaseController";
import { createModel, createViewModel, DocumentTypeEnum, ProcessTypeEnum } from "../model/models";
import Fragment from "sap/ui/core/Fragment";
import SelectDialog from "sap/m/SelectDialog";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageToast from "sap/m/MessageToast";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Event from "sap/ui/base/Event";
import ManagedObject from "sap/ui/base/ManagedObject";
import Wizard from "sap/m/Wizard";
import WizardStep from "sap/m/WizardStep";
import Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import DynamicPage from "sap/f/DynamicPage";
import Button from "sap/m/Button";
import TextArea from "sap/m/TextArea";
import { formatDate, formatTime, formatText } from "../model/formatter";


declare global {
    /**
     * Now declare things that go in the global namespace,
     * or augment existing declarations in the global namespace.
     */
    type Header = {
        Projectid: string,
        Projecttxt: string,
        Developmentid: string,
        Developmenttxt: string,
        ProcessType: ProcessTypeEnum,
        Reportheader: string,
        Devmodule: string,
        Devtype: string,
        Devreason: string,
        Devpurpose: string,
        Devprocedure: string,
        Authobj: string,
        EstTime: boolean,
        SapVer: string,
        Parameters: Array<ParamItem>,
        List: Array<ListItem>,
        Return: []
    }

    type ParamItem = {
        Fieldname: string;
        Fieldattribute: string;
    }

    type ListItem = {
        Fieldname: string;
        RetrievalType: string;
        Function: string;
    }
}

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class Create extends BaseController {

    public readonly formatter = {
        formatDate, formatTime, formatText
    };

    _projectDialog: Promise<SelectDialog>;
    _developmentDialog: Promise<SelectDialog>;
    _documentDialog: Promise<Dialog>;
    _docNo: string;

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.getRouter()?.getRoute("fstoabap")?.attachPatternMatched(this._onMatched, this);
    }

    private _onMatched() {
        this.setModel(createModel(), "fsModel");
        this.setModel(createViewModel(), "viewModel");

        this._clearModel();
    }

    private onPressProject() {

        if (!this._projectDialog) {
            this._projectDialog = Fragment.load({
                id: this.getView()?.getId(),
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
        const model = this.getModel<JSONModel>("fsModel"),
            _q = event.getParameter("selectedItem").getBindingContext().getObject();

        model.setProperty("/Projectid", _q.Projectid);
        model.setProperty("/Projecttxt", _q.Projecttxt);

        model.setProperty("/Developmentid", "");
        model.setProperty("/Developmenttxt", "");
        this._clearModel();
    }

    private onPressDevelopment() {
        const projId: string = this.getModel<JSONModel>("fsModel").getProperty("/Projectid");

        if (projId === "") {
            MessageToast.show(this.getResourceBundle().getText("ProjidMsg") as string);
            return;
        }

        if (!this._developmentDialog) {
            this._developmentDialog = Fragment.load({
                id: this.getView()?.getId(),
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
        const model = this.getModel<JSONModel>("fsModel"),
            _q = event.getParameter("selectedItem").getBindingContext().getObject();

        model.setProperty("/Developmentid", _q.Developmentid);
        model.setProperty("/Developmenttxt", _q.Developmenttxt);

        this._clearModel();
    }

    private onSearch() {
        const model = this.getModel<JSONModel>("fsModel"),
            projId = model.getProperty("/Projectid"),
            devId = model.getProperty("/Developmentid"),
            proType = model.getProperty("/ProcessType");

        if (projId !== "" && devId !== "") {
            this._readHeader(projId, devId, proType);
            this._clearModel();
        }
        else
            MessageToast.show(this.getResourceBundle().getText("FilterMsg") as string);
    }

    private onPressTS() {
        this.openTSDialog(DocumentTypeEnum.FsToTs);
    }

    private onPressDoc(event: Event) {
        const _q = (event.getSource() as Button).getBindingContext()?.getObject();

        // @ts-ignore
        this._readQuery((_q.Doctype === DocumentTypeEnum.FsToTs), _q.Docno, _q.Doclangu)
    }

    private onPressCreate(isFsToTs: boolean) {
        if (isFsToTs)
            this._createQuery(isFsToTs);
        else
            this.createDocumentDialog();
    }

    private onPressUpdate() {
        MessageBox.confirm(this.getResourceBundle().getText("SaveMsg") as string, {
            actions: [this.getResourceBundle().getText("Save") as string,
            this.getResourceBundle().getText("Close") as string],
            onClose: (action: string) => {
                if (this.getResourceBundle().getText("Save") as string === action) {
                    try {
                        const model = this.getModel<JSONModel>("model").getData();
                        this._updateQuery((this._type === DocumentTypeEnum.FsToTs), JSON.stringify(model));
                    } catch (error) {
                        console.log(error);
                        MessageBox.error(this.getResourceBundle().getText("errorText") as string);
                    }
                }
            }
        });
    }

    private onPressAbap() {
        if (!this._abapDialog) {
            this._abapDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.AbapDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._abapDialog.then((dialog) => {
            dialog.open();
            this._readDocuments(DocumentTypeEnum.TsToAbap);
        });
    }

    private onConfirmCreAbap(event: Event) {
        const docno = event.getParameter("selectedItem").getTitle();

        this._createQuery(false, docno);
    }

    private onSave() {
        MessageBox.confirm(this.getResourceBundle().getText("SaveMsg") as string, {
            actions: [this.getResourceBundle().getText("Save") as string,
            this.getResourceBundle().getText("Close") as string],
            onClose: (action: string) => {
                if (this.getResourceBundle().getText("Save") as string === action) {
                    const data = this.getModel<JSONModel>("fsModel").getData() as Header;
                    this._saveHeader(data);
                }
            }
        });
    }


    private onPressStep2() {
        this._readParameter();
    }

    private onPressAddParam() {
        const model = this.getModel<JSONModel>("fsModel"),
            parameters = model.getProperty("/Parameters"),
            _q: ParamItem = {
                Fieldname: "",
                Fieldattribute: "01"
            };

        parameters.push(_q);

        model.setProperty("/Parameters", parameters);
    }

    private onPressDeleteParam(event: Event) {
        const _q = (event.getSource() as ManagedObject).getBindingContext("fsModel")?.getObject() as ParamItem,
            model = this.getModel<JSONModel>("fsModel"),
            parameters = model.getProperty("/Parameters"),
            filteredParams = parameters.filter((x: ParamItem) => (x.Fieldname !== _q.Fieldname ||
                x.Fieldattribute !== _q.Fieldattribute));

        model.setProperty("/Parameters", filteredParams);
    }

    private onPressStep3() {
        this._readList();
    }

    private onPressAddList() {
        const model = this.getModel<JSONModel>("fsModel"),
            list = model.getProperty("/List"),
            _q: ListItem = {
                Fieldname: "",
                RetrievalType: "01",
                Function: ""
            };

        list.push(_q);

        model.setProperty("/List", list);
    }

    private onPressDeleteList(event: Event) {
        const _q = (event.getSource() as ManagedObject).getBindingContext("fsModel")?.getObject() as ListItem,
            model = this.getModel<JSONModel>("fsModel"),
            list = model.getProperty("/List"),
            filteredList = list.filter((x: ListItem) => (x.Fieldname !== _q.Fieldname ||
                x.RetrievalType !== _q.RetrievalType || x.Function !== _q.Function));

        model.setProperty("/List", filteredList);
    }


    private onChangeRType(event: Event) {
        let _q = (event.getSource() as ManagedObject).getBindingContext("fsModel")?.getObject() as ListItem;

        if (_q.RetrievalType !== "03")
            _q.Function = "";
    }

    private _clearModel() {
        const model = this.getModel<JSONModel>("fsModel");
        model.setProperty("/Reportheader", "");
        model.setProperty("/Devmodule", "");
        model.setProperty("/Devtype", "");
        model.setProperty("/Devreason", "");
        model.setProperty("/Devpurpose", "");
        model.setProperty("/Devprocedure", "");
        model.setProperty("/Authobj", "");

        model.setProperty("/Parameters", []);
        model.setProperty("/List", []);

        (this.byId("wizard") as Wizard).setCurrentStep(this.byId("step1") as WizardStep);
        (this.byId("step1") as WizardStep).setValidated(false);
        (this.byId("fsToAbapPage") as DynamicPage).setShowFooter(false);
        (this.byId("btnSave") as Button).setVisible(false);
    }

    private createDocumentDialog() {
        if (!this._documentDialog) {
            this._documentDialog = Fragment.load({
                id: this.getView()?.getId(),
                name: "com.ntt.chatgptportal.view.fragment.DocumentDialog",
                controller: this
            }).then((dialog) => {
                this.getView()?.addDependent(dialog as Dialog);
                return dialog;
            }) as Promise<Dialog>;
        }

        this._documentDialog.then((dialog) => {
            this._readDocuments(DocumentTypeEnum.FsToTs, dialog);
            dialog.open();
        });
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

        BusyIndicator.show();
        this.getModel<ODataModel>().read(`/${path}`, {
            success: (response: Header) => {
                const model = this.getModel<JSONModel>("fsModel");

                model.setProperty("/ProcessType", (response.Devreason !== "") ? ProcessTypeEnum.Update : ProcessTypeEnum.Create);
                model.setProperty("/Reportheader", response.Reportheader);
                model.setProperty("/Devmodule", response.Devmodule);
                model.setProperty("/Devtype", response.Devtype);
                model.setProperty("/Devreason", response.Devreason);
                model.setProperty("/Devpurpose", response.Devpurpose);
                model.setProperty("/Devprocedure", response.Devprocedure);
                model.setProperty("/Authobj", response.Authobj);

                (this.byId("step1") as WizardStep).setValidated(true);
                (this.byId("fsToAbapPage") as DynamicPage).setShowFooter(true);

                BusyIndicator.hide();
            }
        });
    }

    private _readParameter() {
        const data = this.getModel<JSONModel>("fsModel").getData(),
            filters: Array<Filter> = [new Filter("Projectid", FilterOperator.EQ, data.Projectid),
            new Filter("Developmentid", FilterOperator.EQ, data.Developmentid),
            new Filter("ProcessType", FilterOperator.EQ, data.ProcessType)];

        BusyIndicator.show();
        this.getModel<ODataModel>().read("/ParameterSet", {
            filters: filters,
            success: (response: any) => {
                const model = this.getModel<JSONModel>("fsModel");

                model.setProperty("/Parameters", response.results);
                BusyIndicator.hide();
            }
        });
    }

    private _readList() {
        const data = this.getModel<JSONModel>("fsModel").getData(),
            filters: Array<Filter> = [new Filter("Projectid", FilterOperator.EQ, data.Projectid),
            new Filter("Developmentid", FilterOperator.EQ, data.Developmentid),
            new Filter("ProcessType", FilterOperator.EQ, data.ProcessType)];

        BusyIndicator.show();
        this.getModel<ODataModel>().read("/ListSet", {
            filters: filters,
            success: (response: any) => {
                const model = this.getModel<JSONModel>("fsModel");

                model.setProperty("/List", response.results);
                (this.byId("btnSave") as Button).setVisible(true);
                BusyIndicator.hide();
            }
        });
    }

    private _readQuery(isFsToTs: boolean, docNo: string, langu: string) {
        const model = this.getModel<JSONModel>("fsModel"),
            type = (isFsToTs) ? DocumentTypeEnum.FsToTs : DocumentTypeEnum.TsToAbap,
            path = this.getModel<ODataModel>().createKey("FsQuerySet", {
                Projectid: model.getProperty("/Projectid"),
                Developmentid: model.getProperty("/Developmentid"),
                ProcessType: model.getProperty("/ProcessType"),
                IvDoctype: type,
                IvDocno: docNo,
                Doclangu: langu
            });

        this._type = type;

        BusyIndicator.show();
        this.getModel<ODataModel>().read(`/${path}`, {
            success: (response: any) => {
                this._docNo = docNo;
                this._createDynamicForm(response.EvQuery);
                // (this.byId("report") as TextArea).setValue(response.EvQuery);
                BusyIndicator.hide();
            }
        });
    }

    private _createQuery(isFsToTs: boolean, docNo?: string) {
        const model = this.getModel<JSONModel>("fsModel"),
            type = (isFsToTs) ? DocumentTypeEnum.FsToTs : DocumentTypeEnum.TsToAbap,
            _q = {
                Projectid: model.getProperty("/Projectid"),
                Developmentid: model.getProperty("/Developmentid"),
                ProcessType: model.getProperty("/ProcessType"),
                IvDoctype: type,
                IvDocno: docNo,
                Doclangu: sap.ui.getCore().getConfiguration().getLanguage()
            };

        this.openBusyDialog();
        this.getModel<ODataModel>().create(`/FsQuerySet`, _q, {
            success: (response: any) => {
                this._readDocuments(type);
                // (this.byId("report") as TextArea).setValue(response.EvQuery);
                this._createDynamicForm(response.EvQuery);
                this.closeBusyDialog();
            }
        });
    }

    private _updateQuery(isFsToTs: boolean, query: string) {
        const model = this.getModel<JSONModel>("fsModel"),
            type = (isFsToTs) ? DocumentTypeEnum.FsToTs : DocumentTypeEnum.TsToAbap,
            _q = {
                Projectid: model.getProperty("/Projectid"),
                Developmentid: model.getProperty("/Developmentid"),
                ProcessType: model.getProperty("/ProcessType"),
                IvDoctype: type,
                IvDocno: this._docNo,
                Doclangu: sap.ui.getCore().getConfiguration().getLanguage()
            },
            path = this.getModel<ODataModel>().createKey("FsQuerySet", _q);

        // @ts-ignore
        _q.EvQuery = query;

        BusyIndicator.show();
        this.getModel<ODataModel>().update(`/${path}`, _q, {
            success: (response: any) => {
                // (this.byId("report") as TextArea).setValue(response.EvQuery);
                this._readDocuments(type);
                // this.createSuccessDialog();
                MessageBox.success(this.getResourceBundle().getText("SuccessMsg") as string);
                BusyIndicator.hide();
            }
        });
    }

    private _saveHeader(data: Header) {

        // @ts-ignore
        delete data.Developmenttxt;
        // @ts-ignore
        delete data.Projecttxt;

        data.Return = [];

        BusyIndicator.show();
        this.getModel<ODataModel>().create("/HeaderSet", data, {
            success: (response: any) => {
                // this.createSuccessDialog();
                MessageBox.success(this.getResourceBundle().getText("SuccessMsg") as string);
                BusyIndicator.hide();
            }
        });
    }
}