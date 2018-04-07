'use strict';

angular.module('batarang.scope-search', []).

directive('batScopeSearch', [
function batScopeSearchDirective(
){
  return {
    restrict: 'E',
    scope: {
      onSearch: '&',
    },
    controller: class {
      
      static get $inject() {return [
        '$scope',
        '$element',
      ]}
      constructor(
        $scope,
        $element,
      ){
        this.$scope = $scope;
        
        // Handle keyboard events exclusively in this component
        $element.on('keydown', (event) => {
          event.stopPropagation();
          
          if (event.keyCode == 27 /*escape*/){
            $scope.$apply(() => {
              this.clearSearch();
            });
          }
        });
        
        // local props
        this.searchText = '';
      }
      
      
      clearSearch(){
        this.searchText = '';
        this.onSearch({text: this.searchText});
      }
      
    },
    bindToController: true,
    controllerAs: '$ctrl',
    // language=HTML
    template: `

<div class="search-bar" style="order: 100;">
    <div class="toolbar-search">
        <div class="replace-toggle-toolbar toolbar"></div>
        <div class="toolbar-search-inputs">
            <div class="toolbar-search-control">
                <input is="history-input"
                       class="search-replace"
                       id="search-input-field"
                       placeholder="Find"
                       ng-model="$ctrl.searchText"
                       ng-change="$ctrl.onSearch({text: $ctrl.searchText})">
                <label class="search-results-matches" for="search-input-field"></label>
                
              
                <!--<div class="toolbar-search-navigation-controls">-->
                    <!--<div class="toolbar-search-navigation toolbar-search-navigation-prev"></div>-->
                    <!--<div class="toolbar-search-navigation toolbar-search-navigation-next"></div>-->
                <!--</div>-->
            </div>
            <!--<input class="search-replace toolbar-replace-control hidden" placeholder="Replace"></div>-->
        <div class="toolbar-search-buttons">
            <div class="first-row-buttons">
                <button
                  is="text-button"
                  type="button"
                  class="search-action-button"
                  ng-click="$ctrl.clearSearch()">
                  Clear
                </button>
            </div>
            <!--<div class="second-row-buttons hidden">-->
                <!--<button is="text-button" type="button" class="search-action-button" disabled="">Replace-->
                <!--</button>-->
                <!--<button is="text-button" type="button" class="search-action-button" disabled="">Replace-->
                    <!--all-->
                <!--</button>-->
            <!--</div>-->
        </div>
    </div>
</div>
`
  };
}]);

