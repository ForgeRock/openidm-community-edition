/**
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 *
 * Copyright (c) 2011-2012 ForgeRock AS. All rights reserved.
 *
 * The contents of this file are subject to the terms
 * of the Common Development and Distribution License
 * (the License). You may not use this file except in
 * compliance with the License.
 *
 * You can obtain a copy of the License at
 * http://forgerock.org/license/CDDLv1.0.html
 * See the License for the specific language governing
 * permission and limitations under the License.
 *
 * When distributing Covered Code, include this CDDL
 * Header Notice in each file and include the License file
 * at http://forgerock.org/license/CDDLv1.0.html
 * If applicable, add the following below the CDDL Header,
 * with the fields enclosed by brackets [] replaced by
 * your own identifying information:
 * "Portions Copyrighted [year] [name of copyright owner]"
 */

/*global define, $, form2js, _, js2form, document, require */

/**
 * @author mbilski
 */
define("org/forgerock/openidm/ui/admin/workflow/tasks/TaskDetailsView", [
    "org/forgerock/commons/ui/common/main/AbstractView",
    "org/forgerock/commons/ui/common/main/ValidatorsManager",
    "org/forgerock/commons/ui/common/main/EventManager",
    "org/forgerock/commons/ui/common/util/Constants",
    "org/forgerock/openidm/ui/admin/workflow/WorkflowDelegate",
    "org/forgerock/openidm/ui/admin/workflow/FormManager",
    "org/forgerock/openidm/ui/admin/workflow/tasks/TemplateTaskForm",
    "org/forgerock/commons/ui/common/util/FormGenerationUtils",
    "org/forgerock/commons/ui/user/delegates/UserDelegate"
], function(AbstractView, validatorsManager, eventManager, constants, workflowManager, tasksFormManager, templateTaskForm, formGenerationUtils, userDelegate) {
    var TaskDetailsView = AbstractView.extend({
        template: "templates/admin/workflow/tasks/TaskDetailsTemplate.html",

        element: "#taskDetails",
        
        events: {
            "onValidate": "onValidate",
            "click input[name=saveButton]": "formSubmit"
        },
        
        formSubmit: function(event) {
            event.preventDefault();
            if(validatorsManager.formNotInvalid(this.$el)) {
                var params = form2js(this.$el.attr("id"), '.', false), param;
                delete params.saveButton;
                for (param in params) {
                    if (_.isNull(params[param])) {
                        delete params[param];
                    }
                }
                
                if (this.definitionFormPropertyMap) {
                    formGenerationUtils.changeParamsToMeetTheirTypes(params, this.definitionFormPropertyMap);
                }
                
                workflowManager.completeTask(this.task._id, params, _.bind(function() {
                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "completedTask");
                    eventManager.sendEvent(constants.ROUTE_REQUEST, {routeName: "", trigger: true});
                }, this));
            }
        },
        
        render: function(id, category, callback) { 
            this.data = _.extend(this.data, {category: category});
            
            this.parentRender(function() {
                workflowManager.getTask(id, _.bind(function(task) {
                    this.task = task;
                    
                    workflowManager.getTaskDefinition(task.processDefinitionId, task.taskDefinitionKey, _.bind(function(definition) {
                        
                        var template = this.getGenerationTemplate(definition), view, passJSLint;
                        delete this.definitionFormPropertyMap;
                        
                        if(definition.formResourceKey) {
                            view = require(tasksFormManager.getViewForForm(definition.formResourceKey));
                            if (view.render) {
                                view.render(task, category, null, callback);
                                return;
                            } else {
                                console.log("There is no view defined for " + definition.formResourceKey);
                            }
                        } 
                        
                        if(template !== false) {
                            templateTaskForm.render(task, category, template, _.bind(function() {
                                validatorsManager.bindValidators(this.$el);
                                validatorsManager.validateAllFields(this.$el);
                                
                                if(callback) {
                                    callback();
                                }
                            }, this));
                            return;
                        } else {
                            this.definitionFormPropertyMap = formGenerationUtils.buildPropertyTypeMap(definition.formProperties);
                            templateTaskForm.render(task, category, formGenerationUtils.generateTemplateFromFormProperties(definition), _.bind(function() {
                                validatorsManager.bindValidators(this.$el);
                                validatorsManager.validateAllFields(this.$el);
                                
                                if(callback) {
                                    callback();
                                }
                            }, this));
                            
                            return;
                        }
                    }, this));                  
                }, this));
            });            
        },
        
        getGenerationTemplate: function(definition) {
            var property;
            for(property in definition.formProperties) {
                if(property === "_formGenerationTemplate") {
                    return definition.formProperties[property].defaultExpression.expressionText;
                }
            }
            return false;
        }
    }); 
    
    return new TaskDetailsView();
});

