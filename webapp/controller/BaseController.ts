import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import AppComponent from "../Component";
import Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Router from "sap/ui/core/routing/Router";
import History from "sap/ui/core/routing/History";
import JSONModel from "sap/ui/model/json/JSONModel";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import View from "sap/ui/core/mvc/View";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default abstract class BaseController extends Controller {
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
}