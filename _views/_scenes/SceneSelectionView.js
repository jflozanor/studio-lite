/**
 SceneSelectionView Backbone > View
 @class SceneSelectionView
 @constructor
 @return {Object} instantiated SceneSelectionView
 **/
define(['jquery', 'backbone'], function ($, Backbone) {

    BB.SERVICES.SCENES_SELECTION_VIEW = 'SceneSelectionView';

    var SceneSelectionView = Backbone.View.extend({

        /**
         Constructor
         @method initialize
         **/
        initialize: function () {
            var self = this;
            self.m_selectedSceneID = undefined;
            self.m_sceneProperties = new BB.View({
                el: Elements.SCENE_SELECTION_PROPERTIES
            });

            self.m_propertiesPanel = BB.comBroker.getService(BB.SERVICES.PROPERTIES_VIEW);
            self.m_propertiesPanel.addView(this.m_sceneProperties);
            BB.comBroker.setService(BB.SERVICES['SCENES_SELECTION_VIEW'], this);

            self._render();
            self._listenAddRemoveScene();
        },

        /**
         Populate the LI with all available scenes from msdb
         @method _render
         **/
        _render: function () {
            var self = this;
            $(Elements.SCENE_SELECTOR_LIST).empty();
            var scenenames = BB.Pepper.getSceneNames();
            if (_.size(scenenames) == 0)
                return;
            _.forEach(scenenames, function (i_name, i_id) {
                var pseudoID = pepper.getPseudoIdFromSceneId(i_id);
                var snippet = '<a href="#" class="' + BB.lib.unclass(Elements.CLASS_CAMPIGN_LIST_ITEM) + ' list-group-item" data-sceneid="' + pseudoID + '">' +
                    '<h4>' + i_name + '</h4>' +
                    '<p class="list-group-item-text">' + '&nbsp;' + '</p>' +
                    '<div class="openProps">' +
                    '<button type="button" class="' + BB.lib.unclass(Elements.CLASS_OPEN_PROPS_BUTTON) + ' btn btn-default btn-sm"><i style="font-size: 1.5em" class="fa fa-tasks"></i></button>' +
                    '</div>' +
                    '</a>';
                $(Elements.SCENE_SELECTOR_LIST).append($(snippet));
            });

            this._listenOpenProps();
            this._listenSelectScene();
            this._listenInputChange();
        },

        /**
         Listen for user trigger on campaign selection and populate the properties panel
         @method _listenOpenProps
         @return none
         **/
        _listenOpenProps: function () {
            var self = this;
            $(Elements.CLASS_OPEN_PROPS_BUTTON, self.el).on('click', function (e) {
                $(Elements.CLASS_CAMPIGN_LIST_ITEM, self.el).removeClass('active');
                var elem = $(e.target).closest('a').addClass('active');
                self.m_selectedSceneID = $(elem).data('sceneid');
                var sceneID = pepper.getSceneIdFromPseudoId(self.m_selectedSceneID);
                var domSceneData = pepper.getScenePlayerdataDom(sceneID);
                var label = $(domSceneData).find('Player').attr('label');
                $(Elements.FORM_SCENE_NAME).val(label);
                self.m_propertiesPanel.selectView(self.m_sceneProperties);
                self.m_propertiesPanel.openPropertiesPanel();
                return false;
            });
        },

        /**
         Listen select scene
         @method _listenSelectScene
         @return none
         **/
        _listenSelectScene: function () {
            var self = this;
            $(Elements.CLASS_CAMPIGN_LIST_ITEM, self.el).on('click', function (e) {
                $(Elements.CLASS_CAMPIGN_LIST_ITEM, self.el).removeClass('active');
                $(this).addClass('active');
                self.m_selectedSceneID = $(this).data('sceneid');
                self.options.stackView.slideToPage(Elements.SCENE_SLIDER_VIEW, 'right');
                self.m_propertiesPanel.resetPropertiesView();
                return false;
            });
        },

        /**
         Wire changing of campaign name through scene properties
         @method _listenInputChange
         @return none
         **/
        _listenInputChange: function () {
            var self = this;
            var onChange = _.debounce(function (e) {
                var text = $(e.target).val();
                var sceneID = pepper.getSceneIdFromPseudoId(self.m_selectedSceneID);
                var domSceneData = pepper.getScenePlayerdataDom(sceneID);
                 $(domSceneData).find('Player').attr('label',text);
                pepper.setScenePlayerData(sceneID, (new XMLSerializer()).serializeToString(domSceneData));
                self.$el.find('[data-sceneid="' + self.m_selectedSceneID + '"]').find('h4').text(text);
            }, 333, false);
            $(Elements.FORM_SCENE_NAME).on("input", onChange);
        },

        /**
         Wire the UI including new scene creation and delete existing scene
         @method _listenAddRemoveScene
         **/
        _listenAddRemoveScene: function () {
            var self = this;

            $(Elements.NEW_SCENE).on('click', function (e) {
                self.m_selectedSceneID = -1;
                BB.comBroker.fire(BB.EVENTS.NEW_SCENE_ADD, this, null);
                self._render();
                return false;
            });

            $(Elements.REMOVE_SELECTED_SCENE).on('click', function (e) {
                return;
                if (self.m_selectedSceneID != -1) {
                    var selectedElement = self.$el.find('[data-campaignid="' + self.m_selectedCampaignID + '"]');
                    var allCampaignIDs = pepper.getStationCampaignIDs();
                    if (_.indexOf(allCampaignIDs, self.m_selectedCampaignID) == -1) {
                        bootbox.confirm($(Elements.MSG_BOOTBOX_SURE_DELETE_CAMPAIGN).text(), function (result) {
                            if (result == true) {
                                selectedElement.remove();
                                self._removeCampaignFromMSDB(self.m_selectedCampaignID);
                            }
                        });
                    } else {
                        bootbox.alert($(Elements.MSG_BOOTBOX_CANT_DELETE_COMP).text());
                        return false;
                    }
                } else {
                    bootbox.alert($(Elements.MSG_BOOTBOX_SELECT_COMP_FIRST).text());
                    return false;
                }
            });
        }
    });

    return SceneSelectionView;
});
