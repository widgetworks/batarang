/*
2018-04-07
Injected into the page content - global helper to find the
element that belongs to a scope/id
*/
function scope2el(scopeOrId){
  var $ = angular.element;
  var id = scopeOrId.$id || scopeOrId;
  
  var slice = Array.prototype.slice;
  var find = Array.prototype.find;
  
  var foundEl = find.call(
    slice.call(document.querySelectorAll('.ng-scope')),
    findEl('scope')
  ); 
  if (!foundEl){
    foundEl = find.call(
      slice.call(document.querySelectorAll('.ng-isolate-scope')),
      findEl('isolateScope')
    );
  }
  
  return foundEl;
  
  function findEl(scopeFn) {
    return function(el){
      var scope = $(el)[scopeFn]();
      var foundScope = !!scope && scope.$id == id;
      return foundScope;
    }
  }
}
