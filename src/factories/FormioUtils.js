var formioUtils = require('formio-utils');

module.exports = function() {
  return {
    isVisible: function(component, subData, data, hide) {
      // If the component is in the hideComponents array, then hide it by default.
      if (Array.isArray(hide) && (hide.indexOf(component.key) !== -1)) {
        return false;
      }

      var allData;
      if (subData) {
        allData = Object.assign({}, data, subData);
      }
      else {
        allData = data;
      }

      // Show by default.
      var shown = true;

      // Check local submission first.
      if (subData) {
        shown &= formioUtils.checkCondition(component, subData);
      }

      // Check global data.
      if (shown && data) {
        shown &= formioUtils.checkCondition(component, data);
      }

      var timestamp = Date.now();

      // Break infinite loops when components show each other.
      component.count = component.count || 0;
      var diff = timestamp - (component.lastChanged || 0);
      if (component.hasOwnProperty('visible') && component.count >= 3 && (diff < 100)) {
        return component.visible;
      }
      else {
        component.count = 0;
      }

      component.visible = shown;
      component.lastChanged = timestamp;
      component.count++;

      // Make sure to delete the data for invisible fields.
      if (!shown && data && data.hasOwnProperty(component.key)) {
        delete data[component.key];
      }

      return shown;
    },
    flattenComponents: formioUtils.flattenComponents,
    eachComponent: formioUtils.eachComponent,
    getComponent: formioUtils.getComponent,
    getValue: formioUtils.getValue,
    hideFields: function(form, components) {
      this.eachComponent(form.components, function(component) {
        for (var i in components) {
          if (component.key === components[i]) {
            component.type = 'hidden';
          }
        }
      });
    },
    uniqueName: function(name) {
      var parts = name.toLowerCase().replace(/[^0-9a-z\.]/g, '').split('.');
      var fileName = parts[0];
      var ext = '';
      if (parts.length > 1) {
        ext = '.' + parts[(parts.length - 1)];
      }
      return fileName.substr(0, 10) + '-' + this.guid() + ext;
    },
    guid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    },
    fieldWrap: function(input) {
      input = input + '<formio-errors></formio-errors>';
      var multiInput = input.replace('data[component.key]', 'data[component.key][$index]');
      var inputLabel = '<label ng-if="component.label && !component.hideLabel" for="{{ component.key }}" class="control-label" ng-class="{\'field-required\': component.validate.required}">{{ component.label | formioTranslate }}</label>';
      var requiredInline = '<span ng-if="(component.hideLabel === true || component.label === \'\' || !component.label) && component.validate.required" class="glyphicon glyphicon-asterisk form-control-feedback field-required-inline" aria-hidden="true"></span>';
      var template =
        '<div ng-if="!component.multiple">' +
          inputLabel +
          '<div class="input-group">' +
            '<div class="input-group-addon" ng-if="!!component.prefix">{{ component.prefix }}</div>' +
            input +
            requiredInline +
            '<div class="input-group-addon" ng-if="!!component.suffix">{{ component.suffix }}</div>' +
          '</div>' +
        '</div>' +
        '<div ng-if="component.multiple"><table class="table table-bordered">' +
          inputLabel +
          '<tr ng-repeat="value in data[component.key] track by $index">' +
            '<td>' +
              '<div class="input-group">' +
                '<div class="input-group-addon" ng-if="!!component.prefix">{{ component.prefix }}</div>' +
                  multiInput +
                  requiredInline +
                '<div class="input-group-addon" ng-if="!!component.suffix">{{ component.suffix }}</div>' +
              '</div>' +
            '</td>' +
            '<td><a ng-click="removeFieldValue($index)" class="btn btn-default"><span class="glyphicon glyphicon-remove-circle"></span></a></td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="2"><a ng-click="addFieldValue()" class="btn btn-primary"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> {{ component.addAnother || "Add Another" | formioTranslate }}</a></td>' +
          '</tr>' +
        '</table></div>';
      return template;
    }
  };
};
