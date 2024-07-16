import UI5Object from "sap/ui/base/Object";
import MessageBox from "sap/m/MessageBox";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import UIComponent from "sap/ui/core/UIComponent";
import Binding from "sap/ui/model/Binding";
import Event from "sap/ui/base/Event";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Message from "sap/ui/core/message/Message";

export default class ErrorHandler extends UI5Object {
  private _oComponent: UIComponent
  private _bMessageOpen: boolean;
  private oMessageModelBinding: Binding;


  constructor(oComponent: UIComponent) {
    super();
    const oMessageManager = sap.ui.getCore().getMessageManager();
    const oMessageModel = oMessageManager.getMessageModel();
    // @ts-ignore
    const oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
    const sErrorText = oResourceBundle.getText("errorText");
    const sMultipleErrors = oResourceBundle.getText("multipleErrorsText");

    this._oComponent = oComponent;
    this._bMessageOpen = false;

    this.oMessageModelBinding = oMessageModel.bindList("/", undefined,
      [], new Filter("technical", FilterOperator.EQ, true));

    this.oMessageModelBinding.attachChange((oEvent: Event) => {
      // @ts-ignore
      const aContexts = oEvent.getSource().getContexts();
      let aMessages: any[] | Message = [];
      let sErrorTitle;

      if (this._bMessageOpen || !aContexts.length) {
        return;
      }

      // Extract and remove the technical messages
      // @ts-ignore
      aContexts.forEach(function (oContext) {
        // @ts-ignore
        aMessages.push(oContext.getObject());
      });
      oMessageManager.removeMessages(aMessages);

      // Due to batching there can be more than one technical message. However the UX
      // guidelines say "display a single message in a message box" assuming that there
      // will be only one at a time.
      sErrorTitle = aMessages.length === 1 ? sErrorText : sMultipleErrors;
      if (aMessages[0].message) {
        sErrorTitle = aMessages[0].message;
      }

      this._showServiceError(sErrorTitle, aMessages[0].message);
    }, this);
  }

  private _showServiceError(sErrorTitle: string, sDetails: string) {
    
    BusyIndicator.hide();
    this._bMessageOpen = true;
    MessageBox.error(
      sErrorTitle,
      {
        id: "serviceErrorMessageBox",
        details: sDetails,
        actions: ["CLOSE"],
        onClose: () => {
          this._bMessageOpen = false;
        }
      }
    );
  }
}